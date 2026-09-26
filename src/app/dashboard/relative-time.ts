export const RELATIVE_UNITS = [
  { limit: 60_000, key: "secondsAgo", divisor: 1000 },
  { limit: 3_600_000, key: "minutesAgo", divisor: 60_000 },
  { limit: Number.POSITIVE_INFINITY, key: "hoursAgo", divisor: 3_600_000 },
] as const

/**
 * How long ago the last poll landed, as a translation key plus count. Empty
 * before the first successful poll — there is nothing to report yet.
 */
export function relativeSince(
  updated: Date | null,
  now: Date,
  translate: (key: string, values: { count: number }) => string,
  justNow: string,
) {
  if (!updated) return ""
  const elapsed = now.getTime() - updated.getTime()
  if (elapsed < 5000) return justNow
  const unit = RELATIVE_UNITS.find((entry) => elapsed < entry.limit) ?? RELATIVE_UNITS[2]
  return translate(unit.key, { count: Math.max(1, Math.round(elapsed / unit.divisor)) })
}
