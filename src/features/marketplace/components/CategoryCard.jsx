import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

/** @param {{ name: string, to: string }} props */
export function CategoryCard({ name, to }) {
  return (
    <Link
      to={to}
      className="group flex min-h-32 min-w-0 flex-col justify-between gap-6 rounded-xl border border-border bg-card p-4 text-card-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring lg:p-6"
    >
      <ArrowUpRight aria-hidden="true" className="size-5 self-end text-muted-foreground" />
      <span className="text-sm leading-6 font-medium break-words sm:text-base">{name}</span>
    </Link>
  )
}
