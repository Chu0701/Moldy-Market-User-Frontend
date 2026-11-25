import { createContext, useContext } from 'react'

/**
 * @typedef {'success' | 'info' | 'error'} ToastTone
 * @typedef {{ id: string, message: string, tone: ToastTone }} ToastItem
 */

const noopContext = {
  /** @type {(message: string, tone?: ToastTone) => void} */
  pushToast: () => {},
}

export const ToastContext = createContext(noopContext)

/**
 * Returns toast helper (`pushToast(message, tone)`). Safe outside `<ToastProvider>` (no-op).
 */
export function useToast() {
  return useContext(ToastContext)
}
