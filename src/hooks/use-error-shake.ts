"use client"

import * as React from "react"

const INVALID = '[data-invalid="true"]'
const SHAKE = ["t-shake", "is-shaking"] as const

// Replays the shake animation on invalid form fields within the ref. Call shake() on failed submit, never during render.
export function useErrorShake<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null)
  const [replay, setReplay] = React.useState(0)

  React.useEffect(() => {
    if (replay === 0) return
    const root = ref.current
    if (!root) return

    const fields = root.querySelectorAll<HTMLElement>(INVALID)
    if (!fields.length) return

    let longest = 0
    fields.forEach((field) => {
      field.classList.remove(...SHAKE)
      void field.offsetWidth // Force reflow to restart animation keyframes
      field.classList.add(...SHAKE)
      // Read duration from computed style so timer aligns with CSS and reduced-motion settings.
      const ms = parseFloat(getComputedStyle(field).animationDuration)
      if (Number.isFinite(ms)) longest = Math.max(longest, ms * 1000)
    })

    const timer = setTimeout(() => {
      root.querySelectorAll(".is-shaking").forEach((field) => {
        field.classList.remove(...SHAKE)
      })
    }, longest + 20)

    return () => clearTimeout(timer)
  }, [replay])

  return { ref, shake: React.useCallback(() => setReplay((n) => n + 1), []) }
}
