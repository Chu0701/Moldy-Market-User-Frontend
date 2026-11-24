import { CheckCircle2, ShieldCheck, Store } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useSession } from '@/features/auth/hooks/useSession'
import { OpenStoreForm } from '@/features/stores/components/OpenStoreForm'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useMyStore } from '@/features/stores/hooks/useMyStore'

export function OpenStorePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const store = getStoreContext(profileQuery.data)
  const storeQuery = useMyStore(store.kind === 'staff' ? undefined : userId)
  const [preview, setPreview] = useState({ name: '', description: '', pickupAddress: '' })

  if (store.kind === 'staff') {
    return <Navigate to="/store" replace />
  }

  function goToStore() {
    void navigate('/store', { replace: true })
  }

  function handleExistingStore() {
    void storeQuery.refetch()
  }

  if (storeQuery.data) {
    return <Navigate to="/store" replace />
  }

  const previewName = preview.name.trim() || t('stores.open.previewPlaceholderName')
  const previewDesc = preview.description.trim() || t('stores.open.previewPlaceholderDesc')
  const previewInitial = previewName.charAt(0).toUpperCase() || 'M'

  return (
    <section className="open-store-page" aria-labelledby="open-store-title">
      <header className="space-y-1.5">
        <h1 id="open-store-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('stores.open.title')}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {t('stores.open.subtitle')}
        </p>
      </header>

      {!userId || storeQuery.error?.status === 403 ? (
        <ForbiddenState />
      ) : storeQuery.isPending ? (
        <p role="status">{t('stores.loading')}</p>
      ) : storeQuery.isError ? (
        <ErrorState
          title={t('stores.loadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void storeQuery.refetch()}
          isRetrying={storeQuery.isFetching}
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)] lg:gap-8">
          <OpenStoreForm
            key={userId}
            userId={userId}
            onCreated={goToStore}
            onExistingStore={handleExistingStore}
            onPreviewChange={setPreview}
          />

          <aside className="grid gap-4 lg:sticky lg:top-24">
            <div className="kn-table-card grid gap-4 p-5">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t('stores.open.previewTitle')}
              </p>
              <div className="flex items-start gap-3.5">
                <span
                  aria-hidden="true"
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground"
                >
                  {previewInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-foreground">{previewName}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {previewDesc}
                  </p>
                  {preview.pickupAddress.trim() && (
                    <p className="mt-2 truncate text-[11px] text-muted-foreground">
                      <Store className="mr-1 inline size-3" aria-hidden="true" />
                      {preview.pickupAddress.trim()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="kn-table-card grid gap-3 p-5">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <ShieldCheck className="size-4 text-foreground" aria-hidden="true" />
                <span>{t('stores.open.benefitsTitle')}</span>
              </div>
              <ul className="grid gap-2.5 text-xs leading-5 text-muted-foreground">
                {['benefit1', 'benefit2', 'benefit3'].map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 size-3.5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span>{t(`stores.open.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
