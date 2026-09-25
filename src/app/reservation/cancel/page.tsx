"use client"

import type { ReactNode } from "react"
import { enUS, zhCN } from "date-fns/locale"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  FileText,
  MapPin,
  Monitor,
  Pencil,
  RefreshCw,
  Save,
  UserRound,
  XCircle,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { AppShell } from "@/components/layout/app-shell"
import { EmptyState, LoadingState } from "@/components/layout/data-state"
import { PageHeader } from "@/components/layout/page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getCatalog } from "@/lib/api/catalog"
import {
  cancelReservation,
  getAvailability,
  modifyReservation,
  previewCancellation,
  type CancellationPreview,
} from "@/lib/api/reservations"
import type { AvailabilityData, CatalogData, PurposeType, Room } from "@/lib/api/types"
import { dateToInputValue, inputValueToDate } from "@/lib/date-time"
import { rangeIsAvailable } from "@/lib/reservations/availability"

import {
  buildTimeOptions,
  timeCanBeSelected,
  timeIsSelected,
  timeShouldBeVisible,
  type TimeOption,
} from "../create/steps/time-options"

// Label/value pairs share one template so the label column never drifts.
const DETAIL =
  "grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-3 py-2.5 sm:grid-cols-[8.5rem_minmax(0,1fr)]"

const TILE_GROUP =
  "[&>[data-state=on]]:border-primary [&>[data-state=on]]:bg-primary/10 [&>[data-state=on]]:text-primary"

const STATUS_DOT = {
  approved: "bg-success",
  pending: "bg-warning",
  rejected: "bg-danger",
  cancelled: "bg-muted-foreground/40",
} as const

type EditDraft = {
  campus: number
  room: number
  date: string
  startTime: number
  endTime: number
}

function initialDraft(preview: CancellationPreview, rooms: Room[]): EditDraft {
  const room = rooms.find((item) => item.id === preview.roomId)
  return {
    campus: room?.campus || 0,
    room: preview.roomId,
    date: preview.startTime.slice(0, 10),
    startTime: new Date(preview.startTime).getTime() / 1000,
    endTime: new Date(preview.endTime).getTime() / 1000,
  }
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

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={DETAIL}>
      <dt className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{children}</dd>
    </div>
  )
}

export default function CancelReservationPage() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const locale = useLocale()
  const t = useTranslations("neo.management")
  const statusT = useTranslations("status")
  const bookingT = useTranslations("booking")
  const [preview, setPreview] = useState<CancellationPreview>()
  const [catalog, setCatalog] = useState<CatalogData>()
  const [draft, setDraft] = useState<EditDraft>()
  const [availability, setAvailability] = useState<AvailabilityData>()
  const [availabilityError, setAvailabilityError] = useState<string>()
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [availabilityReload, setAvailabilityReload] = useState(0)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [loading, setLoading] = useState(Boolean(token))
  const [working, setWorking] = useState(false)
  const [mode, setMode] = useState<"details" | "edit">("details")
  const [editStep, setEditStep] = useState<"location" | "time">("location")
  // The details ⇄ edit block is keyed on mode + editStep, so each move
  // remounts it and the slide plays on that mount. `hasSlid` is the first-paint
  // guard: the block a user lands on has no previous screen to slide from.
  const [slideDirection, setSlideDirection] = useState<"forward" | "back">("forward")
  const [hasSlid, setHasSlid] = useState(false)
  const slideKey = mode === "edit" ? `edit-${editStep}` : "details"

  function navigate(direction: "forward" | "back") {
    setSlideDirection(direction)
    setHasSlid(true)
  }

  const [result, setResult] = useState<"modified" | "cancelled">()
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!token) return
    let active = true
    Promise.all([previewCancellation(token), getCatalog()])
      .then(([reservation, nextCatalog]) => {
        if (!active) return
        const enabledCatalog = {
          ...nextCatalog,
          rooms: nextCatalog.rooms.filter((room) => room.enabled),
        }
        setPreview(reservation)
        setCatalog(enabledCatalog)
        setDraft(initialDraft(reservation, enabledCatalog.rooms))
      })
      .catch((reason) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : t("invalidLink"))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [t, token])

  const selectedRoom = useMemo(
    () => catalog?.rooms.find((room) => room.id === draft?.room),
    [catalog?.rooms, draft?.room],
  )
  const roomsForCampus = useMemo(
    () => catalog?.rooms.filter((room) => room.enabled && room.campus === draft?.campus) || [],
    [catalog?.rooms, draft?.campus],
  )

  useEffect(() => {
    if (mode !== "edit" || editStep !== "time" || !draft?.date || !selectedRoom || !preview) {
      return
    }
    let active = true
    Promise.resolve()
      .then(() => {
        if (!active) return undefined
        setLoadingAvailability(true)
        setAvailabilityError(undefined)
        return getAvailability(selectedRoom.id, draft.date, selectedRoom, preview.reservationId)
      })
      .then((value) => {
        if (active && value) setAvailability(value)
      })
      .catch(() => {
        if (active) setAvailabilityError(bookingT("availabilityError"))
      })
      .finally(() => {
        if (active) setLoadingAvailability(false)
      })
    return () => {
      active = false
    }
  }, [availabilityReload, bookingT, draft?.date, editStep, mode, preview, selectedRoom])

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
  const timeOptions = useMemo(() => buildTimeOptions(availability?.slots || []), [availability])
  const visibleTimeOptions = useMemo(() => {
    if (!availability || !draft) return []
    return timeOptions.filter((option) =>
      timeShouldBeVisible({
        option,
        slots: availability.slots,
        startTime: draft.startTime,
        endTime: draft.endTime,
      }),
    )
  }, [availability, draft, timeOptions])

  function resetTimes(nextDate = draft?.date || "") {
    if (!draft) return
    setDraft({ ...draft, date: nextDate, startTime: 0, endTime: 0 })
    setAvailability(undefined)
    setAvailabilityError(undefined)
  }

  function selectTime(option: TimeOption) {
    if (!draft || !availability) return
    if (timeIsSelected(option.timestamp, draft.startTime, draft.endTime)) {
      setDraft({ ...draft, startTime: 0, endTime: 0 })
      return
    }
    if (!draft.startTime || draft.endTime || option.timestamp < draft.startTime) {
      setDraft({ ...draft, startTime: option.timestamp, endTime: 0 })
      return
    }
    if (rangeIsAvailable(availability.slots, draft.startTime, option.timestamp)) {
      setDraft({ ...draft, endTime: option.timestamp })
    } else {
      setAvailabilityError(bookingT("rangeUnavailable"))
    }
  }

  async function saveChanges() {
    if (!draft || !preview || !availability) return
    if (!rangeIsAvailable(availability.slots, draft.startTime, draft.endTime)) {
      setAvailabilityError(bookingT("rangeUnavailable"))
      return
    }
    setWorking(true)
    setError(undefined)
    try {
      await modifyReservation(token, {
        room: draft.room,
        startTime: draft.startTime,
        endTime: draft.endTime,
        reason: preview.reason,
        purposeType: preview.purposeType || "personal",
        needsMultimedia: preview.needsMultimedia,
      })
      const refreshed = await previewCancellation(token)
      setPreview(refreshed)
      setDraft(initialDraft(refreshed, catalog?.rooms || []))
      setResult("modified")
      navigate("back")
      setMode("details")
      setEditStep("location")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("modifyFailed"))
    } finally {
      setWorking(false)
    }
  }

  async function confirmCancellation() {
    setWorking(true)
    setError(undefined)
    try {
      await cancelReservation(token)
      setResult("cancelled")
      navigate("back")
      setMode("details")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("cancelFailed"))
    } finally {
      setWorking(false)
    }
  }

  const purposeKey = (preview?.purposeType || "personal") as PurposeType
  const formatTime = (value: number) => timeFormatter.format(new Date(value * 1000))

  return (
    <AppShell width="narrow">
      <PageHeader title={t("title")} />

      <div className="flex min-w-0 flex-col gap-4">
        {!token ? (
          <EmptyState
            icon={XCircle}
            title={t("unavailable")}
            description={t("invalidLink")}
            action={
              <Button asChild variant="outline" className="min-h-11 sm:min-h-8">
                <Link href="/">{t("home")}</Link>
              </Button>
            }
          />
        ) : null}

        {loading ? (
          <div className="flex min-w-0 flex-col gap-3">
            <LoadingState label={t("loading")} rows={3} />
            <p className="text-sm text-muted-foreground">{t("loadingDescription")}</p>
          </div>
        ) : null}

        {!loading && token && !preview ? (
          <EmptyState
            icon={XCircle}
            title={t("unavailable")}
            description={error ?? t("invalidLink")}
            action={
              <Button asChild variant="outline" className="min-h-11 sm:min-h-8">
                <Link href="/">{t("home")}</Link>
              </Button>
            }
          />
        ) : null}

        {result === "cancelled" ? (
          <EmptyState
            icon={
              <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
            }
            title={t("cancelledTitle")}
            description={t("cancelledDescription")}
            action={
              <>
                <Button asChild className="min-h-11 sm:min-h-8">
                  <Link href="/reservation/create">{t("bookAgain")}</Link>
                </Button>
                <Button asChild variant="outline" className="min-h-11 sm:min-h-8">
                  <Link href="/">{t("home")}</Link>
                </Button>
              </>
            }
          />
        ) : null}

        {preview && catalog && draft && result !== "cancelled" ? (
          <div className="t-reveal">
            <section className="flex min-w-0 flex-col gap-4">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h2 className="flex min-w-0 items-center gap-2 text-base font-medium break-words">
                  <MapPin aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  {preview.roomName}
                </h2>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${STATUS_DOT[preview.status]}`}
                  />
                  {statusT(preview.status)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                {t("remainingEdits", { count: preview.remainingEdits })}
              </p>

              {result === "modified" ? (
                <Alert>
                  <CheckCircle2 aria-hidden />
                  <AlertTitle className="break-words">{t("modifiedTitle")}</AlertTitle>
                  <AlertDescription className="break-words">
                    {t("modifiedDescription")}
                  </AlertDescription>
                </Alert>
              ) : null}
              {error ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle aria-hidden />
                  <AlertDescription className="break-words">{error}</AlertDescription>
                </Alert>
              ) : null}

              <div
                key={slideKey}
                data-compact=""
                data-direction={slideDirection}
                data-animate={hasSlid ? "" : undefined}
                className="t-page-slide flex min-w-0 flex-col gap-4"
              >
                {mode === "details" ? (
                  <>
                    <dl className="flex min-w-0 flex-col divide-y divide-border">
                      <DetailRow label={t("date")}>
                        <span className="font-mono text-xs">
                          {dateFormatter.format(new Date(preview.startTime))}
                        </span>
                      </DetailRow>
                      <DetailRow label={t("time")}>
                        <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
                          <Clock3 aria-hidden className="size-3.5 text-muted-foreground" />
                          {preview.startTime.slice(11, 16)} – {preview.endTime.slice(11, 16)}
                        </span>
                      </DetailRow>
                      <DetailRow label={t("reservedBy")}>
                        <span className="flex items-center gap-1.5">
                          <UserRound aria-hidden className="size-3.5 text-muted-foreground" />
                          {preview.studentName}
                        </span>
                      </DetailRow>
                      <DetailRow label={t("purpose")}>
                        <span className="flex items-center gap-1.5">
                          <FileText aria-hidden className="size-3.5 text-muted-foreground" />
                          {t(`purposeOptions.${purposeKey}`)}
                        </span>
                      </DetailRow>
                      <DetailRow label={t("multimedia")}>
                        <span className="flex items-center gap-1.5">
                          <Monitor aria-hidden className="size-3.5 text-muted-foreground" />
                          {preview.needsMultimedia ? t("required") : t("notRequired")}
                        </span>
                      </DetailRow>
                      <DetailRow label={t("reason")}>
                        <span className="flex items-start gap-1.5">
                          <FileText
                            aria-hidden
                            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                          />
                          {preview.reason}
                        </span>
                      </DetailRow>
                    </dl>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        type="button"
                        disabled={preview.remainingEdits <= 0}
                        onClick={() => {
                          setError(undefined)
                          setResult(undefined)
                          navigate("forward")
                          setEditStep("location")
                          setMode("edit")
                        }}
                        className="min-h-11 sm:min-h-8"
                      >
                        <Pencil aria-hidden />
                        {t("modify")}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            className="min-h-11 sm:min-h-8"
                          >
                            <XCircle aria-hidden />
                            {t("cancelReservation")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("cancelConfirmDescription", {
                                date: preview.startTime.slice(0, 10),
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="min-h-11 sm:min-h-8">
                              {t("keepReservation")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void confirmCancellation()}
                              disabled={working}
                              className="min-h-11 sm:min-h-8"
                            >
                              {working ? <Spinner /> : null}
                              {t("confirmCancel")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button asChild variant="ghost" className="min-h-11 sm:min-h-8">
                        <Link href="/">{t("home")}</Link>
                      </Button>
                    </div>
                  </>
                ) : null}

                {mode === "edit" ? (
                  <div className="flex min-w-0 flex-col gap-4">
                    <ol className="flex items-center gap-2 text-xs">
                      {(["location", "time"] as const).map((step, index) => {
                        const active = editStep === step
                        return (
                          <li key={step} className="flex items-center gap-2">
                            <span
                              aria-current={active ? "step" : undefined}
                              className={
                                active
                                  ? "flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
                                  : "flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                              }
                            >
                              {index + 1}
                            </span>
                            <span className={active ? "font-medium" : "text-muted-foreground"}>
                              {step === "location" ? t("selectLocation") : t("selectDateTime")}
                            </span>
                            {index === 0 ? (
                              <ArrowRight aria-hidden className="text-muted-foreground" />
                            ) : null}
                          </li>
                        )
                      })}
                    </ol>

                    {editStep === "location" ? (
                      <div className="flex min-w-0 flex-col gap-4">
                        <FieldSet className="min-w-0 gap-3">
                          <FieldLegend variant="label">{t("selectLocation")}</FieldLegend>
                          <FieldDescription>{t("locationHint")}</FieldDescription>
                          <ToggleGroup
                            type="single"
                            variant="outline"
                            value={String(draft.campus)}
                            onValueChange={(value) => {
                              if (!value) return
                              setDraft({
                                ...draft,
                                campus: Number(value),
                                room: 0,
                                startTime: 0,
                                endTime: 0,
                              })
                              setAvailability(undefined)
                            }}
                            className={`flex w-full flex-wrap items-stretch gap-2 ${TILE_GROUP}`}
                          >
                            {catalog.campuses
                              .filter((campus) => !campus.isPrivileged)
                              .map((campus) => (
                                <ToggleGroupItem
                                  key={campus.id}
                                  value={String(campus.id)}
                                  className="min-h-11 flex-1 sm:min-h-8"
                                >
                                  {campus.name}
                                </ToggleGroupItem>
                              ))}
                          </ToggleGroup>
                        </FieldSet>

                        <FieldSet className="min-w-0 gap-3">
                          <FieldLegend variant="label">
                            {bookingT("rooms")} ·{" "}
                            {t("availableSpaces", { count: roomsForCampus.length })}
                          </FieldLegend>
                          <ToggleGroup
                            type="single"
                            variant="outline"
                            value={String(draft.room)}
                            onValueChange={(value) => {
                              if (!value) return
                              setDraft({
                                ...draft,
                                room: Number(value),
                                startTime: 0,
                                endTime: 0,
                              })
                              setAvailability(undefined)
                            }}
                            aria-label={bookingT("rooms")}
                            className={`grid w-full grid-cols-1 gap-2 sm:grid-cols-2 ${TILE_GROUP}`}
                          >
                            {roomsForCampus.map((room) => (
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
                        </FieldSet>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setDraft(initialDraft(preview, catalog.rooms))
                              navigate("back")
                              setMode("details")
                            }}
                            className="min-h-11 sm:min-h-8"
                          >
                            {t("exitModify")}
                          </Button>
                          <Button
                            type="button"
                            disabled={!draft.room}
                            onClick={() => {
                              navigate("forward")
                              setEditStep("time")
                            }}
                            className="min-h-11 sm:min-h-8"
                          >
                            {t("next")}
                            <ArrowRight aria-hidden />
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {editStep === "time" ? (
                      <div className="flex min-w-0 flex-col gap-4">
                        {availabilityError ? (
                          <Alert variant="destructive">
                            <AlertTriangle aria-hidden />
                            <AlertDescription className="break-words">
                              {availabilityError}
                            </AlertDescription>
                          </Alert>
                        ) : null}

                        <FieldSet className="min-w-0 gap-3">
                          <FieldLegend variant="label">{t("selectDateTime")}</FieldLegend>
                          <FieldLabel htmlFor="cancel-date">{bookingT("dateTitle")}</FieldLabel>
                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                id="cancel-date"
                                type="button"
                                variant="outline"
                                className="min-h-11 w-full justify-start font-normal sm:min-h-8"
                              >
                                <CalendarDays aria-hidden />
                                <span className="min-w-0 truncate">
                                  {draft.date
                                    ? dateFormatter.format(
                                        inputValueToDate(draft.date) ?? new Date(),
                                      )
                                    : bookingT("dateTitle")}
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                showOutsideDays
                                locale={locale === "zh-CN" ? zhCN : enUS}
                                selected={inputValueToDate(draft.date)}
                                defaultMonth={inputValueToDate(draft.date) || today}
                                startMonth={today}
                                endMonth={maximumDate}
                                disabled={{ before: today, after: maximumDate }}
                                onSelect={(selected) => {
                                  if (!selected) return
                                  resetTimes(dateToInputValue(selected))
                                  setCalendarOpen(false)
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          <FieldDescription>
                            {selectedRoom ? `${t("room")}: ${selectedRoom.name}` : ""}
                          </FieldDescription>
                        </FieldSet>

                        <FieldSet className="min-w-0 gap-3">
                          <div className="flex min-w-0 items-start justify-between gap-2">
                            <div className="min-w-0">
                              <FieldLegend variant="label">{bookingT("timeRange")}</FieldLegend>
                              <FieldDescription>
                                {draft.startTime && draft.endTime
                                  ? bookingT("selectedRange", {
                                      start: formatTime(draft.startTime),
                                      end: formatTime(draft.endTime),
                                    })
                                  : draft.startTime
                                    ? bookingT("selectEndHint")
                                    : bookingT("selectStartHint")}
                              </FieldDescription>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={bookingT("refresh")}
                              disabled={loadingAvailability}
                              onClick={() => setAvailabilityReload((value) => value + 1)}
                              className="size-11 shrink-0 sm:size-8"
                            >
                              {loadingAvailability ? <Spinner /> : <RefreshCw aria-hidden />}
                            </Button>
                          </div>

                          {loadingAvailability ? (
                            <div
                              className="flex min-h-20 items-center gap-2 text-sm text-muted-foreground"
                              aria-live="polite"
                            >
                              <Spinner />
                              {bookingT("checking")}
                            </div>
                          ) : null}

                          {availability && !loadingAvailability ? (
                            <>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <span aria-hidden className="size-2 rounded-full bg-success" />
                                  {bookingT("available")}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <span
                                    aria-hidden
                                    className="size-2 rounded-full bg-muted-foreground/40"
                                  />
                                  {bookingT("occupied")}
                                </span>
                              </div>
                              <div className="grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                                {visibleTimeOptions.map((option) => {
                                  const selected = timeIsSelected(
                                    option.timestamp,
                                    draft.startTime,
                                    draft.endTime,
                                  )
                                  const selectable = timeCanBeSelected({
                                    option,
                                    slots: availability.slots,
                                    startTime: draft.startTime,
                                    endTime: draft.endTime,
                                  })
                                  const occupied = option.status === "occupied" && !selectable
                                  return (
                                    <Button
                                      type="button"
                                      key={option.timestamp}
                                      disabled={!selectable && !selected}
                                      aria-pressed={selected}
                                      variant={
                                        selected ? "default" : occupied ? "ghost" : "outline"
                                      }
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
                        </FieldSet>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={working}
                            onClick={() => setEditStep("location")}
                            className="min-h-11 sm:min-h-8"
                          >
                            <ArrowLeft aria-hidden />
                            {t("previous")}
                          </Button>
                          <Button
                            type="button"
                            disabled={working || !draft.startTime || !draft.endTime}
                            onClick={() => void saveChanges()}
                            className="min-h-11 sm:min-h-8"
                          >
                            {working ? <Spinner /> : <Save aria-hidden />}
                            {t("save")}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
