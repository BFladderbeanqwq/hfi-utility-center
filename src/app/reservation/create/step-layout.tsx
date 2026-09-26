import { CircleAlert } from "lucide-react"
import type { ReactNode } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"

export function StepLayout({
  title,
  description,
  error,
  children,
}: {
  title: string
  description?: string
  error?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby="step-title" className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="step-title" className="text-base font-medium break-words">
          {title}
        </h2>
        {description ? (
          <p className="text-sm break-words text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {error ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertDescription className="break-words">{error}</AlertDescription>
        </Alert>
      ) : null}
      {children}
    </section>
  )
}
