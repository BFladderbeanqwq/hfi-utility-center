"use client"

import { AdminPageHeader } from "@/app/admin/admin-shell"
import { ReservationForm } from "@/app/reservation/create/reservation-form"
import { useTranslations } from "next-intl"

export default function AdminForceReservationPage() {
  const t = useTranslations("admin")

  return (
    <main id="main-content" className="admin-page space-y-6">
      <AdminPageHeader
        title={t("forceReservationTitle")}
        description={t("forceReservationDescription")}
      />
      <ReservationForm mode="adminForce" />
    </main>
  )
}
