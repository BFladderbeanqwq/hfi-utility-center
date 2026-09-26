"use client"

import { Building2, CalendarPlus, SearchX } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import type { ReactNode } from "react"

import { EmptyState } from "@/components/layout/data-state"
import { StatusBadge, type StatusTone } from "@/components/layout/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { dateToInputValue } from "@/lib/date-time"
import { DAY_END_HOUR, DAY_START_HOUR } from "@/lib/reservations/availability"
import { cn } from "@/lib/utils"

import { reservationSearchHref } from "../reservation/search/search-query"
import { dayWindow, formatDayHour, type RoomDay, type RoomDayStatus } from "./room-day"
import type { Formatters } from "./use-facility-formatters"

const TONE_BY_STATUS: Record<RoomDayStatus, StatusTone> = {
  free: "success",
  "in-use": "info",
  pending: "pending",
  closed: "neutral",
}

/**
 * One card per room-day: status badge, a headline describing the live state,
 * a day timeline with the bookings plotted on it, the next few bookings, and
 * actions to book or to inspect today in search. Pure rendering over the
 * view model — all grouping and filtering decisions live in the dashboard.
 */
export function FacilityRoomBoard({
  days,
  totalRooms,
  now,
  loading,
  error,
  portrait,
  formatters,
  onResetFilters,
}: {
  days: RoomDay[]
  totalRooms: number
  now: Date
  loading: boolean
  error: boolean
  portrait: boolean
  formatters: Formatters
  onResetFilters: () => void
}) {
  const t = useTranslations("dashboard")

  if (loading && totalRooms === 0) {
    return (
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, slot) => `room-skeleton-${slot + 1}`).map((key) => (
          <Card key={key} size="sm" aria-hidden="true">
            <CardHeader>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </CardHeader>
            <CardContent className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (totalRooms === 0) {
    // First-load failure is reported by the dashboard error banner instead.
    if (error || loading) return null
    return (
      <EmptyState icon={Building2} title={t("noRooms")} description={t("noRoomsDescription")} />
    )
  }

  if (days.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("noResults")}
        description={t("noResultsDescription")}
        action={
          <Button type="button" variant="outline" size="sm" onClick={onResetFilters}>
            {t("resetFilters")}
          </Button>
        }
      />
    )
  }

  const { start, end } = dayWindow(now)
  const nowMs = now.getTime()
  const nowPct = Math.min(100, Math.max(0, ((nowMs - start) / Math.max(1, end - start)) * 100))
  const showNow = nowMs >= start && nowMs <= end
  const today = dateToInputValue(now)

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {days.map((day) => (
        <RoomDayCard
          key={day.room.id}
          day={day}
          nowMs={nowMs}
          nowPct={nowPct}
          showNow={showNow}
          today={today}
          portrait={portrait}
          formatters={formatters}
        />
      ))}
    </div>
  )
}

function RoomDayCard({
  day,
  nowMs,
  nowPct,
  showNow,
  today,
  portrait,
  formatters,
}: {
  day: RoomDay
  nowMs: number
  nowPct: number
  showNow: boolean
  today: string
  portrait: boolean
  formatters: Formatters
}) {
  const t = useTranslations("dashboard")
  const statusT = useTranslations("status")
  const fallback = t("purposeFallback")
  const statusLabel =
    day.status === "free"
      ? t("statusFree")
      : day.status === "in-use"
        ? t("inUse")
        : day.status === "pending"
          ? t("pendingApproval")
          : t("statusClosed")

  const description = day.campusName
    ? `${day.campusName} · ${t("bookingsCount", { count: day.bookings.length })}`
    : day.bookings.length > 0
      ? t("bookingsCount", { count: day.bookings.length })
      : t("noBookingsToday")

  let headline: ReactNode
  if (day.current) {
    headline = (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{day.current.reason || fallback}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {statusLabel} · {t("endsAt", { time: formatters.time(day.current.endTime) })}
        </p>
      </div>
    )
  } else if (day.status === "closed") {
    headline = <p className="text-sm text-muted-foreground">{t("closedToday")}</p>
  } else if (day.next) {
    const range = `${formatters.time(day.next.startTime)}–${formatters.time(day.next.endTime)}`
    headline = (
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {t("freeUntil", {
            time: formatters.time(
              day.freeUntil !== null ? new Date(day.freeUntil) : day.next.startTime,
            ),
          })}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {t("nextBooking", { time: range })} · {day.next.reason || fallback}
        </p>
      </div>
    )
  } else {
    headline = <p className="text-sm font-medium">{t("freeAllDay")}</p>
  }

  const upcoming = day.bookings.filter((item) => Date.parse(item.endTime) > nowMs).slice(0, 3)
  const dayHref = reservationSearchHref(
    {
      keyword: "",
      campusId: 0,
      roomId: day.room.id,
      status: undefined,
      startDate: today,
      endDate: today,
      page: 0,
      sort: "time",
    },
    0,
  )

  return (
    <Card size="sm" className="min-w-0">
      <CardHeader>
        <CardTitle className={cn("truncate", portrait && "text-xl")}>{day.room.name}</CardTitle>
        <CardDescription className="truncate">{description}</CardDescription>
        <CardAction>
          <StatusBadge tone={TONE_BY_STATUS[day.status]} dot>
            {statusLabel}
          </StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-3">
        {headline}
        <div className="min-w-0">
          <div
            // Timeline hosts child segments, so `img` cannot represent it.
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="img"
            aria-label={t("timelineLabel", {
              start: formatDayHour(DAY_START_HOUR),
              end: formatDayHour(DAY_END_HOUR),
            })}
            className={cn(
              "relative h-2 overflow-hidden rounded-full bg-muted",
              portrait && "h-2.5",
            )}
          >
            {day.segments.map((segment) => (
              <span
                key={segment.id}
                aria-hidden
                style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
                className={cn(
                  "absolute inset-y-0 rounded-full",
                  segment.status === "approved" ? "bg-success" : "bg-warning",
                )}
              />
            ))}
            {showNow ? (
              <span
                aria-hidden
                style={{ left: `${nowPct}%` }}
                className="absolute inset-y-0 w-0.5 bg-foreground/80"
              />
            ) : null}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>{formatDayHour(DAY_START_HOUR)}</span>
            <span>{formatDayHour(DAY_END_HOUR)}</span>
          </div>
        </div>
        {upcoming.length ? (
          <ul className="flex min-w-0 flex-col gap-1.5">
            {upcoming.map((item) => {
              const isLive = day.current?.id === item.id
              return (
                <li key={item.id} className="flex min-w-0 items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      item.status === "approved" ? "bg-success" : "bg-warning",
                    )}
                  />
                  <time
                    dateTime={item.startTime}
                    className="shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums"
                  >
                    {formatters.time(item.startTime)}–{formatters.time(item.endTime)}
                  </time>
                  <span className={cn("min-w-0 flex-1 truncate", isLive && "font-medium")}>
                    {item.reason || fallback}
                  </span>
                  {isLive ? <Badge variant="secondary">{t("nowBadge")}</Badge> : null}
                  <span className="sr-only">{statusT(item.status)}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noBookingsToday")}</p>
        )}
        {portrait ? null : (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button size="sm" asChild>
              <Link href="/reservation/create">
                <CalendarPlus aria-hidden />
                {t("bookRoom")}
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={dayHref}>{t("viewDay")}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
