import { Check, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { FieldError, FieldSet } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { CatalogData } from "@/lib/api/types"

import type { ReservationFormValues } from "../form"
import { StepLayout } from "../step-layout"

const TILE_GROUP =
  "[&>[data-state=on]]:border-primary [&>[data-state=on]]:bg-primary/10 [&>[data-state=on]]:text-primary"
// Search stays out of the way until a campus actually has a list worth scanning.
const SEARCH_THRESHOLD = 8

export function ClassStep({
  catalog,
  privilegedOnly = false,
}: {
  catalog: CatalogData
  privilegedOnly?: boolean
}) {
  const t = useTranslations("booking")
  const [query, setQuery] = useState("")
  const { control, getValues, setValue, clearErrors } = useFormContext<ReservationFormValues>()
  const visibleCampuses = useMemo(
    () =>
      privilegedOnly ? catalog.campuses.filter((campus) => campus.isPrivileged) : catalog.campuses,
    [catalog.campuses, privilegedOnly],
  )
  const [campusId, setCampusId] = useState(
    () =>
      catalog.classes.find((item) => item.id === getValues("classId"))?.campus ??
      visibleCampuses[0]?.id ??
      0,
  )
  const campus = catalog.campuses.find((item) => item.id === campusId)
  const campusClasses = useMemo(
    () => catalog.classes.filter((item) => item.campus === campusId),
    [catalog.classes, campusId],
  )
  const classes = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matched = needle
      ? campusClasses.filter((item) => item.name.toLowerCase().includes(needle))
      : campusClasses
    return [...matched].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  }, [campusClasses, query])

  function selectCampus(nextCampusId: number) {
    setCampusId(nextCampusId)
    setQuery("")
    const selectedClassCampus = catalog.classes.find(
      (item) => item.id === getValues("classId"),
    )?.campus
    if (selectedClassCampus !== nextCampusId) {
      setValue("classId", 0, { shouldValidate: false })
      setValue("isPrivileged", false, { shouldValidate: false })
    }
  }

  return (
    <StepLayout title={t("classTitle")} description={t("classDescription")}>
      <div className="flex min-w-0 flex-col gap-5">
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          aria-label={t("campusLabel")}
          value={String(campusId)}
          onValueChange={(value) => value && selectCampus(Number(value))}
          className="hidden w-full md:flex [&>[data-state=on]]:bg-primary [&>[data-state=on]]:text-primary-foreground"
        >
          {visibleCampuses.map((item) => (
            <ToggleGroupItem
              key={item.id}
              value={String(item.id)}
              className="h-10 min-w-0 flex-1 px-3"
            >
              <span className="truncate">{item.name}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="md:hidden">
          <Select value={String(campusId)} onValueChange={(value) => selectCampus(Number(value))}>
            <SelectTrigger aria-label={t("campusLabel")} className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibleCampuses.map((item) => (
                <SelectItem key={item.id} value={String(item.id)} className="min-h-11">
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Controller
          control={control}
          name="classId"
          render={({ field, fieldState }) => (
            <FieldSet className="min-w-0 gap-3" data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium">{campus?.name}</p>
                <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {query.trim()
                    ? t("classCountFiltered", {
                        shown: classes.length,
                        count: campusClasses.length,
                      })
                    : t("classCount", { count: campusClasses.length })}
                </p>
              </div>
              {campusClasses.length > SEARCH_THRESHOLD ? (
                <InputGroup className="h-11">
                  <InputGroupAddon>
                    <Search aria-hidden />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="class-search"
                    name="class-search"
                    type="search"
                    autoComplete="off"
                    aria-label={t("classSearch")}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("classSearch")}
                  />
                </InputGroup>
              ) : null}
              {classes.length ? (
                <ToggleGroup
                  type="single"
                  value={String(field.value)}
                  onValueChange={(value) => {
                    if (!value) return
                    const nextClass = catalog.classes.find((item) => item.id === Number(value))
                    const previousClass = catalog.classes.find((item) => item.id === field.value)
                    if (nextClass?.campus !== previousClass?.campus) {
                      setValue("bookingCampusId", campus?.isPrivileged ? 0 : campusId)
                      setValue("room", 0)
                      setValue("startTime", 0)
                      setValue("endTime", 0)
                    }
                    field.onChange(Number(value))
                    clearErrors("classId")
                    setValue("isPrivileged", Boolean(campus?.isPrivileged), {
                      shouldValidate: false,
                    })
                  }}
                  aria-label={t("classTitle")}
                  className="grid w-full grid-cols-1 sm:grid-cols-2 sm:gap-x-8"
                >
                  {classes.map((item) => {
                    const selected = field.value === item.id
                    return (
                      <ToggleGroupItem
                        key={item.id}
                        value={String(item.id)}
                        className="h-11 w-full justify-between rounded-none border-0 border-b bg-transparent px-1 font-normal hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary"
                      >
                        <span className="min-w-0 truncate text-left">{item.name}</span>
                        {selected ? <Check aria-hidden className="size-4" /> : null}
                      </ToggleGroupItem>
                    )
                  })}
                </ToggleGroup>
              ) : (
                <p className="text-sm text-muted-foreground">{t("classEmpty")}</p>
              )}
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
      </div>
    </StepLayout>
  )
}
