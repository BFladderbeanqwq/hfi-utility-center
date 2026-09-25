import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import type { StatusTone } from "@/components/layout/status-badge"

// A metric is data, not a card. The only chrome allowed is a 2px left rail in
// the tone colour — no box, no fill, no shadow, no rounded container.
const TONE_RAIL: Partial<Record<StatusTone, string>> = {
  success: "border-l-success",
  approved: "border-l-success",
  warning: "border-l-warning",
  pending: "border-l-warning",
  info: "border-l-info",
  danger: "border-l-danger",
  rejected: "border-l-danger",
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  to,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  icon: LucideIcon
  tone?: StatusTone
  hint?: React.ReactNode
  to?: string
  className?: string
}) {
  const rail = TONE_RAIL[tone]

  const body = (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1",
        rail && "border-l-2 pl-3",
        to && "transition-colors",
        to && rail && "group-hover/metric:border-l-primary",
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p
          className={cn(
            "min-w-0 text-xs font-medium tracking-wide break-words text-muted-foreground uppercase",
            to && !rail && "transition-colors group-hover/metric:text-foreground",
          )}
        >
          {label}
        </p>
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="text-xl font-semibold break-words tabular-nums sm:text-2xl">{value}</p>
      {hint ? <p className="text-xs break-words text-muted-foreground">{hint}</p> : null}
    </div>
  )

  if (!to) return body

  return (
    <Link
      href={to}
      className="group/metric block min-w-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {body}
    </Link>
  )
}
