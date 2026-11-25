import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ToastContext } from '@/components/feedback/toastContext'
import { cn } from '@/lib/utils'

const TOAST_DURATION_MS = 3200
const MAX_TOASTS = 4

const toneIcons = {
  success: CheckCircle2,
  info: Info,
  error: XCircle,
}

const toneClasses = {
  success: 'border-success/35 bg-card text-foreground',
  info: 'border-border bg-card text-foreground',
  error: 'border-destructive/40 bg-card text-foreground',
}

const toneIconClasses = {
  success: 'text-success',
  info: 'text-muted-foreground',
  error: 'text-destructive',
}

/** @param {{ children: import('react').ReactNode }} props */
export function ToastProvider({ children }) {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())
  const counterRef = useRef(0)

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const pushToast = useCallback((message, tone = 'success') => {
    const text = typeof message === 'string' ? message.trim() : ''
    if (!text) return
    counterRef.current += 1
    const id = `toast-${counterRef.current}`

    setToasts((current) => [...current.slice(-(MAX_TOASTS - 1)), { id, message: text, tone }])

    const timer = window.setTimeout(() => {
      timersRef.current.delete(id)
      setToasts((current) => current.filter((item) => item.id !== id))
    }, TOAST_DURATION_MS)
    timersRef.current.set(id, timer)
  }, [])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer)
      }
      timers.clear()
    }
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toasts.length > 0 && (
        <div
          aria-live="polite"
          aria-atomic="false"
          className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        >
          {toasts.map((toast) => {
            const Icon = toneIcons[toast.tone] ?? Info
            return (
              <div
                key={toast.id}
                role="status"
                className={cn(
                  'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-lg backdrop-blur-sm transition-all',
                  toneClasses[toast.tone] ?? toneClasses.info,
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 size-4 shrink-0',
                    toneIconClasses[toast.tone] ?? toneIconClasses.info,
                  )}
                />
                <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label={t('actions.close')}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </ToastContext.Provider>
  )
}
