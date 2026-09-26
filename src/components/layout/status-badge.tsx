import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusTone =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"

// Outline treatment: the tone colour drives TEXT and a faint border only. The
// heavy `*-soft` fill is what made these read as noise.
const TONE_CLASS: Record<StatusTone, string> = {
  success: "border-success/30 text-success",
  warning: "border-warning/30 text-warning",
  info: "border-info/30 text-info",
  danger: "border-danger/30 text-danger",
  pending: "border-warning/30 text-warning",
  approved: "border-success/30 text-success",
  rejected: "border-danger/30 text-danger",
  cancelled: "border-border text-muted-foreground",
  neutral: "border-border text-muted-foreground",
}

const DOT_CLASS: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-danger",
  pending: "bg-warning",
  approved: "bg-success",
  rejected: "bg-danger",
  cancelled: "bg-muted-foreground",
  neutral: "bg-muted-foreground",
}

export function StatusBadge({
  tone,
  children,
  dot = false,
  className,
}: {
  tone: StatusTone
  children: ReactNode
  /** Show the tone as a leading dot instead of relying on the text colour alone. */
  dot?: boolean
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("max-w-full truncate", TONE_CLASS[tone], className)}
      data-tone={tone}
    >
      {dot ? (
        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[tone])} />
      ) : null}
      {children}
    </Badge>
  )
}
