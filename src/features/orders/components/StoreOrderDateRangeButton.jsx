import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatDisplayDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return ''
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Unified compact date-range popover trigger formatted as dd/mm/yyyy,
 * keeping the filter toolbar on a single clean baseline.
 *
 * @param {{
 *   from: string,
 *   to: string,
 *   disabled?: boolean,
 *   onChange: (range: { from: string, to: string }) => void,
 * }} props
 */
export function StoreOrderDateRangeButton({ from, to, disabled = false, onChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(from)
  const [draftTo, setDraftTo] = useState(to)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handleToggle() {
    if (!open) {
      setDraftFrom(from)
      setDraftTo(to)
    }
    setOpen((prev) => !prev)
  }

  function applyPreset(preset) {
    if (preset === 'all') {
      onChange({ from: '', to: '' })
      setOpen(false)
      return
    }
    const end = new Date()
    const start = new Date(end)
    if (preset === '7d') start.setDate(end.getDate() - 6)
    else if (preset === '30d') start.setDate(end.getDate() - 29)
    else if (preset === 'month') start.setDate(1)
    onChange({ from: toIsoDate(start), to: toIsoDate(end) })
    setOpen(false)
  }

  function applyCustom(event) {
    event.preventDefault()
    if (draftFrom && draftTo && draftFrom > draftTo) return
    onChange({ from: draftFrom, to: draftTo })
    setOpen(false)
  }

  const hasRange = Boolean(from || to)
  const label = hasRange
    ? `${formatDisplayDate(from) || '…'} – ${formatDisplayDate(to) || '…'}`
    : t('storeOrders.dateRangeLabel')
  const invalidDraft = Boolean(draftFrom && draftTo && draftFrom > draftTo)

  return (
    <div ref={containerRef} className="relative shrink-0">
      <div className="inline-flex items-center">
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={handleToggle}
          className={cn(
            'inline-flex h-9.5 items-center gap-2 rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
            hasRange
              ? 'border-foreground/40 bg-background text-foreground'
              : 'border-input bg-background text-muted-foreground hover:border-foreground/35 hover:text-foreground',
          )}
        >
          <Calendar aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="tabular-nums">{label}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
        </button>

        {hasRange && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ from: '', to: '' })}
            aria-label={t('analytics.seller.clearDates')}
            className="ml-1 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label={t('storeOrders.dateRangeLabel')}
          className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-border bg-card p-3.5 shadow-lg"
        >
          <div className="flex flex-wrap gap-1.5 pb-3 border-b border-border">
            {[
              ['today', 'storeOrders.dayGroups.today'],
              ['7d', 'analytics.seller.presets.last7Days'],
              ['30d', 'analytics.seller.presets.last30Days'],
              ['month', 'analytics.seller.presets.thisMonth'],
              ['all', 'analytics.seller.presets.allTime'],
            ].map(([key, labelKey]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-surface-subtle"
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          <form onSubmit={applyCustom} className="mt-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <label
                  htmlFor="store-order-from"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  {t('analytics.seller.fromDate')}
                </label>
                <input
                  id="store-order-from"
                  type="date"
                  value={draftFrom}
                  onChange={(event) => setDraftFrom(event.target.value)}
                  className="kn-input h-8.5 px-2 text-xs"
                />
              </div>
              <div className="grid gap-1">
                <label
                  htmlFor="store-order-to"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  {t('analytics.seller.toDate')}
                </label>
                <input
                  id="store-order-to"
                  type="date"
                  value={draftTo}
                  onChange={(event) => setDraftTo(event.target.value)}
                  className="kn-input h-8.5 px-2 text-xs"
                />
              </div>
            </div>

            {invalidDraft && (
              <p role="alert" className="text-[11px] text-destructive">
                {t('storeOrders.invalidDateRange')}
              </p>
            )}

            <div className="flex justify-end gap-1.5 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={invalidDraft}>
                {t('storeOrders.applyDates')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
