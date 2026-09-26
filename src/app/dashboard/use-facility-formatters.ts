"use client"

import { useMemo } from "react"

import { formatApiTimestamp } from "@/lib/date-time"
import { useAppLocale } from "@/lib/locale"

export type Formatters = {
  time: (value: Date | string) => string
  headerDate: (value: Date) => string
}

/**
 * The two `Intl` formatters the board needs, built once per locale. Row
 * timestamps go through `time`; the page header gets the long date.
 */
export function useFacilityFormatters(): Formatters {
  const { locale } = useAppLocale()

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [locale],
  )
  const headerDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
    [locale],
  )

  return useMemo(
    () => ({
      time: (value: Date | string) => formatApiTimestamp(timeFormatter, value),
      headerDate: (value: Date) => headerDateFormatter.format(value),
    }),
    [headerDateFormatter, timeFormatter],
  )
}
