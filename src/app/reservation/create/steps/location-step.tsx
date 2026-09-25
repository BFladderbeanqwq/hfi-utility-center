import { DoorOpen } from "lucide-react"
import { useTranslations } from "next-intl"
import { Controller, useFormContext, useWatch } from "react-hook-form"

import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { CatalogData } from "@/lib/api/types"

import type { ReservationFormValues } from "../form"
import { StepLayout } from "../step-layout"

const TILE_GROUP =
  "[&>[data-state=on]]:border-primary [&>[data-state=on]]:bg-primary/10 [&>[data-state=on]]:text-primary"

export function LocationStep({ catalog }: { catalog: CatalogData }) {
  const t = useTranslations("booking")
  const { control, setValue } = useFormContext<ReservationFormValues>()
  const campusId = useWatch({ control, name: "bookingCampusId" })
  const rooms = catalog.rooms.filter((room) => room.campus === campusId && room.enabled)

  function clearSelectedTime() {
    setValue("startTime", 0)
    setValue("endTime", 0)
  }

  return (
    <StepLayout title={t("locationTitle")}>
      <Controller
        control={control}
        name="bookingCampusId"
        render={({ field, fieldState }) => (
          <FieldSet className="min-w-0 gap-3" data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">{t("campus")}</FieldLegend>
            <ToggleGroup
              type="single"
              variant="outline"
              value={String(campusId)}
              onValueChange={(value) => {
                if (!value) return
                field.onChange(Number(value))
                setValue("room", 0)
                clearSelectedTime()
              }}
              className={`flex w-full flex-wrap items-stretch gap-2 ${TILE_GROUP}`}
            >
              {catalog.campuses
                .filter((campus) => !campus.isPrivileged)
                .map((campus) => (
                  <ToggleGroupItem
                    type="button"
                    key={campus.id}
                    value={String(campus.id)}
                    className="min-h-11 flex-1 sm:min-h-8"
                  >
                    {campus.name}
                  </ToggleGroupItem>
                ))}
            </ToggleGroup>
            <FieldError errors={[fieldState.error]} />
          </FieldSet>
        )}
      />

      {campusId ? (
        <Controller
          control={control}
          name="room"
          render={({ field, fieldState }) => (
            <FieldSet className="mt-6 min-w-0 gap-3" data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">
                {t("rooms")} · {t("availableRooms", { count: rooms.length })}
              </FieldLegend>
              <ToggleGroup
                type="single"
                variant="outline"
                value={String(field.value)}
                onValueChange={(value) => {
                  if (!value) return
                  field.onChange(Number(value))
                  clearSelectedTime()
                }}
                aria-label={t("rooms")}
                className={`grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 ${TILE_GROUP}`}
              >
                {rooms.map((room) => (
                  <ToggleGroupItem
                    key={room.id}
                    value={String(room.id)}
                    className="min-h-11 min-w-0 justify-start gap-2 px-3 sm:min-h-12"
                  >
                    <DoorOpen aria-hidden className="size-4 shrink-0 opacity-70" />
                    <span className="truncate">{room.name}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {!rooms.length ? (
                <p className="text-sm text-muted-foreground">{t("roomEmpty")}</p>
              ) : null}
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
      ) : null}
    </StepLayout>
  )
}
