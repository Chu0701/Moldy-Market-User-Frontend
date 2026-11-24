const ORDER_TYPES = new Set([
  'ORDER_CREATED',
  'ORDER_CONFIRMED',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_COMPLETED',
  'ORDER_CANCELLED',
  'PAYMENT_SUCCESS',
])

const FINANCE_TYPES = new Set([
  'ESCROW_RELEASED',
  'ESCROW_REFUNDED',
  'DISPUTE_OPENED',
  'DISPUTE_RESOLVED',
  'WITHDRAWAL_REQUESTED',
  'WITHDRAWAL_SUCCESS',
  'WITHDRAWAL_FAILED',
])

const HIGH_PRIORITY_TYPES = new Set([
  'DISPUTE_OPENED',
  'DISPUTE_RESOLVED',
  'WITHDRAWAL_FAILED',
  'ORDER_CANCELLED',
])

/** @param {string | null | undefined} type */
export function getNotificationCategory(type) {
  if (!type) return 'other'
  if (ORDER_TYPES.has(type)) return 'orders'
  if (FINANCE_TYPES.has(type)) return 'finance'
  return 'other'
}

/** @param {string | null | undefined} type */
export function getNotificationVisual(type) {
  if (type === 'DISPUTE_OPENED' || type === 'DISPUTE_RESOLVED' || type === 'WITHDRAWAL_FAILED') {
    return {
      icon: 'alert',
      priority: 'high',
      iconTone: 'border-destructive/30 bg-destructive/10 text-destructive',
    }
  }
  if (
    type === 'ESCROW_RELEASED' ||
    type === 'ESCROW_REFUNDED' ||
    type === 'WITHDRAWAL_REQUESTED' ||
    type === 'WITHDRAWAL_SUCCESS' ||
    type === 'PAYMENT_SUCCESS'
  ) {
    return {
      icon: 'wallet',
      priority: 'normal',
      iconTone: 'border-success/25 bg-success/10 text-success',
    }
  }
  if (type && ORDER_TYPES.has(type)) {
    return {
      icon: 'order',
      priority: HIGH_PRIORITY_TYPES.has(type) ? 'high' : 'normal',
      iconTone: 'border-border bg-secondary text-foreground',
    }
  }
  if (type === 'REVIEW_RECEIVED') {
    return {
      icon: 'review',
      priority: 'normal',
      iconTone: 'border-border bg-surface-subtle text-foreground',
    }
  }
  if (type && (type.startsWith('APPRAISAL_') || type.startsWith('OFFER_'))) {
    return {
      icon: 'shield',
      priority: 'normal',
      iconTone: 'border-border bg-surface-subtle text-foreground',
    }
  }
  return {
    icon: 'bell',
    priority: 'normal',
    iconTone: 'border-border bg-surface-subtle text-muted-foreground',
  }
}

/** @param {{ relatedEntityType?: string | null, relatedEntityId?: string | null }} item */
export function getNotificationLink(item) {
  const entityType = item?.relatedEntityType
  const entityId = item?.relatedEntityId
  if (entityType === 'ORDER' && entityId) {
    return {
      to: `/orders/${encodeURIComponent(entityId)}`,
      actionKey: 'notifications.actions.viewOrder',
    }
  }
  if (entityType === 'WITHDRAWAL') {
    return {
      to: '/wallet',
      actionKey: 'notifications.actions.viewWallet',
    }
  }
  if (entityType === 'PAYMENT') {
    return {
      to: '/transactions',
      actionKey: 'notifications.actions.viewPayment',
    }
  }
  return null
}

/** @param {string | null | undefined} value */
export function getNotificationTimeGroup(value, now = new Date()) {
  if (!value) return 'older'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'older'

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.floor((startOfToday - startOfDate) / (24 * 60 * 60 * 1000))

  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays <= 7) return 'thisWeek'
  return 'older'
}

/** @param {Array<object>} items */
export function groupNotificationsByTime(items, now = new Date()) {
  const buckets = { today: [], yesterday: [], thisWeek: [], older: [] }
  for (const item of items) {
    buckets[getNotificationTimeGroup(item.createdAt, now)].push(item)
  }
  return ['today', 'yesterday', 'thisWeek', 'older']
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, items: buckets[key] }))
}

/** @param {string | null | undefined} value @param {string} language */
export function formatRelativeNotificationTime(value, language) {
  if (!value) return { label: null, full: null }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { label: null, full: null }

  const locale = language === 'en' ? 'en-US' : 'vi-VN'
  const full = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)

  if (typeof Intl.RelativeTimeFormat === 'function' && absSeconds < 7 * 24 * 60 * 60) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (absSeconds < 60) {
      return { label: rtf.format(0, 'second'), full }
    }
    if (absSeconds < 3600) {
      return { label: rtf.format(Math.round(diffSeconds / 60), 'minute'), full }
    }
    if (absSeconds < 86400) {
      return { label: rtf.format(Math.round(diffSeconds / 3600), 'hour'), full }
    }
    return { label: rtf.format(Math.round(diffSeconds / 86400), 'day'), full }
  }

  return {
    label: new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date),
    full,
  }
}
