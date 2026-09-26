"use client"

import { useTranslations } from "next-intl"

import { LoadingState } from "@/components/layout/data-state"

import { CancelledNotice, LinkUnavailable } from "./cancel-details"

/**
 * Every state the link can be in before there is a booking to show: no token,
 * still loading, a link that never resolved, or a booking already cancelled.
 * The flow itself is only rendered once one of these is out of the way.
 */
export function CancellationGate({
  hasToken,
  loading,
  error,
  hasPreview,
  cancelled,
}: {
  hasToken: boolean
  loading: boolean
  error?: string
  hasPreview: boolean
  cancelled: boolean
}) {
  const t = useTranslations("neo.management")

  if (!hasToken) return <LinkUnavailable description={t("invalidLink")} />
  if (cancelled) return <CancelledNotice />
  if (loading) {
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <LoadingState label={t("loading")} rows={3} />
        <p className="text-sm text-muted-foreground">{t("loadingDescription")}</p>
      </div>
    )
  }
  if (!hasPreview) return <LinkUnavailable description={error ?? t("invalidLink")} />
  return null
}
