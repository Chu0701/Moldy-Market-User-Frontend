import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function Logo() {
  const { t } = useTranslation()

  return (
    <Link
      to="/"
      className="group inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-md font-heading text-xl font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-2xl"
    >
      <span
        aria-hidden="true"
        className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-150 group-hover:-rotate-3 motion-reduce:transform-none"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-4.5"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M4 19V6.5L12 13l8-6.5V19" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{t('app.name')}</span>
    </Link>
  )
}
