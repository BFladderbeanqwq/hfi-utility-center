"use client"

import { useTranslations } from "next-intl"

import { AppShell } from "@/components/layout/app-shell"
import { ErrorState, LoadingState } from "@/components/layout/data-state"
import { PageHeader } from "@/components/layout/page-header"

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
