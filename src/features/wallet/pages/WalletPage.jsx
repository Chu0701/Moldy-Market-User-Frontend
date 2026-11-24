import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { OrderDate } from '@/features/orders/components/OrderDate'
import {
  useCancelWithdrawal,
  useMyWallet,
  useMyWalletTransactions,
  useMyWithdrawals,
  useRequestWithdrawal,
} from '@/features/wallet/hooks/useWallet'
import { withdrawalSchema } from '@/features/wallet/schemas/withdrawalSchema'

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'wd-' + crypto.randomUUID()
  }
  return 'wd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10)
}

export function WalletPage() {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const walletQuery = useMyWallet()
  const withdrawalsQuery = useMyWithdrawals()
  const transactionsQuery = useMyWalletTransactions()
  const createWithdrawal = useRequestWithdrawal()
  const cancelWithdrawal = useCancelWithdrawal()
  const [feedback, setFeedback] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const editedFields = useRef(new Set())

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: '',
      bankName: profileQuery.data?.bankName ?? '',
      bankAccountNumber: profileQuery.data?.bankAccountNumber ?? '',
      bankAccountHolder: profileQuery.data?.fullName ?? '',
    },
  })

  useEffect(() => {
    const defaults = {
      bankName: profileQuery.data?.bankName ?? '',
      bankAccountNumber: profileQuery.data?.bankAccountNumber ?? '',
      bankAccountHolder: profileQuery.data?.fullName ?? '',
    }
    for (const [key, value] of Object.entries(defaults)) {
      if (!editedFields.current.has(key) && value) {
        setValue(key, value)
      }
    }
  }, [
    profileQuery.data?.bankName,
    profileQuery.data?.bankAccountNumber,
    profileQuery.data?.fullName,
    setValue,
  ])

  const bankNameReg = register('bankName')
  const bankAccountNumberReg = register('bankAccountNumber')
  const bankAccountHolderReg = register('bankAccountHolder')

  if (walletQuery.isPending) {
    return <p role="status">{t('wallet.loading')}</p>
  }

  if (walletQuery.error?.status === 403) {
    return <ForbiddenState />
  }

  if (walletQuery.isError) {
    return (
      <ErrorState
        title={t('wallet.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void walletQuery.refetch()}
        isRetrying={walletQuery.isFetching}
      />
    )
  }

  const wallet = walletQuery.data ?? {
    availableBalance: 0,
    heldBalance: 0,
    pendingWithdrawBalance: 0,
    status: 'ACTIVE',
  }
  const availableBalance = Number(wallet.availableBalance ?? 0)
  const withdrawals = withdrawalsQuery.data ?? []
  const transactions = transactionsQuery.data ?? []

  async function onSubmit(values) {
    setFeedback(null)
    if (values.amount > availableBalance) {
      setFeedback({ type: 'error', message: t('wallet.errors.insufficientBalance') })
      return
    }
    try {
      await createWithdrawal.mutateAsync({
        amount: values.amount,
        bankName: values.bankName,
        bankAccountNumber: values.bankAccountNumber,
        bankAccountHolder: values.bankAccountHolder,
        idempotencyKey: createIdempotencyKey(),
      })
      setFeedback({ type: 'success', message: t('wallet.withdrawCreated') })
      reset({
        amount: '',
        bankName: values.bankName,
        bankAccountNumber: values.bankAccountNumber,
        bankAccountHolder: values.bankAccountHolder,
      })
    } catch (error) {
      const message =
        error?.code === 'INSUFFICIENT_BALANCE'
          ? t('wallet.errors.insufficientBalance')
          : error?.code === 'WALLET_INVALID_AMOUNT'
            ? t('wallet.validation.amountPositive')
            : t('wallet.errors.submitFailed')
      setFeedback({ type: 'error', message })
    }
  }

  async function handleCancel(withdrawalId) {
    setFeedback(null)
    setCancellingId(withdrawalId)
    try {
      await cancelWithdrawal.mutateAsync({ withdrawalId })
      setFeedback({ type: 'success', message: t('wallet.withdrawCancelled') })
    } catch {
      setFeedback({ type: 'error', message: t('wallet.errors.cancelFailed') })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="grid gap-8" aria-labelledby="wallet-title">
      <div className="grid gap-2">
        <h1 id="wallet-title" className="text-2xl font-semibold tracking-tight">
          {t('wallet.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('wallet.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="grid gap-1 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t('wallet.availableBalance')}</p>
          <ProductPrice value={wallet.availableBalance ?? 0} className="text-2xl font-semibold" />
        </article>
        <article className="grid gap-1 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t('wallet.pendingWithdrawBalance')}</p>
          <ProductPrice
            value={wallet.pendingWithdrawBalance ?? 0}
            className="text-2xl font-semibold"
          />
        </article>
        <article className="grid gap-1 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t('wallet.heldBalance')}</p>
          <ProductPrice value={wallet.heldBalance ?? 0} className="text-2xl font-semibold" />
        </article>
      </div>

      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={
            feedback.type === 'error'
              ? 'rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'
              : 'rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary'
          }
        >
          {feedback.message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="grid content-start gap-4 rounded-xl border border-border bg-card p-6"
          aria-labelledby="wallet-withdraw-heading"
        >
          <div className="grid gap-1">
            <h2 id="wallet-withdraw-heading" className="text-lg font-semibold">
              {t('wallet.withdrawTitle')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('wallet.withdrawHint')}</p>
          </div>

          <form
            noValidate
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            className="grid gap-4"
          >
            <div className="grid gap-1.5">
              <label htmlFor="withdraw-amount" className="text-sm font-medium">
                {t('wallet.fields.amount')}
              </label>
              <input
                id="withdraw-amount"
                type="number"
                min="1"
                step="1000"
                {...register('amount')}
                className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
              {errors.amount && (
                <p role="alert" className="text-sm text-destructive">
                  {t(errors.amount.message)}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="withdraw-bank-name" className="text-sm font-medium">
                {t('wallet.fields.bankName')}
              </label>
              <input
                id="withdraw-bank-name"
                type="text"
                {...bankNameReg}
                onChange={(event) => {
                  editedFields.current.add('bankName')
                  void bankNameReg.onChange(event)
                }}
                className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
              {errors.bankName && (
                <p role="alert" className="text-sm text-destructive">
                  {t(errors.bankName.message)}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="withdraw-account-number" className="text-sm font-medium">
                {t('wallet.fields.bankAccountNumber')}
              </label>
              <input
                id="withdraw-account-number"
                type="text"
                {...bankAccountNumberReg}
                onChange={(event) => {
                  editedFields.current.add('bankAccountNumber')
                  void bankAccountNumberReg.onChange(event)
                }}
                className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
              {errors.bankAccountNumber && (
                <p role="alert" className="text-sm text-destructive">
                  {t(errors.bankAccountNumber.message)}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="withdraw-account-holder" className="text-sm font-medium">
                {t('wallet.fields.bankAccountHolder')}
              </label>
              <input
                id="withdraw-account-holder"
                type="text"
                {...bankAccountHolderReg}
                onChange={(event) => {
                  editedFields.current.add('bankAccountHolder')
                  void bankAccountHolderReg.onChange(event)
                }}
                className="min-h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
              {errors.bankAccountHolder && (
                <p role="alert" className="text-sm text-destructive">
                  {t(errors.bankAccountHolder.message)}
                </p>
              )}
            </div>

            <Button type="submit" disabled={createWithdrawal.isPending || availableBalance <= 0}>
              {t(createWithdrawal.isPending ? 'wallet.submitting' : 'wallet.submitWithdraw')}
            </Button>
          </form>
        </section>

        <section
          className="grid content-start gap-4 rounded-xl border border-border bg-card p-6"
          aria-labelledby="wallet-withdrawals-heading"
        >
          <h2 id="wallet-withdrawals-heading" className="text-lg font-semibold">
            {t('wallet.withdrawalsTitle')}
          </h2>

          {withdrawalsQuery.isPending ? (
            <p role="status">{t('wallet.loadingWithdrawals')}</p>
          ) : withdrawalsQuery.isError ? (
            <ErrorState
              title={t('wallet.withdrawalsLoadError')}
              description={t('feedback.checkBack')}
              onRetry={() => void withdrawalsQuery.refetch()}
              isRetrying={withdrawalsQuery.isFetching}
            />
          ) : withdrawals.length === 0 ? (
            <EmptyState
              title={t('wallet.emptyWithdrawalsTitle')}
              description={t('wallet.emptyWithdrawalsDescription')}
            />
          ) : (
            <ul className="grid gap-3">
              {withdrawals.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-2 rounded-lg border border-border p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ProductPrice value={item.amount} className="text-base font-semibold" />
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium">
                      {t('wallet.withdrawalStatuses.' + item.status, {
                        defaultValue: item.status,
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {item.bankName}
                    {item.maskedBankAccountNumber
                      ? ' • ' + item.maskedBankAccountNumber
                      : ''} • {item.bankAccountHolder}
                  </p>
                  {item.requestedAt && (
                    <p className="text-xs text-muted-foreground">
                      <OrderDate value={item.requestedAt} />
                    </p>
                  )}
                  {item.rejectionReason && (
                    <p className="text-xs text-destructive">
                      {t('wallet.rejectionReason', { reason: item.rejectionReason })}
                    </p>
                  )}
                  {item.status === 'REQUESTED' && (
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={cancellingId === item.id}
                        onClick={() => void handleCancel(item.id)}
                      >
                        {t(
                          cancellingId === item.id
                            ? 'wallet.cancelling'
                            : 'wallet.cancelWithdrawal',
                        )}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section
        className="grid gap-4 rounded-xl border border-border bg-card p-6"
        aria-labelledby="wallet-transactions-heading"
      >
        <h2 id="wallet-transactions-heading" className="text-lg font-semibold">
          {t('wallet.transactionsTitle')}
        </h2>

        {transactionsQuery.isPending ? (
          <p role="status">{t('wallet.loadingTransactions')}</p>
        ) : transactionsQuery.isError ? (
          <ErrorState
            title={t('wallet.transactionsLoadError')}
            description={t('feedback.checkBack')}
            onRetry={() => void transactionsQuery.refetch()}
            isRetrying={transactionsQuery.isFetching}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            title={t('wallet.emptyTransactionsTitle')}
            description={t('wallet.emptyTransactionsDescription')}
          />
        ) : (
          <ul className="grid gap-3">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 text-sm"
              >
                <div className="grid gap-1">
                  <p className="font-medium">
                    {t('wallet.transactionTypes.' + tx.transactionType, {
                      defaultValue: tx.transactionType,
                    })}
                  </p>
                  {tx.description && <p className="text-muted-foreground">{tx.description}</p>}
                  {tx.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      <OrderDate value={tx.createdAt} />
                    </p>
                  )}
                </div>
                <div className="grid justify-items-end gap-1">
                  <ProductPrice value={tx.amount} className="font-semibold" />
                  <p className="text-xs text-muted-foreground">
                    {t('wallet.balanceAfter')}:{' '}
                    <ProductPrice value={tx.availableBalanceAfter ?? 0} />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
