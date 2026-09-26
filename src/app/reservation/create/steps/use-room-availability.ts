"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { getAvailability } from "@/lib/api/reservations"
import type { AvailabilityData, Room } from "@/lib/api/types"
import { buildPriorityAvailability } from "@/lib/reservations/availability"

export function useRoomAvailability({
  room,
  date,
  privileged = false,
}: {
  room?: Room
  date: string
  privileged?: boolean
}) {
  const t = useTranslations("booking")
  const [availability, setAvailability] = useState<AvailabilityData>()
  const [error, setError] = useState<string>()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!date || !room) return
    let active = true
    const selectedRoom = room

    async function loadAvailability() {
      try {
        const nextAvailability = privileged
          ? buildPriorityAvailability(selectedRoom, date)
          : await getAvailability(selectedRoom.id, date, selectedRoom)
        if (!active) return
        setAvailability(nextAvailability)
        setError(undefined)
      } catch (loadError) {
        if (active) {
          setAvailability(undefined)
          setError(loadError instanceof Error ? loadError.message : t("availabilityError"))
        }
      }
    }

    void loadAvailability()
    return () => {
      active = false
    }
  }, [date, privileged, room, t])

  async function refresh() {
    if (!date || !room) return
    setRefreshing(true)
    setError(undefined)
    try {
      setAvailability(
        privileged
          ? buildPriorityAvailability(room, date)
          : await getAvailability(room.id, date, room),
      )
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : t("availabilityError"))
    } finally {
      setRefreshing(false)
    }
  }

  const currentAvailability =
    availability && availability.roomId === room?.id && availability.date === date
      ? availability
      : undefined

  return {
    availability: currentAvailability,
    error,
    loading: refreshing || Boolean(room && date && !currentAvailability),
    refresh,
    clearError: () => setError(undefined),
    reportError: setError,
  }
}
