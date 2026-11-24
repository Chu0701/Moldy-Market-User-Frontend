import { useEffect, useRef, useState } from 'react'

function shouldRevealImmediately() {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return true
  }
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
}

/**
 * One-shot scroll reveal helper that only animates opacity and transform,
 * and falls back to immediately visible under reduced motion or non-IO environments.
 */
export function useRevealOnScroll() {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(shouldRevealImmediately)

  useEffect(() => {
    if (isVisible) return
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [isVisible])

  return { ref, isVisible }
}
