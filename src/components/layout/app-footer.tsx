"use client"

import { ArrowUpRight } from "lucide-react"
import { useTranslations } from "next-intl"

export function AppFooter() {
  const t = useTranslations("layout")

  return (
    <footer className="mt-8 border-t">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col items-start gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span className="font-semibold tracking-tight text-foreground">hfi {t("brand")}</span>
        <a
          href="https://hfi.one"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground"
        >
          {t("moreCampusTools")}
          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
        </a>
      </div>
    </footer>
  )
}
