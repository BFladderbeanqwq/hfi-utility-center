"use client"

import { ReservationForm } from "@/app/reservation/create/reservation-form"
import { PageHeader } from "@/components/layout/page-header"
import { useTranslations } from "next-intl"

export default function AdminForceReservationPage() {
  const t = useTranslations("admin")

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={t("forceReservationTitle")}
        description={t("forceReservationDescription")}
      />
      <ReservationForm mode="adminForce" />
    </div>
  )
}
