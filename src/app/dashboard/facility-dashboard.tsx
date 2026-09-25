"use client"

import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { Building2, CalendarCheck2, CalendarX2, DoorOpen, Hourglass } from "lucide-react"
import { useTranslations } from "next-intl"

import { AppShell } from "@/components/layout/app-shell"
import { EmptyState, ErrorState, LoadingState } from "@/components/layout/data-state"
import { MetricCard } from "@/components/layout/metric-card"
import { PageHeader } from "@/components/layout/page-header"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getRooms } from "@/lib/api/catalog"
import { getReservations } from "@/lib/api/reservations"
import type { Reservation, Room } from "@/lib/api/types"
import { useAppLocale } from "@/lib/locale"
import { formatApiTimestamp } from "@/lib/date-time"
import { cn } from "@/lib/utils"

// ONE row template, shared by the column header of every room and by every
// event row. Each room section is an independent grid, so the trailing track
// must be a fixed width too — an `auto` track would be sized per row and the
// status column would drift out of alignment again.
const ROW = "grid items-center gap-3 [grid-template-columns:var(--board-columns)]"

const COLUMNS = {
  landscape: "6.5rem minmax(0,1fr) 5.5rem",
  portrait: "8.5rem minmax(0,1fr) 7.5rem",
} as const

// Status is a dot, not a pill: a badge on every row of a schedule board is noise.
const DOT = {
  approved: "bg-success",
  pending: "bg-warning",
  live: "animate-pulse bg-success motion-reduce:animate-none",
  idle: "bg-muted-foreground/40",
} as const

const RELATIVE_UNITS = [
  { limit: 60_000, key: "secondsAgo", divisor: 1000 },
  { limit: 3_600_000, key: "minutesAgo", divisor: 60_000 },
  { limit: Number.POSITIVE_INFINITY, key: "hoursAgo", divisor: 3_600_000 },
] as const

export function FacilityDashboard({ portrait = false }: { portrait?: boolean }) {
  const t = useTranslations("dashboard")
  const status = useTranslations("status")
  const { locale } = useAppLocale()
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState<Date | null>(null)
  // Once the first poll has landed, later polls may re-enter the metric digits.
  // Before that the on-screen zeros are a placeholder, not a measurement.
  const primed = updated !== null

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const params = {
        startTime: Math.floor(start.getTime() / 1000),
        endTime: Math.floor(end.getTime() / 1000),
      }
      const [catalog, first] = await Promise.all([
        getRooms(),
        getReservations({ ...params, page: 0 }),
      ])
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, Math.ceil(first.total / 20) - 1) }, (_, index) =>
          getReservations({ ...params, page: index + 1 }),
        ),
      )
      setRooms(catalog.filter((room) => room.enabled))
      setReservations(
        [...first.reservations, ...rest.flatMap((page) => page.reservations)].sort(
          (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime),
        ),
      )
      setUpdated(new Date())
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0)
    const poll = window.setInterval(() => void refresh(), 30000)
    // A cheap tick keeps the "in use" state and the relative timestamp honest
    // without re-fetching.
    const tick = window.setInterval(() => setNow(new Date()), 5000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(poll)
      window.clearInterval(tick)
    }
  }, [refresh])

  const time = (value: Date | string) =>
    formatApiTimestamp(
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      value,
    )

  const active = reservations.filter(
    (item) =>
      item.status === "approved" &&
      Date.parse(item.startTime) <= now.getTime() &&
      Date.parse(item.endTime) > now.getTime(),
  )
  const pending = reservations.filter((item) => item.status === "pending").length
  const scheduled = reservations.length

  const elapsed = updated ? now.getTime() - updated.getTime() : 0
  const unit = RELATIVE_UNITS.find((entry) => elapsed < entry.limit) ?? RELATIVE_UNITS[2]
  const relative = updated
    ? elapsed < 5000
      ? t("justNow")
      : t(unit.key, { count: Math.max(1, Math.round(elapsed / unit.divisor)) })
    : ""

  const boardStyle = {
    "--board-columns": portrait ? COLUMNS.portrait : COLUMNS.landscape,
  } as CSSProperties

  return (
    <AppShell width={portrait ? "full" : "wide"}>
      <PageHeader
        className={cn(portrait && "px-4 py-5 sm:px-6 sm:py-6 lg:px-8")}
        eyebrow={new Intl.DateTimeFormat(locale, {
          month: "long",
          day: "numeric",
          weekday: "long",
        }).format(now)}
        title={t("title")}
        actions={
          updated && !error ? (
            <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t("refreshEvery")}
                      className="size-2 shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "block size-2 rounded-full",
                          loading
                            ? "animate-pulse bg-muted-foreground/40 motion-reduce:animate-none"
                            : DOT.live,
                        )}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{t("refreshEvery")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="truncate tabular-nums">{t("lastUpdated", { time: relative })}</span>
            </span>
          ) : null
        }
      />

      <div
        style={boardStyle}
        className={cn(
          "flex min-w-0 flex-col gap-6",
          portrait && "px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8",
        )}
      >
        {error ? (
          <ErrorState
            title={t("errorTitle")}
            description={t("errorDescription")}
            retryLabel={t("refresh")}
            onRetry={() => void refresh()}
          />
        ) : null}

        <div
          className={cn(
            "grid min-w-0 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4",
            portrait && "sm:grid-cols-4",
          )}
        >
          <MetricCard
            label={t("roomsInUse")}
            value={<MetricValue value={active.length} primed={primed} />}
            icon={DoorOpen}
            tone="info"
          />
          <MetricCard
            label={t("totalRooms")}
            value={<MetricValue value={rooms.length} primed={primed} />}
            icon={Building2}
          />
          <MetricCard
            label={t("bookingsToday")}
            value={<MetricValue value={scheduled} primed={primed} />}
            icon={CalendarCheck2}
          />
          <MetricCard
            label={t("pendingApproval")}
            value={<MetricValue value={pending} primed={primed} />}
            icon={Hourglass}
          />
        </div>

        {loading && rooms.length === 0 ? <LoadingState rows={4} /> : null}

        {rooms.length > 0 || (!loading && !error) ? (
          <div className="t-reveal">
            {rooms.length === 0 && !loading && !error ? (
              <EmptyState
                icon={Building2}
                title={t("noRooms")}
                description={t("noRoomsDescription")}
              />
            ) : null}

            {rooms.length > 0 ? (
              <div className="flex min-w-0 flex-col divide-y divide-border">
                {rooms.map((room) => {
                  const inUse = active.some((item) => item.roomId === room.id)
                  const items = reservations.filter(
                    (item) =>
                      item.roomId === room.id && ["approved", "pending"].includes(item.status),
                  )
                  return (
                    <section key={room.id} className="min-w-0 py-4 first:pt-0 sm:py-5">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <h2
                          className={cn(
                            "min-w-0 text-sm font-medium break-words",
                            portrait && "text-2xl sm:text-3xl",
                          )}
                        >
                          {room.name}
                        </h2>
                        <span
                          title={inUse ? t("inUse") : t("idle")}
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            inUse ? DOT.live : DOT.idle,
                          )}
                        >
                          <span className="sr-only">{inUse ? t("inUse") : t("idle")}</span>
                        </span>
                        {/* Distance reading: the kiosk variant keeps the word. */}
                        {portrait ? (
                          <span className="min-w-0 text-sm text-muted-foreground">
                            {inUse ? t("inUse") : t("idle")}
                          </span>
                        ) : null}
                      </div>

                      {items.length ? (
                        <>
                          <div
                            className={cn(
                              ROW,
                              "mt-2 border-b border-border pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                            )}
                          >
                            <span>{t("timeColumn")}</span>
                            <span>{t("purposeColumn")}</span>
                            <span className="justify-self-end">{t("statusColumn")}</span>
                          </div>
                          <ul className="flex min-w-0 flex-col divide-y divide-border">
                            {items.map((item) => (
                              <li key={item.id} className={cn(ROW, "py-2.5", portrait && "py-4")}>
                                <time
                                  className={cn(
                                    "font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums",
                                    portrait && "text-lg",
                                  )}
                                >
                                  {time(item.startTime)}–{time(item.endTime)}
                                </time>
                                <span
                                  className={cn(
                                    "min-w-0 truncate font-medium",
                                    portrait && "text-2xl sm:text-3xl",
                                  )}
                                >
                                  {item.reason || t("purposeFallback")}
                                </span>
                                <span
                                  className={cn(
                                    "flex min-w-0 items-center gap-1.5 justify-self-end text-xs",
                                    portrait && "text-lg",
                                  )}
                                >
                                  <span
                                    aria-hidden
                                    className={cn(
                                      "size-1.5 shrink-0 rounded-full",
                                      item.status === "approved" ? DOT.approved : DOT.pending,
                                    )}
                                  />
                                  <span className="truncate">{status(item.status)}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : (
                        <EmptyState
                          icon={CalendarX2}
                          title={t("noBookingsToday")}
                          className={cn("min-h-0 py-5", portrait && "min-h-40 py-8")}
                        />
                      )}
                    </section>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

/**
 * A dashboard metric with the number pop-in (transitions-dev 02). Re-polling
 * every 30s is otherwise a silent no-op — re-entering the digits is what makes
 * a room freeing up legible.
 *
 * The group is keyed on its text, so a changed value remounts it and the
 * keyframes replay from a clean baseline with no reflow hack. `primed` is the
 * first-paint guard: until the opening poll has landed, the zeros on screen are
 * a placeholder rather than a previous measurement, so nothing animates.
 */
function MetricValue({ value, primed }: { value: number; primed: boolean }) {
  const text = String(value)
  const [shown, setShown] = useState({ text, animating: false, primed })

  // Adjust during render rather than in an effect: the group is keyed on the
  // text, so it remounts and the keyframes replay from a clean baseline.
  if (shown.text !== text || shown.primed !== primed) {
    setShown({ text, animating: shown.animating || (shown.primed && shown.text !== text), primed })
  }

  return (
    <span key={shown.text} className={cn("t-digit-group", shown.animating && "is-animating")}>
      {Array.from(text, (char, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: digits have no identity
          key={index}
          className="t-digit"
          data-stagger={
            index === text.length - 2 ? "1" : index === text.length - 1 ? "2" : undefined
          }
        >
          {char}
        </span>
      ))}
    </span>
  )
}
