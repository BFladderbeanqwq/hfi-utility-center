import type { ReactNode } from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * A titled region of the page. Deliberately quieter than the vanilla `Card`:
 * tight padding and a `text-sm` title, because most of these are grouped by the
 * page's own whitespace rather than by a box.
 *
 * `bordered={false}` drops the border and fill entirely for read-only regions
 * that should not read as an interactive or isolated container.
 */
export function SectionCard({
  title,
  description,
  actions,
  children,
  footer,
  bordered = true,
  className,
  contentClassName,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  footer?: ReactNode
  bordered?: boolean
  className?: string
  contentClassName?: string
}) {
  return (
    <Card
      size="sm"
      className={cn("min-w-0", !bordered && "border-0 bg-transparent shadow-none", className)}
    >
      {title || description || actions ? (
        <CardHeader className="min-w-0">
          <div className="flex min-w-0 flex-col gap-1">
            {title ? (
              <CardTitle className="font-heading text-sm break-words">{title}</CardTitle>
            ) : null}
            {description ? (
              <CardDescription className="text-sm break-words text-muted-foreground">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {actions ? (
            <CardAction className="flex flex-wrap items-center gap-2">{actions}</CardAction>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("min-w-0", contentClassName)}>{children}</CardContent>
      {footer ? <CardFooter className="flex-wrap gap-2">{footer}</CardFooter> : null}
    </Card>
  )
}
