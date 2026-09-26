"use client"

import { ErrorState, LoadingState } from "@/components/layout/data-state"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { useTranslations } from "next-intl"

/**
 * The two states that stand between the flow and a usable form: the catalogue
 * still loading, and the catalogue that never arrived. Force-mode renders both
 * without a shell, because it is embedded in the admin page rather than being
 * a page of its own.
 */
export function BookingGate({
  isForce,
  loading,
  error,
  onRetry,
}: {
  isForce: boolean
  loading: boolean
  error?: string
  onRetry: () => void
}) {
  const t = useTranslations("booking")
  const adminT = useTranslations("admin")

  if (loading) {
    if (isForce) {
      return (
        <div className="flex min-h-40 items-center justify-center">
          <LoadingState label={adminT("forceLoading")} />
        </div>
      )
    }
    return (
      <AppShell>
        <PageHeader title={t("loadingTitle")} />
        <LoadingState rows={5} />
      </AppShell>
    )
  }

  if (isForce) {
    return (
      <div className="flex min-w-0 flex-col gap-3">
        <ErrorState title={adminT("forceLoadError")} description={error} onRetry={onRetry} />
      </div>
    )
  }
  return (
    <AppShell>
      <PageHeader title={t("loadError")} />
      <ErrorState description={error ?? t("connectionError")} onRetry={onRetry} />
    </AppShell>
  )
}
