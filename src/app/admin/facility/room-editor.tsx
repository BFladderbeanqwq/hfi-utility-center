"use client"

import { useId, useState } from "react"
import { DoorOpen, Pencil, Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createRoom, deleteRoom, editRoom } from "@/lib/api/catalog"
import type { Campus, Room } from "@/lib/api/types"
import { formatApiTimestamp } from "@/lib/date-time"

import { EmptyState } from "@/components/layout/data-state"
import {
  FacilityRowMenu,
  IconHint,
  ResourceSection,
  StateDot,
  type FacilityEditorActions,
  touchTarget,
} from "./facility-editor-actions"
import { PolicyEditor } from "./room-policy-editor"

export function RoomEditor({
  rooms,
  campuses,
  mutate,
  working,
}: FacilityEditorActions & {
  rooms: Room[]
  campuses: Campus[]
}) {
  const t = useTranslations("admin")
  const common = useTranslations("common")
  const campusNames = new Map(campuses.map((campus) => [campus.id, campus.name]))
  const dateFormatter = new Intl.DateTimeFormat(useLocale(), {
    dateStyle: "medium",
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const editing = rooms.find((room) => room.id === editingId)

  return (
    <ResourceSection
      title={t("rooms")}
      count={rooms.length}
      action={
        <Button
          variant="outline"
          size="sm"
          disabled={working || campuses.length === 0}
          onClick={() => setCreateOpen(true)}
          className={touchTarget}
        >
          <Plus aria-hidden />
          {common("add")}
        </Button>
      }
    >
      {rooms.length === 0 ? (
        <EmptyState icon={DoorOpen} title={t("roomsEmpty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs text-muted-foreground">{t("facilityName")}</TableHead>
              <TableHead className="text-xs text-muted-foreground">{t("status")}</TableHead>
              <TableHead className="text-xs text-muted-foreground">{t("campus")}</TableHead>
              <TableHead className="text-xs text-muted-foreground">{t("roomPolicies")}</TableHead>
              <TableHead className="hidden text-xs text-muted-foreground xl:table-cell">
                {t("createdAt")}
              </TableHead>
              <TableHead className="w-0 text-right text-xs text-muted-foreground">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>
                  <span className="block max-w-[14rem] truncate font-medium">{room.name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">#{room.id}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconHint label={room.enabled ? t("roomOpen") : t("roomClosed")}>
                      <span className="inline-flex">
                        <Switch
                          size="sm"
                          checked={room.enabled}
                          className="after:-inset-y-4 sm:after:-inset-y-2"
                          disabled={working}
                          aria-label={room.name}
                          onCheckedChange={() =>
                            mutate(
                              () => editRoom(room.id, room.name, room.campus, !room.enabled),
                              t("roomStatusUpdated"),
                            )
                          }
                        />
                      </span>
                    </IconHint>
                    <StateDot
                      enabled={room.enabled}
                      label={room.enabled ? common("enabled") : common("disabled")}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="block max-w-[10rem] truncate">
                    {campusNames.get(room.campus) ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <PolicyEditor room={room} mutate={mutate} working={working} />
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                  {formatApiTimestamp(dateFormatter, room.createdAt)}
                </TableCell>
                <TableCell className="w-0 text-right">
                  <RoomRowMenu
                    room={room}
                    mutate={mutate}
                    working={working}
                    onEdit={() => setEditingId(room.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <RoomDialog
        key="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        room={undefined}
        campuses={campuses}
        working={working}
        onSave={(name, campus) => mutate(() => createRoom(name, campus), t("roomCreated"))}
      />
      {editing ? (
        <RoomDialog
          key={editing.id}
          open
          onOpenChange={(nextOpen) => !nextOpen && setEditingId(null)}
          mode="edit"
          room={editing}
          campuses={campuses}
          working={working}
          onSave={(name, campus) =>
            mutate(() => editRoom(editing.id, name, campus, editing.enabled), t("roomUpdated"))
          }
        />
      ) : null}
    </ResourceSection>
  )
}

function RoomRowMenu({
  room,
  mutate,
  working,
  onEdit,
}: FacilityEditorActions & {
  room: Room
  onEdit: () => void
}) {
  const common = useTranslations("common")

  return (
    <FacilityRowMenu
      label={room.name}
      action={() => deleteRoom(room.id)}
      mutate={mutate}
      working={working}
    >
      <DropdownMenuItem onSelect={onEdit} disabled={working}>
        <Pencil aria-hidden />
        {common("edit")}
      </DropdownMenuItem>
    </FacilityRowMenu>
  )
}

function RoomDialog({
  open,
  onOpenChange,
  mode,
  room,
  campuses,
  working,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  room?: Room
  campuses: Campus[]
  working: boolean
  onSave: (name: string, campus: number) => Promise<boolean>
}) {
  const t = useTranslations("admin")
  const common = useTranslations("common")
  const nameId = useId()
  const campusId = useId()
  const [name, setName] = useState(room?.name ?? "")
  const [campus, setCampus] = useState(room ? String(room.campus) : "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(room?.name ?? "")
      setCampus(room ? String(room.campus) : "")
      setError("")
    }
    onOpenChange(nextOpen)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !campus) {
      setError(t("fieldRequired"))
      return
    }
    setSaving(true)
    setError("")
    try {
      if (await onSave(name.trim(), Number(campus))) onOpenChange(false)
    } catch {
      setError(common("unknown"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("newRoom") : t("renameRoom")}</DialogTitle>
          <DialogDescription>{t("roomName")}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor={nameId}>{t("roomName")}</FieldLabel>
            {/* Dialogs should focus their first field; the rule cannot see it from JSX. */}
            {/* oxlint-disable jsx-a11y/no-autofocus */}
            <Input
              id={nameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            {/* oxlint-enable jsx-a11y/no-autofocus */}
          </Field>
          <Field>
            <FieldLabel htmlFor={campusId}>{t("selectCampus")}</FieldLabel>
            <Select value={campus || undefined} onValueChange={setCampus}>
              <SelectTrigger id={campusId} className="w-full">
                <SelectValue placeholder={t("selectCampus")} />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" className={touchTarget}>
                {common("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={working || saving} className={touchTarget}>
              {mode === "create" ? <Plus aria-hidden /> : <Pencil aria-hidden />}
              {mode === "create" ? common("add") : common("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
