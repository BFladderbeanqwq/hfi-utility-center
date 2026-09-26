import { Check, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { FieldError, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { CatalogData } from "@/lib/api/types"

import type { ReservationFormValues } from "../form"
import { StepLayout } from "../step-layout"

// Selected tiles get their emphasis from the primitive's own `data-state=on`,
// applied once on the group so every tile stays consistent.
const TILE_GROUP =
  "[&>[data-state=on]]:border-primary [&>[data-state=on]]:bg-primary/10 [&>[data-state=on]]:text-primary"

export function ClassStep({
  catalog,
  privilegedOnly = false,
}: {
  catalog: CatalogData
  privilegedOnly?: boolean
}) {
  const t = useTranslations("booking")
  const [query, setQuery] = useState("")
  const { control, getValues, setValue } = useFormContext<ReservationFormValues>()
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
  const classes = useMemo(
    () =>
      catalog.classes.filter(
        (item) => item.campus === campusId && item.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [catalog, campusId, query],
  )

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
    <StepLayout title={t("classTitle")}>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <FieldSet className="min-w-0 gap-3">
          <FieldLegend variant="label">{t("campusLabel")}</FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            value={String(campusId)}
            onValueChange={(value) => value && selectCampus(Number(value))}
            className={`flex w-full flex-col items-stretch gap-2 ${TILE_GROUP}`}
          >
            {visibleCampuses.map((item) => (
              <ToggleGroupItem
                key={item.id}
                value={String(item.id)}
                className="min-h-11 justify-start sm:min-h-8"
              >
                {item.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>

        <Controller
          control={control}
          name="classId"
          render={({ field, fieldState }) => (
            <FieldSet className="min-w-0 gap-3" data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">{campus?.name ?? t("classTitle")}</FieldLegend>
              <FieldGroup>
                <InputGroup className="[&_[data-slot=input-group]]:h-11 sm:[&_[data-slot=input-group]]:h-8">
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
              </FieldGroup>
              <ToggleGroup
                type="single"
                variant="outline"
                value={String(field.value)}
                onValueChange={(value) => {
                  if (!value) return
                  field.onChange(Number(value))
                  setValue("isPrivileged", Boolean(campus?.isPrivileged), {
                    shouldValidate: false,
                  })
                }}
                aria-label={t("classTitle")}
                className={`grid w-full grid-cols-2 gap-2 sm:grid-cols-3 ${TILE_GROUP}`}
              >
                {classes.map((item) => (
                  <ToggleGroupItem
                    key={item.id}
                    value={String(item.id)}
                    className="min-h-11 min-w-0 justify-start sm:min-h-8"
                  >
                    <span className="truncate">{item.name}</span>
                    {field.value === item.id ? <Check aria-hidden className="size-3.5" /> : null}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {!classes.length ? (
                <p className="text-sm text-muted-foreground">{t("classEmpty")}</p>
              ) : null}
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
      </div>
    </StepLayout>
  )
}
