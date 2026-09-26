"use client"

import { useMemo } from "react"
import { Building2, CalendarX2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { EmptyState, LoadingState } from "@/components/layout/data-state"
import type { Reservation, Room } from "@/lib/api/types"
import { cn } from "@/lib/utils"

import { DOT, ROW } from "./facility-board-tokens"
import type { Formatters } from "./use-facility-formatters"

/**
 * The per-room schedule board: a column header plus one row per booking, one
 * independent grid per room so the status column stays aligned.
 */
export function FacilityRoomBoard({
  rooms,
  reservations,
  activeRoomIds,
  loading,
  error,
  portrait,
  formatters,
}: {
  rooms: Room[]
  reservations: Reservation[]
  activeRoomIds: Set<number>
  loading: boolean
  error: boolean
  portrait: boolean
  formatters: Formatters
}) {
  const t = useTranslations("dashboard")

  const itemsByRoom = useMemo(() => {
    const grouped = new Map<number, Reservation[]>()
    for (const item of reservations) {
      if (item.roomId === null) continue
      if (item.status !== "approved" && item.status !== "pending") continue
      const list = grouped.get(item.roomId)
      if (list) list.push(item)
      else grouped.set(item.roomId, [item])
    }
    return grouped
  }, [reservations])

  return (
    <>
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
              {rooms.map((room) => (
                <RoomSection
                  key={room.id}
                  room={room}
                  items={itemsByRoom.get(room.id) ?? []}
                  inUse={activeRoomIds.has(room.id)}
                  portrait={portrait}
                  formatters={formatters}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

function RoomSection({
  room,
  items,
  inUse,
  portrait,
  formatters,
}: {
  room: Room
  items: Reservation[]
  inUse: boolean
  portrait: boolean
  formatters: Formatters
}) {
  const t = useTranslations("dashboard")
  const status = useTranslations("status")
  const occupancy = inUse ? t("inUse") : t("idle")

  return (
    <section className="min-w-0 py-4 first:pt-0 sm:py-5">
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
          title={occupancy}
          className={cn("size-2 shrink-0 rounded-full", inUse ? DOT.live : DOT.idle)}
        >
          <span className="sr-only">{occupancy}</span>
        </span>
        {/* Distance reading: the kiosk variant keeps the word. */}
        {portrait ? (
          <span className="min-w-0 text-sm text-muted-foreground">{occupancy}</span>
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
                  {formatters.time(item.startTime)}–{formatters.time(item.endTime)}
                </time>
                <span
                  className={cn("min-w-0 truncate font-medium", portrait && "text-2xl sm:text-3xl")}
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
}
