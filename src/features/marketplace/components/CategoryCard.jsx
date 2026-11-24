import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

/** @param {{ name: string, to: string }} props */
export function CategoryCard({ name, to }) {
  return (
    <Link
      to={to}
      className="group flex min-h-14 min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground transition-[transform,border-color,background-color,box-shadow] duration-150 outline-none hover:-translate-y-0.5 hover:border-foreground/45 hover:bg-surface-subtle hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
    >
      <span className="line-clamp-2 text-sm leading-5 font-medium break-words">{name}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground motion-reduce:transform-none"
      />
    </Link>
  )
}
