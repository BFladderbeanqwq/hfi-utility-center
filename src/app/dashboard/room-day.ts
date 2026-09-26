import type { Campus, Reservation, Room } from "@/lib/api/types"
import { DAY_END_HOUR, DAY_START_HOUR } from "@/lib/reservations/availability"

export type RoomDayStatus = "free" | "in-use" | "pending" | "closed"

export interface DaySegment {
  id: number
  status: "approved" | "pending"
  left: number
  width: number
}

/** The only reservation statuses the day timeline renders. */
type BoardStatus = DaySegment["status"]

type BoardBooking = Reservation & { status: BoardStatus }

function isBoardBooking(item: Reservation): item is BoardBooking {
  return item.status === "approved" || item.status === "pending"
}

export interface RoomDay {
  room: Room
  campusName?: string
  bookings: Reservation[]
  current: Reservation | null
  next: Reservation | null
  status: RoomDayStatus
  /** Start of the next booking when free, otherwise null. */
  freeUntil: number | null
  segments: DaySegment[]
  openToday: boolean
}

/** Local day window the board visualises, as millisecond timestamps. */
export function dayWindow(now: Date) {
  const start = new Date(now)
  start.setHours(Math.floor(DAY_START_HOUR), (DAY_START_HOUR % 1) * 60, 0, 0)
  const end = new Date(now)
  end.setHours(Math.floor(DAY_END_HOUR), (DAY_END_HOUR % 1) * 60, 0, 0)
  return { start: start.getTime(), end: end.getTime() }
}

/** "08:00" style axis label for a fractional hour like 21.5. */
export function formatDayHour(hour: number) {
  const whole = Math.floor(hour)
  const minutes = Math.round((hour - whole) * 60)
  return `${String(whole).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/** A room is bookable today when at least one enabled policy covers the weekday. */
export function isRoomOpenToday(room: Room, weekday: number) {
  return room.policies.some((policy) => policy.enabled && policy.days.includes(weekday))
}

function coveringBooking(bookings: Reservation[], nowMs: number) {
  for (const item of bookings) {
    const start = Date.parse(item.startTime)
    const end = Date.parse(item.endTime)
    if (Number.isNaN(start) || Number.isNaN(end)) continue
    if (start <= nowMs && nowMs < end) return item
  }
  return null
}

/**
 * One card's worth of state per room: sorted bookings, the live and next
 * booking, a single status, and timeline segments clamped to the day window.
 * Pure over inputs so the board renders derived state, not raw API rows.
 */
export function buildRoomDays(
  rooms: Room[],
  reservations: Reservation[],
  campuses: Campus[],
  now: Date,
): RoomDay[] {
  const names = new Map(campuses.map((campus) => [campus.id, campus.name]))
  const grouped = new Map<number, BoardBooking[]>()
  for (const item of reservations) {
    if (item.roomId === null) continue
    if (!isBoardBooking(item)) continue
    const list = grouped.get(item.roomId)
    if (list) list.push(item)
    else grouped.set(item.roomId, [item])
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
  }

  const nowMs = now.getTime()
  const { start: windowStart, end: windowEnd } = dayWindow(now)
  const span = Math.max(1, windowEnd - windowStart)
  const weekday = now.getDay()

  return rooms.map((room) => {
    const bookings = grouped.get(room.id) ?? []
    // Prefer the approved booking when a pending request overlaps it: the
    // approved one is what actually occupies the room right now.
    const covering =
      coveringBooking(
        [...bookings].sort((a, b) =>
          a.status === b.status ? 0 : a.status === "approved" ? -1 : 1,
        ),
        nowMs,
      ) ?? null
    const next = bookings.find((item) => Date.parse(item.startTime) > nowMs) ?? null
    const openToday = isRoomOpenToday(room, weekday)
    const status: RoomDayStatus = covering
      ? covering.status === "approved"
        ? "in-use"
        : "pending"
      : !openToday
        ? "closed"
        : "free"

    const segments: DaySegment[] = []
    for (const item of bookings) {
      if (item.status !== "approved" && item.status !== "pending") continue
      const start = Date.parse(item.startTime)
      const end = Date.parse(item.endTime)
      if (Number.isNaN(start) || Number.isNaN(end) || end <= windowStart || start >= windowEnd) {
        continue
      }
      const left = Math.min(100, Math.max(0, ((start - windowStart) / span) * 100))
      const right = Math.min(100, Math.max(0, ((end - windowStart) / span) * 100))
      if (right - left > 0.5) {
        segments.push({ id: item.id, status: item.status, left, width: right - left })
      }
    }

    return {
      room,
      campusName: names.get(room.campus),
      bookings,
      current: covering,
      next,
      status,
      freeUntil: covering ? null : next ? Date.parse(next.startTime) : windowEnd,
      segments,
      openToday,
    }
  })
}
