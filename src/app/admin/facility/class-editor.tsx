"use client"

import { useMemo, useState } from "react"
import { GraduationCap, Pencil, Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
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
import { CampusNameDialog } from "./campus-name-dialog"
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

      <CampusNameDialog
        key="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        title={t("newClass")}
        description={t("newClassDescription")}
        nameLabel={t("className")}
        campuses={campuses}
        working={working}
        onSave={(name, campus) => mutate(() => createClass(name, campus), t("classCreated"))}
      />
      {editing ? (
        <CampusNameDialog
          key={editing.id}
          open
          onOpenChange={(nextOpen) => !nextOpen && setEditingId(null)}
          mode="edit"
          title={t("renameClass")}
          description={t("newClassDescription")}
          nameLabel={t("className")}
          campuses={campuses}
          initialName={editing.name}
          initialCampus={String(editing.campus)}
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
