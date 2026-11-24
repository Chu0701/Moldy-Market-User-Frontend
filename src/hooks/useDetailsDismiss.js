import { useEffect } from 'react'

/**
 * Closes a native <details> dropdown when clicking outside or pressing Escape.
 * @param {import('react').RefObject<HTMLDetailsElement | null>} ref
 * @param {boolean} isOpen
 * @param {() => void} onClose
 */
export function useDetailsDismiss(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return

    function close(restoreFocus = false) {
      const details = ref.current
      if (!details) return
      details.removeAttribute('open')
      onClose()
      if (restoreFocus) {
        details.querySelector('summary')?.focus()
      }
    }

    function handlePointerDown(event) {
      const details = ref.current
      if (details && !details.contains(event.target)) {
        close(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close(true)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, isOpen, onClose])
}
