import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/**
 * @param {{
 *   page: number,
 *   hasNext: boolean,
 *   totalElements: number,
 *   totalCapped?: boolean,
 *   disabled?: boolean,
 *   onPageChange: (page: number) => void
 * }} props
 */

export function PaginationBar({
  page,
  hasNext,
  totalElements,
  totalCapped = false,
  disabled = false,
  onPageChange,
}) {
  const { t, i18n } = useTranslation()

  const total = new Intl.NumberFormat(i18n.resolvedLanguage).format(totalElements)

  return (
    <nav className="pagination-bar" aria-label={t('pagination.label')}>
      <p>{totalCapped ? t('pagination.cappedResults') : t('pagination.results', { total })}</p>

      <div className="pagination-controls">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {t('pagination.previous')}
        </Button>

        <span aria-current="page">{t('pagination.page', { page })}</span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || !hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          {t('pagination.next')}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
