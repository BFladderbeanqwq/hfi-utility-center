"use client"

import { useId, useMemo, useState } from "react"
import { GraduationCap, Pencil, Plus } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClass, deleteClass, editClass } from "@/lib/api/catalog"
import type { Campus, SchoolClass } from "@/lib/api/types"
import { formatApiTimestamp } from "@/lib/date-time"

import { EmptyState } from "@/components/layout/data-state"
import {
  FacilityRowMenu,
  ResourceSection,
  type FacilityEditorActions,
  touchTarget,
} from "./facility-editor-actions"

export function ClassEditor({
  classes,
  campuses,
  mutate,
  working,
}: FacilityEditorActions & {
  classes: SchoolClass[]
  campuses: Campus[]
}) {
  const t = useTranslations("admin")
  const common = useTranslations("common")
  const locale = useLocale()
  const campusNames = new Map(campuses.map((campus) => [campus.id, campus.name]))
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }),
    [locale],
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const editing = classes.find((schoolClass) => schoolClass.id === editingId)

  return (
    <ResourceSection
      title={t("classes")}
      count={classes.length}
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
      {classes.length === 0 ? (
        <EmptyState icon={GraduationCap} title={t("classesEmpty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs text-muted-foreground">{t("facilityName")}</TableHead>
              <TableHead className="text-xs text-muted-foreground">{t("campus")}</TableHead>
              <TableHead className="hidden text-xs text-muted-foreground md:table-cell">
                {t("createdAt")}
              </TableHead>
              <TableHead className="w-0 text-right text-xs text-muted-foreground">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((schoolClass) => (
              <TableRow key={schoolClass.id}>
                <TableCell>
                  <span className="block max-w-[14rem] truncate font-medium">
                    {schoolClass.name}
                  </span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    #{schoolClass.id}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block max-w-[12rem] truncate">
                    {campusNames.get(schoolClass.campus) ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                  {formatApiTimestamp(dateFormatter, schoolClass.createdAt)}
                </TableCell>
                <TableCell className="w-0 text-right">
                  <ClassRowMenu
                    schoolClass={schoolClass}
                    mutate={mutate}
                    working={working}
                    onEdit={() => setEditingId(schoolClass.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ClassDialog
        key="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        schoolClass={undefined}
        campuses={campuses}
        working={working}
        onSave={(name, campus) => mutate(() => createClass(name, campus), t("classCreated"))}
      />
      {editing ? (
        <ClassDialog
          key={editing.id}
          open
          onOpenChange={(nextOpen) => !nextOpen && setEditingId(null)}
          mode="edit"
          schoolClass={editing}
          campuses={campuses}
          working={working}
          onSave={(name, campus) =>
            mutate(() => editClass(editing.id, name, campus), t("classUpdated"))
          }
        />
      ) : null}
    </ResourceSection>
  )
}

function ClassRowMenu({
  schoolClass,
  mutate,
  working,
  onEdit,
}: FacilityEditorActions & {
  schoolClass: SchoolClass
  onEdit: () => void
}) {
  const common = useTranslations("common")

  return (
    <FacilityRowMenu
      label={schoolClass.name}
      action={() => deleteClass(schoolClass.id)}
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

function ClassDialog({
  open,
  onOpenChange,
  mode,
  schoolClass,
  campuses,
  working,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  schoolClass?: SchoolClass
  campuses: Campus[]
  working: boolean
  onSave: (name: string, campus: number) => Promise<boolean>
}) {
  const t = useTranslations("admin")
  const common = useTranslations("common")
  const nameId = useId()
  const campusId = useId()
  const [name, setName] = useState(schoolClass?.name ?? "")
  const [campus, setCampus] = useState(schoolClass ? String(schoolClass.campus) : "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(schoolClass?.name ?? "")
      setCampus(schoolClass ? String(schoolClass.campus) : "")
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
          <DialogTitle>{mode === "create" ? t("newClass") : t("renameClass")}</DialogTitle>
          <DialogDescription>{t("newClassDescription")}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor={nameId}>{t("className")}</FieldLabel>
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
