"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import type { UseFormReturn } from "react-hook-form"

import { getAdminSession, type AdminSession } from "@/lib/api/auth"
import { getCatalog } from "@/lib/api/catalog"
import type { CatalogData } from "@/lib/api/types"

import { reservationDefaults, type ReservationFormValues } from "./form"

/**
 * The class/room catalogue the whole flow is built on, plus the admin session
 * in force-mode. A failed privileged load is fatal for that mode: without a
 * session and a privileged class there is nothing to prefill, so the page shows
 * the error instead of an unusable form.
 */
export function useBookingCatalog(isForce: boolean, form: UseFormReturn<ReservationFormValues>) {
  const t = useTranslations("booking")
  const adminT = useTranslations("admin")
  const [catalog, setCatalog] = useState<CatalogData>()
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string>()
  const [catalogReloadKey, setCatalogReloadKey] = useState(0)
  const adminSessionRef = useRef<AdminSession | undefined>(undefined)

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      setCatalogLoading(true)
      setCatalogError(undefined)
      try {
        const [data, session] = await Promise.all([
          getCatalog(),
          isForce ? getAdminSession() : Promise.resolve(undefined),
        ])
        if (!active) return

        const priorityClass = findPriorityClass(data)
        if (isForce && (!session || !priorityClass)) {
          throw new Error(adminT("forceLoadError"))
        }
        setCatalog(data)
        adminSessionRef.current = session
        if (isForce && session && priorityClass) {
          form.reset(forceReservationDefaults(priorityClass.id, session))
        }
      } catch (error) {
        if (active) {
          setCatalogError(error instanceof Error ? error.message : t("connectionError"))
        }
      } finally {
        if (active) setCatalogLoading(false)
      }
    }

    void loadCatalog()
    return () => {
      active = false
    }
  }, [adminT, catalogReloadKey, form, isForce, t])

  return {
    catalog,
    catalogLoading,
    catalogError,
    reloadCatalog: () => setCatalogReloadKey((key) => key + 1),
    adminSessionRef,
  }
}

export function findPriorityClass(catalog: CatalogData) {
  const privilegedCampusIds = new Set(
    catalog.campuses.filter((campus) => campus.isPrivileged).map((campus) => campus.id),
  )
  return catalog.classes.find((item) => privilegedCampusIds.has(item.campus))
}

export function forceReservationDefaults(
  classId: number,
  admin: AdminSession,
): ReservationFormValues {
  return {
    ...reservationDefaults,
    classId,
    studentName: admin.name,
    email: admin.email,
    isPrivileged: true,
    purposeType: "class",
    isAgreed: true,
  }
}
