"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

/**
 * A dashboard metric with the number pop-in (transitions-dev 02). Re-polling
 * every 30s is otherwise a silent no-op — re-entering the digits is what makes
 * a room freeing up legible.
 *
 * The group is keyed on its text, so a changed value remounts it and the
 * keyframes replay from a clean baseline with no reflow hack. `primed` is the
 * first-paint guard: until the opening poll has landed, the zeros on screen are
 * a placeholder rather than a previous measurement, so nothing animates.
 */
export function MetricValue({ value, primed }: { value: number; primed: boolean }) {
  const text = String(value)
  const [shown, setShown] = useState({ text, animating: false, primed })

  // Adjust during render rather than in an effect: the group is keyed on the
  // text, so it remounts and the keyframes replay from a clean baseline.
  if (shown.text !== text || shown.primed !== primed) {
    setShown({ text, animating: shown.animating || (shown.primed && shown.text !== text), primed })
  }

  return (
    <span key={shown.text} className={cn("t-digit-group", shown.animating && "is-animating")}>
      {Array.from(text, (char, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: digits have no identity
          key={index}
          className="t-digit"
          data-stagger={
            index === text.length - 2 ? "1" : index === text.length - 1 ? "2" : undefined
          }
        >
          {char}
        </span>
      ))}
    </span>
  )
}
