import { useEffect, useMemo, useState } from "react"
import { enUS, zhCN } from "date-fns/locale"
import { CalendarDays, RefreshCw } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Controller, useController, useFormContext, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { dateToInputValue, inputValueToDate } from "@/lib/date-time"
import type { Room } from "@/lib/api/types"
import { rangeIsAvailable } from "@/lib/reservations/availability"

import type { ReservationFormValues } from "../form"
import { StepLayout } from "../step-layout"
import {
  buildTimeOptions,
  timeCanBeSelected,
  timeIsSelected,
  timeShouldBeVisible,
  type TimeOption,
} from "./time-options"
import { useRoomAvailability } from "./use-room-availability"

export function DateTimeStep({
  rooms,
  privileged = false,
}: {
  rooms: Room[]
  privileged?: boolean
}) {
  const t = useTranslations("booking")
  const locale = useLocale()
  const { clearErrors, control, getValues, setValue } = useFormContext<ReservationFormValues>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [roomId, date] = useWatch({
    control,
    name: ["room", "date"],
  })
  const { field: startTimeField, fieldState: startTimeState } = useController({
    control,
    name: "startTime",
  })
  const { field: endTimeField, fieldState: endTimeState } = useController({
    control,
    name: "endTime",
  })
  const startTime = startTimeField.value
  const endTime = endTimeField.value
  const room = useMemo(() => rooms.find((candidate) => candidate.id === roomId), [roomId, rooms])
  const { availability, error, loading, refresh, clearError, reportError } = useRoomAvailability({
    room,
    date,
    privileged,
  })
  const today = useMemo(() => startOfToday(), [])
  const maximumDate = useMemo(() => addDays(today, 30), [today])
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }),
    [locale],
  )
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [locale],
  )
  const timeOptions = useMemo(() => buildTimeOptions(availability?.slots ?? []), [availability])
  const visibleTimeOptions = useMemo(() => {
    if (!availability) return []

    return timeOptions.filter((option) =>
      timeShouldBeVisible({
        option,
        slots: availability.slots,
        startTime,
        endTime,
      }),
    )
  }, [availability, endTime, startTime, timeOptions])

  useEffect(() => {
    if (!availability) return
    const selectedRange = getValues()
    if (!selectedRange.startTime || !selectedRange.endTime) return
    if (rangeIsAvailable(availability.slots, selectedRange.startTime, selectedRange.endTime)) {
      return
    }

    setValue("startTime", 0)
    setValue("endTime", 0)
    reportError(t("timeConflict"))
  }, [availability, getValues, reportError, setValue, t])

  function clearSelectedRange() {
    startTimeField.onChange(0)
    endTimeField.onChange(0)
    clearErrors(["startTime", "endTime"])
  }

  function selectRangeStart(timestamp: number) {
    startTimeField.onChange(timestamp)
    endTimeField.onChange(0)
    clearErrors("endTime")
  }

  function selectRangeEnd(timestamp: number) {
    if (availability && rangeIsAvailable(availability.slots, startTime, timestamp)) {
      endTimeField.onChange(timestamp)
      clearErrors("endTime")
      clearError()
      return
    }

    reportError(t("rangeUnavailable"))
  }

  function selectTime(option: TimeOption) {
    if (timeIsSelected(option.timestamp, startTime, endTime)) {
      clearSelectedRange()
      clearError()
      return
    }

    const startsNewRange = !startTime || Boolean(endTime) || option.timestamp < startTime
    if (startsNewRange) selectRangeStart(option.timestamp)
    else selectRangeEnd(option.timestamp)
  }

  function selectDate(selected: Date | undefined, onChange: (date: string) => void) {
    if (!selected) return
    clearError()
    clearSelectedRange()
    onChange(dateToInputValue(selected))
    setCalendarOpen(false)
  }

  function formatTime(value: number) {
    return timeFormatter.format(new Date(value * 1000))
  }

  function selectedRangeLabel() {
    if (startTime && endTime) {
      return t("selectedRange", {
        start: formatTime(startTime),
        end: formatTime(endTime),
      })
    }
    return startTime ? t("selectEndHint") : t("selectStartHint")
  }

  return (
    <StepLayout title={t("dateTimeTitle")} error={error}>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <FieldSet className="min-w-0 content-start gap-3" data-invalid={fieldState.invalid}>
              <div className="min-w-0">
                <FieldLegend variant="label">{t("dateTitle")}</FieldLegend>
                <FieldDescription>{t("dateDescription")}</FieldDescription>
              </div>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full justify-start font-normal sm:min-h-8"
                    aria-invalid={fieldState.invalid}
                    aria-label={t("dateTitle")}
                  >
                    <CalendarDays aria-hidden />
                    <span className="min-w-0 truncate">
                      {field.value
                        ? dateFormatter.format(inputValueToDate(field.value) ?? new Date())
                        : t("dateTitle")}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    showOutsideDays
                    locale={locale === "zh-CN" ? zhCN : enUS}
                    endMonth={maximumDate}
                    disabled={{ before: today, after: maximumDate }}
                    onSelect={(selected) => selectDate(selected, field.onChange)}
                  />
                </PopoverContent>
              </Popover>
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />

        {date ? (
          <FieldSet
            className="min-w-0 gap-3"
            data-invalid={startTimeState.invalid || endTimeState.invalid}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <FieldLegend variant="label">{t("timeRange")}</FieldLegend>
                <FieldDescription>{selectedRangeLabel()}</FieldDescription>
              </div>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={refresh}
                      aria-label={t("refresh")}
                      disabled={loading}
                      className="size-11 shrink-0 sm:size-8"
                    >
                      {loading ? <Spinner /> : <RefreshCw aria-hidden />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("refresh")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <FieldGroup>
              {loading ? (
                <div
                  className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5"
                  aria-live="polite"
                >
                  <span className="sr-only">{t("checking")}</span>
                  {Array.from({ length: 10 }, (_, index) => (
                    <Skeleton key={index} className="h-11 w-full sm:h-8" />
                  ))}
                </div>
              ) : null}

              {availability && !loading ? (
                <>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="size-2 rounded-full bg-success" />
                      {t("available")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="size-2 rounded-full bg-muted-foreground/40" />
                      {t("occupied")}
                    </span>
                  </div>
                  <div className="grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {visibleTimeOptions.map((option) => {
                      const selected = timeIsSelected(option.timestamp, startTime, endTime)
                      const selectable = timeCanBeSelected({
                        option,
                        slots: availability.slots,
                        startTime,
                        endTime,
                      })
                      const occupied = option.status === "occupied" && !selectable
                      return (
                        <Button
                          type="button"
                          key={option.timestamp}
                          disabled={!selectable && !selected}
                          aria-pressed={selected}
                          aria-label={`${formatTime(option.timestamp)}${occupied ? `, ${t("occupied")}` : ""}`}
                          variant={selected ? "default" : occupied ? "ghost" : "outline"}
                          className={
                            occupied
                              ? "min-h-11 text-muted-foreground line-through sm:min-h-8"
                              : "min-h-11 font-mono text-xs tabular-nums sm:min-h-8"
                          }
                          onClick={() => selectTime(option)}
                        >
                          {formatTime(option.timestamp)}
                        </Button>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </FieldGroup>
            <FieldError errors={[startTimeState.error, endTimeState.error]} />
          </FieldSet>
        ) : null}
      </div>
    </StepLayout>
  )
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
