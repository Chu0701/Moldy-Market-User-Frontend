import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import {
  useDeactivateMyAppraiserProfile,
  useMyAppraiserProfile,
  useMyAppraiserStatus,
  useReactivateMyAppraiserProfile,
  useRegisterAsAppraiser,
  useUpdateMyAppraiserProfile,
} from '@/features/appraiser/hooks/useAppraiserData'
import { appraiserProfileSchema } from '@/features/appraiser/schemas/appraiserSchemas'
import { useSession } from '@/features/auth/hooks/useSession'
import { useCategories } from '@/features/marketplace/hooks/useCategories'
import { uploadMediaFile } from '@/services/files/fileUploadService'

function flattenCategories(categories = []) {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])
}

function getMutationErrorKey(error) {
  const errors = {
    APPRAISER_ALREADY_REGISTERED: 'appraiser.errors.alreadyRegistered',
    APPRAISER_CATEGORY_NOT_FOUND: 'appraiser.errors.categoryChanged',
    APPRAISER_STATUS_INVALID_FOR_UPDATE: 'appraiser.errors.statusChanged',
  }
  return errors[error?.code] ?? 'appraiser.errors.submitFailed'
}

export function AppraiserProfilePage() {
  const { t } = useTranslation()
  const { profileQuery: sessionQuery } = useSession()
  const userId = sessionQuery.data?.id
  const profileQuery = useMyAppraiserProfile(userId)
  const statusQuery = useMyAppraiserStatus(userId, profileQuery.isSuccess)
  const categoriesQuery = useCategories()
  const registerMutation = useRegisterAsAppraiser(userId)
  const updateMutation = useUpdateMyAppraiserProfile(userId)
  const deactivateMutation = useDeactivateMyAppraiserProfile(userId)
  const reactivateMutation = useReactivateMyAppraiserProfile(userId)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploadedAvatarFileId, setUploadedAvatarFileId] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const { register, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(appraiserProfileSchema),
    mode: 'onTouched',
    defaultValues: { bio: '', categoryIds: [], avatarUrl: '' },
  })

  const categories = useMemo(
    () => flattenCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  )
  const noProfile =
    profileQuery.isError &&
    profileQuery.error?.code === 'APPRAISER_PROFILE_NOT_FOUND' &&
    profileQuery.error?.status === 404

  useEffect(() => {
    if (profileQuery.data && !formState.isDirty) {
      reset({
        bio: profileQuery.data.bio ?? '',
        categoryIds: profileQuery.data.categories?.map((category) => category.categoryId) ?? [],
        avatarUrl: profileQuery.data.avatarUrl ?? '',
      })
    }
  }, [formState.isDirty, profileQuery.data, reset])

  async function submitProfile(values) {
    setActionMessage('')
    setActionError('')
    try {
      let payload = values
      if (avatarFile) {
        setIsUploadingAvatar(true)
        let fileId = uploadedAvatarFileId
        if (!fileId) {
          const uploaded = await uploadMediaFile({
            file: avatarFile,
            purpose: 'USER_AVATAR',
            allowVideo: false,
            resolveDownloadUrl: false,
          })
          fileId = uploaded.fileId
          setUploadedAvatarFileId(fileId)
        }
        payload = { ...values, avatarUrl: '', avatarFileId: fileId }
      }
      if (noProfile) {
        await registerMutation.mutateAsync(payload)
        setActionMessage('appraiser.messages.registrationSent')
      } else {
        await updateMutation.mutateAsync(payload)
        setActionMessage('appraiser.messages.profileSaved')
      }
      reset(values)
      setAvatarFile(null)
      setUploadedAvatarFileId('')
    } catch (error) {
      if (error?.code === 'APPRAISER_ALREADY_REGISTERED') {
        await profileQuery.refetch()
      }
      setActionError(getMutationErrorKey(error))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function changeStatus(mutation, messageKey) {
    setActionError('')
    setActionMessage('')
    try {
      await mutation.mutateAsync()
      setActionMessage(messageKey)
    } catch (error) {
      setActionError(getMutationErrorKey(error))
    }
  }

  const isMutating =
    registerMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending ||
    reactivateMutation.isPending ||
    isUploadingAvatar
  const status = statusQuery.data?.status ?? profileQuery.data?.status
  const canEdit = status === 'ACTIVE'
  const canRegister = noProfile
  const categoryCount = categories.length

  return (
    <AppraiserPageShell
      title={t('appraiser.profile.title')}
      description={t('appraiser.profile.description')}
    >
      {profileQuery.isPending ? (
        <p
          role="status"
          className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground"
        >
          {t('appraiser.profile.loading')}
        </p>
      ) : profileQuery.isError && !noProfile ? (
        <ErrorState
          title={t('appraiser.profile.errorTitle')}
          description={t('appraiser.profile.errorDescription')}
          onRetry={() => void profileQuery.refetch()}
          isRetrying={profileQuery.isFetching}
        />
      ) : (
        <div className="space-y-5">
          {profileQuery.data && (
            <section className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {t('appraiser.profile.statusLabel')}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AppraiserStatusBadge domain="appraiser" status={status} />
                  {statusQuery.data?.verificationLevel && (
                    <AppraiserStatusBadge
                      domain="verification"
                      status={statusQuery.data.verificationLevel}
                    />
                  )}
                </div>
                {statusQuery.isError && (
                  <p role="alert" className="mt-2 text-sm text-destructive">
                    {t('appraiser.profile.statusLoadError')}
                  </p>
                )}
                {status === 'PENDING' && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t('appraiser.profile.pendingNotice')}
                  </p>
                )}
                {status === 'SUSPENDED' && (
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>
                      {statusQuery.data?.suspensionReason || t('appraiser.profile.suspendedNotice')}
                    </p>
                    {statusQuery.data?.suspensionUntil && (
                      <p>
                        {t('appraiser.profile.suspendedUntil', {
                          date: statusQuery.data.suspensionUntil,
                        })}
                      </p>
                    )}
                  </div>
                )}
                {status === 'REJECTED' && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {statusQuery.data?.rejectionReason || t('appraiser.profile.rejectedNotice')}
                  </p>
                )}
              </div>
              {status === 'ACTIVE' && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm(t('appraiser.profile.deactivateConfirm'))) {
                      void changeStatus(deactivateMutation, 'appraiser.messages.deactivated')
                    }
                  }}
                >
                  {deactivateMutation.isPending
                    ? t('appraiser.profile.saving')
                    : t('appraiser.profile.deactivate')}
                </Button>
              )}
              {status === 'INACTIVE' && (
                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm(t('appraiser.profile.reactivateConfirm'))) {
                      void changeStatus(reactivateMutation, 'appraiser.messages.reactivated')
                    }
                  }}
                >
                  {reactivateMutation.isPending
                    ? t('appraiser.profile.saving')
                    : t('appraiser.profile.reactivate')}
                </Button>
              )}
            </section>
          )}

          {actionMessage && (
            <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              {t(actionMessage)}
            </p>
          )}
          {actionError && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {t(actionError)}
            </p>
          )}

          {canRegister && categoriesQuery.isSuccess && categoryCount === 0 ? (
            <EmptyState
              title={t('appraiser.profile.noCategoriesTitle')}
              description={t('appraiser.profile.noCategoriesDescription')}
            />
          ) : canRegister || (canEdit && profileQuery.data) ? (
            <form
              noValidate
              className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:p-6"
              onSubmit={handleSubmit(submitProfile)}
              aria-busy={isMutating}
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {t(
                    canRegister ? 'appraiser.profile.registerTitle' : 'appraiser.profile.editTitle',
                  )}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t('appraiser.profile.formHint')}
                </p>
              </div>

              <div className="grid gap-2">
                <label htmlFor="appraiser-bio" className="text-sm font-medium">
                  {t('appraiser.profile.bio')}
                </label>
                <textarea
                  id="appraiser-bio"
                  rows={5}
                  maxLength={1000}
                  aria-invalid={Boolean(formState.errors.bio)}
                  aria-describedby={
                    formState.errors.bio ? 'appraiser-bio-error' : 'appraiser-bio-hint'
                  }
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('bio')}
                />
                <p id="appraiser-bio-hint" className="text-xs text-muted-foreground">
                  {t('appraiser.profile.bioHint')}
                </p>
                {formState.errors.bio && (
                  <p id="appraiser-bio-error" role="alert" className="text-sm text-destructive">
                    {t(formState.errors.bio.message)}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="appraiser-categories" className="text-sm font-medium">
                  {t('appraiser.profile.categories')}
                </label>
                {categoriesQuery.isPending ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    {t('appraiser.profile.categoriesLoading')}
                  </p>
                ) : categoriesQuery.isError ? (
                  <ErrorState
                    title={t('appraiser.profile.categoriesErrorTitle')}
                    description={t('appraiser.profile.categoriesErrorDescription')}
                    onRetry={() => void categoriesQuery.refetch()}
                    isRetrying={categoriesQuery.isFetching}
                  />
                ) : (
                  <select
                    id="appraiser-categories"
                    multiple
                    size={Math.min(Math.max(categories.length, 4), 8)}
                    aria-invalid={Boolean(formState.errors.categoryIds)}
                    aria-describedby="appraiser-categories-hint"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    {...register('categoryIds')}
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
                <p id="appraiser-categories-hint" className="text-xs text-muted-foreground">
                  {t('appraiser.profile.categoriesHint')}
                </p>
                {formState.errors.categoryIds && (
                  <p role="alert" className="text-sm text-destructive">
                    {t(formState.errors.categoryIds.message)}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="appraiser-avatar" className="text-sm font-medium">
                  {t('appraiser.profile.avatarUrl')}
                </label>
                <input
                  id="appraiser-avatar"
                  type="text"
                  maxLength={255}
                  aria-invalid={Boolean(formState.errors.avatarUrl)}
                  className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('avatarUrl')}
                />
                {formState.errors.avatarUrl && (
                  <p role="alert" className="text-sm text-destructive">
                    {t(formState.errors.avatarUrl.message)}
                  </p>
                )}
                <label htmlFor="appraiser-avatar-file" className="text-sm font-medium">
                  {t('appraiser.profile.avatarUpload')}
                </label>
                <input
                  id="appraiser-avatar-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isMutating}
                  onChange={(event) => {
                    setAvatarFile(event.target.files?.[0] ?? null)
                    setUploadedAvatarFileId('')
                  }}
                  className="min-h-11 rounded-lg border border-input bg-background p-2 text-sm"
                />
                {avatarFile && (
                  <span className="text-xs text-muted-foreground">{avatarFile.name}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isMutating || categoriesQuery.isError}>
                  {isMutating
                    ? t('appraiser.profile.saving')
                    : t(
                        canRegister
                          ? 'appraiser.profile.submitRegistration'
                          : 'appraiser.profile.save',
                      )}
                </Button>
                {formState.isDirty && (
                  <p className="text-xs text-muted-foreground">
                    {t('appraiser.profile.unsavedNotice')}
                  </p>
                )}
              </div>
            </form>
          ) : profileQuery.data ? (
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold">{t('appraiser.profile.detailsTitle')}</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t('appraiser.profile.name')}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{profileQuery.data.fullName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t('appraiser.profile.expertise')}
                  </dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {profileQuery.data.categories?.length ? (
                      profileQuery.data.categories.map((category) => (
                        <span
                          key={category.categoryId}
                          className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium"
                        >
                          {category.categoryName}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t('appraiser.profile.completed')}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {profileQuery.data.totalCompletedAppraisals}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">
                    {t('appraiser.profile.rating')}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {profileQuery.data.averageRating ?? '—'} ({profileQuery.data.reviewCount ?? 0})
                  </dd>
                </div>
              </dl>
              {!canEdit && (
                <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                  {t('appraiser.profile.readOnlyNotice')}
                </p>
              )}
            </section>
          ) : null}
        </div>
      )}
    </AppraiserPageShell>
  )
}
