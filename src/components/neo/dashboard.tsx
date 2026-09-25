"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAppLocale } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getRooms } from "@/lib/api/catalog"
import { getReservations } from "@/lib/api/reservations"
import type { Reservation, Room } from "@/lib/api/types"
import { NeoPage, NeoFooter, StatusBadge } from "./shared"

export function FacilityDashboard({ portrait = false }: { portrait?: boolean }) {
  const { locale } = useAppLocale()
  const zh = locale === "zh-CN"
  const status = useTranslations("status")
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [now, setNow] = useState(() => new Date())
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState<Date | null>(null)
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
    const timer = window.setInterval(() => {
      setNow(new Date())
      void refresh()
    }, 30000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [refresh])
  const time = (value: Date | string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value))
  const active = reservations.filter(
    (item) =>
      item.status === "approved" &&
      Date.parse(item.startTime) <= now.getTime() &&
      Date.parse(item.endTime) > now.getTime(),
  )
  return (
    <NeoPage>
      <main id="main-content" className={`live-board ${portrait ? "live-board--portrait" : ""}`}>
        <header className="live-board-heading">
          <div>
            <h1>{zh ? "场地看板" : "Live schedule"}</h1>
            <p>
              {new Intl.DateTimeFormat(locale, {
                month: "long",
                day: "numeric",
                weekday: "long",
              }).format(now)}
            </p>
          </div>
          <Button variant="secondary" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
            {zh ? "刷新" : "Refresh"}
          </Button>
        </header>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {zh
                ? "暂时无法更新场地信息，请重试。下方可能显示上次加载的数据。"
                : "Unable to refresh. Please retry; data below may be out of date."}
            </AlertDescription>
          </Alert>
        )}
        <div className="live-board-summary">
          <strong>{active.length}</strong>
          <span>{zh ? "间场地正在使用" : "rooms in use"}</span>
          <p>
            {updated
              ? `${zh ? "更新于" : "Updated"} ${time(updated)} · ${zh ? "每 30 秒更新" : "Refreshes every 30 seconds"}`
              : loading
                ? zh
                  ? "正在加载场地…"
                  : "Loading rooms…"
                : ""}
          </p>
        </div>
        <div className="live-board-rooms">
          {rooms.map((room) => {
            const inUse = active.some((item) => item.roomId === room.id)
            const items = reservations.filter(
              (item) => item.roomId === room.id && ["approved", "pending"].includes(item.status),
            )
            return (
              <section className="live-room" key={room.id} aria-labelledby={`room-${room.id}`}>
                <div className="live-room-heading">
                  <h2 id={`room-${room.id}`}>{room.name}</h2>
                  <StatusBadge tone={inUse ? "info" : "neutral"}>
                    {inUse
                      ? zh
                        ? "使用中"
                        : "In use"
                      : zh
                        ? "当前无预约占用"
                        : "No current booking"}
                  </StatusBadge>
                </div>
                {items.length ? (
                  <ol className="live-room-events">
                    {items.map((item) => (
                      <li key={item.id}>
                        <time>
                          {time(item.startTime)}–{time(item.endTime)}
                        </time>
                        <span>{item.reason}</span>
                        <StatusBadge tone={item.status === "approved" ? "success" : "warning"}>
                          {status(item.status)}
                        </StatusBadge>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="live-room-empty">{zh ? "今日暂无预约" : "No bookings today"}</p>
                )}
              </section>
            )
          })}
        </div>
        {!loading && !error && rooms.length === 0 && (
          <p>{zh ? "暂无开放场地" : "No rooms available"}</p>
        )}
      </main>
      <NeoFooter />
    </NeoPage>
  )
}
