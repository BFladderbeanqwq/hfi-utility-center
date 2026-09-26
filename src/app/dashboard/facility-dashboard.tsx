"use client"

import { Building2, CalendarCheck2, DoorOpen, Hourglass } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, type CSSProperties } from "react"

import { AppShell } from "@/components/layout/app-shell"
import { ErrorState } from "@/components/layout/data-state"
import { MetricCard } from "@/components/layout/metric-card"
import { PageHeader } from "@/components/layout/page-header"
import { cn } from "@/lib/utils"

import { COLUMNS } from "./facility-board-tokens"
import { FacilityRoomBoard } from "./facility-room-board"
import { MetricValue } from "./metric-value"
import { RefreshStatus } from "./refresh-status"
import { relativeSince } from "./relative-time"
import { useFacilityFormatters } from "./use-facility-formatters"
import { useFacilitySchedule } from "./use-facility-schedule"

export function FacilityDashboard({ portrait = false }: { portrait?: boolean }) {
  const t = useTranslations("dashboard")
  const { rooms, reservations, now, error, loading, updated, refresh } = useFacilitySchedule()
  const formatters = useFacilityFormatters()

  // Once the first poll has landed, later polls may re-enter the metric digits.
  // Before that the on-screen zeros are a placeholder, not a measurement.
  const primed = updated !== null

  // A room counts as "in use" when an approved booking covers the current
  // instant; the same rule decides both the room dot and the headline count.
  const { activeRoomIds, activeCount } = useMemo(() => {
    const ids = new Set<number>()
    let count = 0
    for (const item of reservations) {
      if (item.status !== "approved") continue
      if (Date.parse(item.startTime) > now.getTime()) continue
      if (Date.parse(item.endTime) <= now.getTime()) continue
      count += 1
      if (item.roomId !== null) ids.add(item.roomId)
    }
    return { activeRoomIds: ids, activeCount: count }
  }, [now, reservations])

  const pending = reservations.filter((item) => item.status === "pending").length
  const relative = relativeSince(updated, now, (key, values) => t(key, values), t("justNow"))

  const boardStyle = {
    "--board-columns": portrait ? COLUMNS.portrait : COLUMNS.landscape,
  } as CSSProperties

  return (
    <AppShell width={portrait ? "full" : "wide"}>
      <PageHeader
        className={cn(portrait && "px-4 py-5 sm:px-6 sm:py-6 lg:px-8")}
        eyebrow={formatters.headerDate(now)}
        title={t("title")}
        actions={<RefreshStatus updated={updated} error={error} relative={relative} />}
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
            value={<MetricValue value={activeCount} primed={primed} />}
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
            value={<MetricValue value={reservations.length} primed={primed} />}
            icon={CalendarCheck2}
          />
          <MetricCard
            label={t("pendingApproval")}
            value={<MetricValue value={pending} primed={primed} />}
            icon={Hourglass}
          />
        </div>

        <FacilityRoomBoard
          rooms={rooms}
          reservations={reservations}
          activeRoomIds={activeRoomIds}
          loading={loading}
          error={error}
          portrait={portrait}
          formatters={formatters}
        />
      </div>
    </AppShell>
  )
}
