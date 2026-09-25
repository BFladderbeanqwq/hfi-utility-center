"use client"

import { useMemo, useState } from "react"
import { DoorOpen, Pencil, Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
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
import { CampusNameDialog } from "./campus-name-dialog"
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
  const locale = useLocale()
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }),
    [locale],
  )
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

      <CampusNameDialog
        key="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        title={t("newRoom")}
        description={t("roomName")}
        nameLabel={t("roomName")}
        campuses={campuses}
        working={working}
        onSave={(name, campus) => mutate(() => createRoom(name, campus), t("roomCreated"))}
      />
      {editing ? (
        <CampusNameDialog
          key={editing.id}
          open
          onOpenChange={(nextOpen) => !nextOpen && setEditingId(null)}
          mode="edit"
          title={t("renameRoom")}
          description={t("roomName")}
          nameLabel={t("roomName")}
          campuses={campuses}
          initialName={editing.name}
          initialCampus={String(editing.campus)}
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
