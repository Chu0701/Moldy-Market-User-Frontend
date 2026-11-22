import { useEffect, useState } from 'react'
import { remainingSeconds } from '@/features/checkout/checkoutPayment'

export function usePaymentDeadline(deadline, active) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active || !deadline || !Number.isFinite(Date.parse(deadline))) return
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (remainingSeconds(deadline, current) === 0) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [deadline, active])
  return remainingSeconds(deadline, now)
}
