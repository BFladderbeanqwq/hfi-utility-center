"use client"

import { Building2, CalendarCheck2, DoorOpen, Hourglass, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { ErrorState, LoadingState } from "@/components/layout/data-state"
import { PageHeader } from "@/components/layout/page-header"
import { RefreshButton } from "@/components/layout/refresh-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

import { FacilityRoomBoard } from "./facility-room-board"
import { relativeSince } from "./relative-time"
import { buildRoomDays, isRoomOpenToday, type RoomDayStatus } from "./room-day"
import { useFacilityFormatters } from "./use-facility-formatters"
import { useFacilitySchedule } from "./use-facility-schedule"

type StatusFilter = "all" | RoomDayStatus

const STATUS_FILTERS: readonly StatusFilter[] = ["all", "free", "in-use", "pending", "closed"]
const ALL_CAMPUSES = "all"

/**
 * The board answers one question: where can I go right now? Each room is one
 * card with its live status, a day timeline, the next bookings, and a booking
 * action. A search box plus campus and status filters trim the grid; the
 * shadcn summary cards above carry the four numbers the old metric row did.
 */
export function FacilityDashboard({ portrait = false }: { portrait?: boolean }) {
  const t = useTranslations("dashboard")
  const { rooms, campuses, reservations, now, error, loading, updated, refresh } =
    useFacilitySchedule()
  const formatters = useFacilityFormatters()
  const [query, setQuery] = useState("")
  const [campus, setCampus] = useState(ALL_CAMPUSES)
  const [status, setStatus] = useState<StatusFilter>("all")

  const days = useMemo(
    () => buildRoomDays(rooms, reservations, campuses, now),
    [rooms, reservations, campuses, now],
  )

  const openTodayCount = useMemo(
    () => rooms.filter((room) => isRoomOpenToday(room, now.getDay())).length,
    [rooms, now],
  )
  const activeCount = useMemo(() => days.filter((day) => day.status === "in-use").length, [days])
  const bookingsToday = reservations.filter(
    (item) => item.status === "approved" || item.status === "pending",
  ).length
  const pending = reservations.filter((item) => item.status === "pending").length

  const visibleDays = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return days.filter((day) => {
      if (campus !== ALL_CAMPUSES && String(day.room.campus) !== campus) return false
      if (status !== "all" && day.status !== status) return false
      if (needle && !day.room.name.toLowerCase().includes(needle)) return false
      return true
    })
  }, [days, campus, status, query])

  const relative = relativeSince(updated, now, (key, values) => t(key, values), t("justNow"))
  const statusLabel = updated && !error ? t("lastUpdated", { time: relative }) : t("refreshEvery")

  return (
    <AppShell width={portrait ? "full" : "wide"}>
      <PageHeader
        className={cn(portrait && "px-4 py-5 sm:px-6 sm:py-6 lg:px-8")}
        eyebrow={formatters.headerDate(now)}
        title={t("title")}
        description={statusLabel}
        actions={
          <RefreshButton label={t("refresh")} loading={loading} onRefresh={() => void refresh()} />
        }
      />

      <div
        className={cn(
          "flex min-w-0 flex-col gap-4",
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

        {loading && rooms.length === 0 ? (
          <LoadingState rows={6} />
        ) : (
          <>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={DoorOpen}
                label={t("roomsInUse")}
                value={activeCount}
                description={t("roomsInUseDescription")}
              />
              <SummaryCard
                icon={Building2}
                label={t("openToday")}
                value={openTodayCount}
                description={t("openTodayDescription")}
              />
              <SummaryCard
                icon={CalendarCheck2}
                label={t("bookingsToday")}
                value={bookingsToday}
                description={t("bookingsTodayDescription")}
              />
              <SummaryCard
                icon={Hourglass}
                label={t("pendingApproval")}
                value={pending}
                description={t("pendingApprovalDescription")}
              />
            </div>

            <Card size="sm">
              <CardContent className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
                <InputGroup className="w-full lg:max-w-xs">
                  <InputGroupInput
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("searchPlaceholder")}
                    aria-label={t("searchPlaceholder")}
                    type="search"
                    autoComplete="off"
                    maxLength={100}
                  />
                  <InputGroupAddon>
                    <Search aria-hidden />
                  </InputGroupAddon>
                </InputGroup>
                <Select value={campus} onValueChange={setCampus}>
                  <SelectTrigger aria-label={t("campusFilter")} className="w-full sm:max-w-56">
                    <SelectValue placeholder={t("allCampuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CAMPUSES}>{t("allCampuses")}</SelectItem>
                    {campuses.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={status}
                  onValueChange={(value) => {
                    if (value) setStatus(value as StatusFilter)
                  }}
                  aria-label={t("statusFilter")}
                  className="flex-wrap justify-start"
                >
                  {STATUS_FILTERS.map((value) => (
                    <ToggleGroupItem key={value} value={value}>
                      {value === "all" ? t("allStatuses") : t(`status_${value}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <p
                  aria-live="polite"
                  className="text-sm whitespace-nowrap text-muted-foreground lg:ml-auto"
                >
                  {t("showingRooms", { count: visibleDays.length, total: rooms.length })}
                </p>
              </CardContent>
            </Card>

            <div className="t-reveal">
              <FacilityRoomBoard
                days={visibleDays}
                totalRooms={rooms.length}
                now={now}
                loading={loading}
                error={error}
                portrait={portrait}
                formatters={formatters}
                onResetFilters={() => {
                  setQuery("")
                  setCampus(ALL_CAMPUSES)
                  setStatus("all")
                }}
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof DoorOpen
  label: string
  value: number
  description: string
}) {
  return (
    <Card size="sm" className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-0.5">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
