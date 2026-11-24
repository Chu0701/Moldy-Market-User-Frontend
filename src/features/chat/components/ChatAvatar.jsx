import { cn } from '@/lib/utils'

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** @param {{ name?: string | null, src?: string | null, size?: 'sm' | 'md', className?: string }} props */
export function ChatAvatar({ name, src, size = 'md', className }) {
  const sizeClass = size === 'sm' ? 'size-8 text-[11px]' : 'size-10 text-xs'

  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cn(
          'shrink-0 rounded-full border border-border bg-secondary object-cover',
          sizeClass,
          className,
        )}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary font-semibold tracking-tight text-foreground select-none',
        sizeClass,
        className,
      )}
    >
      {getInitials(name)}
    </span>
  )
}

export function ChatListSkeleton({ label }) {
  return (
    <div role="status" className="grid gap-1 p-2">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="grid min-w-0 flex-1 gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
              <div className="h-3 w-10 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-40 animate-pulse rounded bg-muted/80" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChatMessagesSkeleton({ label }) {
  return (
    <div role="status" className="grid gap-3 py-2">
      <span className="sr-only">{label}</span>
      <div className="h-10 w-52 animate-pulse rounded-2xl rounded-bl-md bg-muted" />
      <div className="ml-auto h-12 w-60 animate-pulse rounded-2xl rounded-br-md bg-muted/80" />
      <div className="h-14 w-64 animate-pulse rounded-2xl rounded-bl-md bg-muted" />
      <div className="ml-auto h-10 w-44 animate-pulse rounded-2xl rounded-br-md bg-muted/80" />
    </div>
  )
}
