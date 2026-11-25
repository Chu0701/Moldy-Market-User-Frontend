import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import {
  useMyAppraiserCommission,
  useMyAppraiserCommissions,
} from '@/features/appraiser/hooks/useAppraiserData'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'

function CommissionDetails({ commission, t, language }) {
  const rows = [
    ['assignmentId', commission.assignmentId],
    ['verificationLevel', commission.verificationLevel],
    ['agreedFee', formatVnd(commission.agreedFee, language)],
    ['appraiserRate', `${commission.appraiserRate}%`],
    ['platformRate', `${commission.platformRate}%`],
    ['appraiserEarnings', formatVnd(commission.appraiserEarnings, language)],
    ['platformFee', formatVnd(commission.platformFee, language)],
    ['calculatedAt', formatLocalDate(commission.calculatedAt, language)],
    ['paidAt', commission.paidAt ? formatLocalDate(commission.paidAt, language) : '—'],
  ]
  return (
    <dl className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{t(`appraiser.commissions.${label}`)}</dt>
          <dd className="mt-1 break-all text-sm font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function AppraiserCommissionsPage() {
  const { t, i18n } = useTranslation()
  const { commissionId } = useParams()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const list = useMyAppraiserCommissions(userId)
  const detail = useMyAppraiserCommission(userId, commissionId)
  return (
    <AppraiserPageShell
      title={t('appraiser.commissions.title')}
      description={t('appraiser.commissions.description')}
    >
      {commissionId &&
        (detail.isPending ? (
          <p role="status">{t('appraiser.commissions.loading')}</p>
        ) : detail.isError ? (
          detail.error?.status === 403 ? (
            <ForbiddenState />
          ) : (
            <ErrorState
              title={t('appraiser.commissions.errorTitle')}
              description={t('appraiser.commissions.errorDescription')}
              onRetry={() => void detail.refetch()}
              isRetrying={detail.isFetching}
            />
          )
        ) : (
          <article className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t('appraiser.commissions.detailTitle')}</h2>
              <AppraiserStatusBadge domain="commission" status={detail.data.status} />
            </div>
            <CommissionDetails commission={detail.data} t={t} language={i18n.language} />
          </article>
        ))}
      {!commissionId &&
        (list.isPending ? (
          <p role="status" className="rounded-xl border border-border bg-card p-5">
            {t('appraiser.commissions.loading')}
          </p>
        ) : list.isError ? (
          list.error?.status === 403 ? (
            <ForbiddenState />
          ) : (
            <ErrorState
              title={t('appraiser.commissions.errorTitle')}
              description={t('appraiser.commissions.errorDescription')}
              onRetry={() => void list.refetch()}
              isRetrying={list.isFetching}
            />
          )
        ) : list.data.length === 0 ? (
          <EmptyState
            title={t('appraiser.commissions.emptyTitle')}
            description={t('appraiser.commissions.emptyDescription')}
          />
        ) : (
          <div className="space-y-3">
            {list.data.map((commission) => (
              <article key={commission.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AppraiserStatusBadge domain="commission" status={commission.status} />
                      <span className="text-xs text-muted-foreground">{commission.id}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold tabular-nums">
                      {formatVnd(commission.appraiserEarnings, i18n.language)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('appraiser.commissions.earnedOf', {
                        fee: formatVnd(commission.agreedFee, i18n.language),
                      })}
                    </p>
                  </div>
                  <Link
                    to={`/appraiser/commissions/${encodeURIComponent(commission.id)}`}
                    className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent"
                  >
                    {t('appraiser.commissions.viewDetail')}
                  </Link>
                </div>
                <dl className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t('appraiser.commissions.assignmentId')}
                    </dt>
                    <dd className="mt-1 break-all text-sm">{commission.assignmentId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t('appraiser.commissions.verificationLevel')}
                    </dt>
                    <dd className="mt-1">
                      <AppraiserStatusBadge
                        domain="verification"
                        status={commission.verificationLevel}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t('appraiser.commissions.calculatedAt')}
                    </dt>
                    <dd className="mt-1 text-sm">
                      {formatLocalDate(commission.calculatedAt, i18n.language)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ))}
    </AppraiserPageShell>
  )
}
