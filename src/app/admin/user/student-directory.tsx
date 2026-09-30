"use client"

import { Pencil, Plus, Trash2, UsersRound } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react"

import { ErrorState, LoadingState } from "@/components/layout/data-state"
import { SectionCard } from "@/components/layout/section-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getClasses } from "@/lib/api/catalog"
import {
  createStudent,
  deleteStudent,
  editStudent,
  getStudents,
  type StudentInput,
  type StudentRecord,
} from "@/lib/api/students"
import type { SchoolClass } from "@/lib/api/types"

const EMPTY_STUDENT: StudentInput = { email: "", name: "", classId: null }

type StudentEditorMode = "create" | "edit" | null

function filterStudents(students: StudentRecord[], query: string) {
  const needle = query.trim().toLowerCase()
  return students.filter((student) =>
    [student.email, student.name, student.className ?? ""].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  )
}

export function StudentDirectory() {
  const t = useTranslations("admin")
  const common = useTranslations("common")
  const { classes, loading, loadError, query, setQuery, matches, visible, load } =
    useStudentDirectoryData()
  const {
    editor,
    draft,
    setDraft,
    actionError,
    working,
    deleteTarget,
    openCreate,
    openEdit,
    requestDelete,
    closeEditor,
    closeDelete,
    save,
    remove,
  } = useStudentEditor(load)

  return (
    <SectionCard
      title={t("studentsTitle")}
      description={t("studentsDescription")}
      actions={
        <Button type="button" size="sm" disabled={loading || working} onClick={openCreate}>
          <Plus />
          {t("addStudent")}
        </Button>
      }
    >
      {loading ? (
        <LoadingState label={t("studentsLoading")} />
      ) : loadError ? (
        <ErrorState
          title={t("studentsLoadError")}
          retryLabel={common("refresh")}
          onRetry={() => void load()}
        />
      ) : (
        <StudentDirectoryBody
          query={query}
          onQueryChange={setQuery}
          students={visible}
          matchCount={matches.length}
          working={working}
          onEdit={openEdit}
          onRequestDelete={requestDelete}
        />
      )}

      <StudentEditorDialog
        editor={editor}
        classes={classes}
        draft={draft}
        setDraft={setDraft}
        actionError={actionError}
        working={working}
        onClose={closeEditor}
        onSubmit={save}
      />

      <StudentDeleteDialog
        target={deleteTarget}
        actionError={actionError}
        working={working}
        onClose={closeDelete}
        onConfirm={remove}
      />
    </SectionCard>
  )
}

function StudentDirectoryBody({
  query,
  onQueryChange,
  students,
  matchCount,
  working,
  onEdit,
  onRequestDelete,
}: {
  query: string
  onQueryChange: Dispatch<SetStateAction<string>>
  students: StudentRecord[]
  matchCount: number
  working: boolean
  onEdit: (student: StudentRecord) => void
  onRequestDelete: (student: StudentRecord) => void
}) {
  const t = useTranslations("admin")

  return (
    <div className="space-y-3">
      <Input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={t("studentSearch")}
        aria-label={t("studentSearch")}
        className="max-w-sm"
      />
      <p className="text-xs text-muted-foreground">
        {t("studentsShown", { shown: students.length, count: matchCount })}
      </p>
      {students.length ? (
        <StudentList
          students={students}
          working={working}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("studentsEmpty")}
        </p>
      )}
    </div>
  )
}

function StudentList({
  students,
  working,
  onEdit,
  onRequestDelete,
}: {
  students: StudentRecord[]
  working: boolean
  onEdit: (student: StudentRecord) => void
  onRequestDelete: (student: StudentRecord) => void
}) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {students.map((student) => (
        <StudentRow
          key={student.email}
          student={student}
          working={working}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </ul>
  )
}

function StudentRow({
  student,
  working,
  onEdit,
  onRequestDelete,
}: {
  student: StudentRecord
  working: boolean
  onEdit: (student: StudentRecord) => void
  onRequestDelete: (student: StudentRecord) => void
}) {
  const t = useTranslations("admin")

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-start gap-3">
        <UsersRound aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 text-sm">
          <p className="font-medium">{student.name}</p>
          <p className="break-all text-muted-foreground">{student.email}</p>
          <p className="text-xs text-muted-foreground">
            {student.className || t("studentNoClass")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("editStudent", { name: student.name })}
          disabled={working}
          onClick={() => onEdit(student)}
        >
          <Pencil />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("deleteStudent", { name: student.name })}
          disabled={working}
          onClick={() => onRequestDelete(student)}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  )
}

function StudentEditorDialog({
  editor,
  classes,
  draft,
  setDraft,
  actionError,
  working,
  onClose,
  onSubmit,
}: {
  editor: StudentEditorMode
  classes: SchoolClass[]
  draft: StudentInput
  setDraft: Dispatch<SetStateAction<StudentInput>>
  actionError: string
  working: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const t = useTranslations("admin")
  const common = useTranslations("common")

  return (
    <Dialog
      open={editor !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editor === "edit" ? t("editStudentTitle") : t("addStudent")}</DialogTitle>
          <DialogDescription>{t("studentEditorDescription")}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="student-email" className="text-sm font-medium">
              {t("email")}
            </label>
            <Input
              id="student-email"
              type="email"
              required
              value={draft.email}
              readOnly={editor === "edit"}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            />
            {editor === "edit" ? (
              <p className="text-xs text-muted-foreground">{t("studentEmailLocked")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor="student-name" className="text-sm font-medium">
              {t("name")}
            </label>
            <Input
              id="student-name"
              required
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="student-class" className="text-sm font-medium">
              {t("class")}
            </label>
            <Select
              value={draft.classId === null ? "none" : String(draft.classId)}
              onValueChange={(value) =>
                setDraft({ ...draft, classId: value === "none" ? null : Number(value) })
              }
            >
              <SelectTrigger id="student-class" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("studentNoClass")}</SelectItem>
                {classes.map((schoolClass) => (
                  <SelectItem key={schoolClass.id} value={String(schoolClass.id)}>
                    {schoolClass.name}
                  </SelectItem>
                ))}
                {draft.classId !== null && !classes.some((item) => item.id === draft.classId) ? (
                  <SelectItem value={String(draft.classId)} disabled>
                    {t("studentArchivedClass")}
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          {actionError && editor ? (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={working} onClick={onClose}>
              {common("cancel")}
            </Button>
            <Button type="submit" disabled={working}>
              {common("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StudentDeleteDialog({
  target,
  actionError,
  working,
  onClose,
  onConfirm,
}: {
  target: StudentRecord | null
  actionError: string
  working: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const t = useTranslations("admin")
  const common = useTranslations("common")

  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteStudentTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteStudentConfirm", { email: target?.email ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {actionError && target ? (
          <p role="alert" className="text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={working}>{common("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={working}
            onClick={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
          >
            {common("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function useStudentDirectoryData() {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [records, availableClasses] = await Promise.all([getStudents(), getClasses()])
      setStudents(records)
      setClasses(availableClasses)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all([getStudents(), getClasses()])
      .then(([records, availableClasses]) => {
        if (!active) return
        setStudents(records)
        setClasses(availableClasses)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const matches = filterStudents(students, query)

  return {
    classes,
    loading,
    loadError,
    query,
    setQuery,
    matches,
    visible: matches.slice(0, 100),
    load,
  }
}

function useStudentEditor(load: () => Promise<void>) {
  const [editor, setEditor] = useState<StudentEditorMode>(null)
  const [draft, setDraft] = useState<StudentInput>(EMPTY_STUDENT)
  const [deleteTarget, setDeleteTarget] = useState<StudentRecord | null>(null)
  const { actionError, working, run, clearError } = useStudentMutation(load)

  function openCreate() {
    clearError()
    setDraft(EMPTY_STUDENT)
    setEditor("create")
  }

  function openEdit(student: StudentRecord) {
    clearError()
    setDraft({ email: student.email, name: student.name, classId: student.classId })
    setEditor("edit")
  }

  function requestDelete(student: StudentRecord) {
    clearError()
    setDeleteTarget(student)
  }

  function closeEditor() {
    if (!working) setEditor(null)
  }

  function closeDelete() {
    if (!working) setDeleteTarget(null)
  }

  function resetEditor() {
    setEditor(null)
  }

  function resetDeleteTarget() {
    setDeleteTarget(null)
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (working || !editor) return
    const input = {
      email: draft.email.trim().toLowerCase(),
      name: draft.name.trim(),
      classId: draft.classId,
    }
    const pending = editor === "create" ? createStudent(input) : editStudent(input)
    void run(pending, resetEditor)
  }

  async function remove() {
    if (working || !deleteTarget) return
    await run(deleteStudent(deleteTarget.email), resetDeleteTarget)
  }

  return {
    editor,
    draft,
    setDraft,
    actionError,
    working,
    deleteTarget,
    openCreate,
    openEdit,
    requestDelete,
    closeEditor,
    closeDelete,
    save,
    remove,
  }
}

function useStudentMutation(load: () => Promise<void>) {
  const common = useTranslations("common")
  const [actionError, setActionError] = useState("")
  const [working, setWorking] = useState(false)

  function clearError() {
    setActionError("")
  }

  async function run(action: Promise<unknown>, onSuccess: () => void) {
    if (working) return
    setWorking(true)
    setActionError("")
    try {
      await action
      onSuccess()
      await load()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : common("unknown"))
    } finally {
      setWorking(false)
    }
  }

  return { actionError, working, run, clearError }
}
