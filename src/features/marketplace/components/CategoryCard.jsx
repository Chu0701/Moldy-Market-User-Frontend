import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

/** @param {{ name: string, to: string }} props */
export function CategoryCard({ name, to }) {
  return (
    <Link
      to={to}
      className="group flex min-h-14 min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground transition-[border-color,background-color] outline-none hover:border-foreground/40 hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="line-clamp-2 text-sm leading-5 font-medium break-words">{name}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground motion-reduce:transform-none"
      />
    </Link>
  )
}
