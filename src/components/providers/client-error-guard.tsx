'use client'

import { useEffect } from 'react'

/**
 * ClientErrorGuard
 * Intercepts unhandled promise rejections that reject with native DOM Event objects
 * (e.g., resource loading errors, image/font network events, SSE disconnects)
 * preventing Next.js's dev-overlay from crashing with uncoerced `[object Event]` errors.
 */
export function ClientErrorGuard() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const isDomEvent =
        reason instanceof Event ||
        (reason &&
          typeof reason === 'object' &&
          !('message' in reason) &&
          !('stack' in reason))

      if (isDomEvent) {
        event.stopImmediatePropagation()
        event.preventDefault()
        console.warn('[PersonaGrid] Suppressed unhandled DOM Event rejection:', reason)
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true })
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true })
    }
  }, [])

  return null
}
