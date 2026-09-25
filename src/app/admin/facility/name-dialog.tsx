"use client"

import { useId, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { touchTarget } from "./facility-editor-actions"

export function FacilityNameDialog({
  open,
  onOpenChange,
  mode,
  title,
  label,
  initialValue = "",
  working,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  title: string
  label: string
  initialValue?: string
  working: boolean
  onSave: (value: string) => Promise<boolean>
}) {
  const common = useTranslations("common")
  const inputId = useId()
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setValue(initialValue)
      setError("")
    }
    onOpenChange(nextOpen)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const normalized = value.trim()
    if (!normalized) {
      setError(label)
      return
    }
    setSaving(true)
    setError("")
    try {
      if (await onSave(normalized)) onOpenChange(false)
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
            {/* Dialogs should focus their first field; the rule cannot see it from JSX. */}
            {/* oxlint-disable jsx-a11y/no-autofocus */}
            <Input
              id={inputId}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoFocus
            />
            {/* oxlint-enable jsx-a11y/no-autofocus */}
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
