import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownToLine, Clock, History } from 'lucide-react'
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
import { cn } from '@/lib/utils'

const COMMON_VN_BANKS = [
  'Vietcombank',
  'VietinBank',
  'BIDV',
  'Agribank',
  'Techcombank',
  'MB Bank',
  'ACB',
  'VPBank',
  'TPBank',
  'Sacombank',
  'VIB',
  'HDBank',
  'OCB',
  'MSB',
  'SHB',
]

const CREDIT_TX_TYPES = new Set([
  'REFUND',
  'WITHDRAWAL_REVERSE',
  'CAPTURE',
  'RELEASE',
  'ORDER_PAYOUT',
])
const DEBIT_TX_TYPES = new Set(['WITHDRAWAL_HOLD', 'WITHDRAWAL_DONE', 'HOLD', 'FEE'])

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
    <section className="mx-auto grid max-w-5xl gap-6" aria-labelledby="wallet-title">
      <header className="grid gap-1.5">
        <h1 id="wallet-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('wallet.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('wallet.subtitle')}</p>
      </header>

      <div className="kn-stats-band sm:grid-cols-3">
        <article className="kn-stat-cell bg-surface-subtle">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            <p className="text-xs font-semibold text-foreground">{t('wallet.availableBalance')}</p>
          </div>
          <ProductPrice
            value={wallet.availableBalance ?? 0}
            className="text-3xl font-semibold tracking-tight tabular-nums"
          />
          <p className="text-xs leading-5 text-muted-foreground">{t('wallet.availableHint')}</p>
        </article>
        <article className="kn-stat-cell">
          <p className="text-xs font-medium text-muted-foreground">
            {t('wallet.pendingWithdrawBalance')}
          </p>
          <ProductPrice
            value={wallet.pendingWithdrawBalance ?? 0}
            className="text-2xl font-semibold tracking-tight tabular-nums"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            {t('wallet.pendingWithdrawHint')}
          </p>
        </article>
        <article className="kn-stat-cell">
          <p className="text-xs font-medium text-muted-foreground">{t('wallet.heldBalance')}</p>
          <ProductPrice
            value={wallet.heldBalance ?? 0}
            className="text-2xl font-semibold tracking-tight tabular-nums"
          />
          <p className="text-xs leading-5 text-muted-foreground">{t('wallet.heldHint')}</p>
        </article>
      </div>

      {feedback && (
        <p
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={
            feedback.type === 'error'
              ? 'rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive'
              : 'rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm font-medium text-foreground'
          }
        >
          {feedback.message}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section
          className="kn-table-card grid content-start"
          aria-labelledby="wallet-withdraw-heading"
        >
          <div className="kn-table-toolbar">
            <div className="grid gap-0.5">
              <h2 id="wallet-withdraw-heading" className="text-base font-semibold tracking-tight">
                {t('wallet.withdrawTitle')}
              </h2>
              <p className="text-xs text-muted-foreground">{t('wallet.withdrawHint')}</p>
            </div>
          </div>

          <form
            noValidate
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            className="grid gap-4 p-5"
          >
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="withdraw-amount" className="text-[13px] font-medium">
                  {t('wallet.fields.amount')}
                </label>
                {availableBalance > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setValue('amount', String(availableBalance), { shouldValidate: true })
                    }
                    className="text-xs font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                  >
                    {t('wallet.withdrawMax')}
                  </button>
                )}
              </div>
              <input
                id="withdraw-amount"
                type="number"
                min="1"
                step="1000"
                aria-invalid={errors.amount ? 'true' : undefined}
                {...register('amount')}
                className="kn-input tabular-nums"
              />
              {errors.amount && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {t(errors.amount.message)}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="withdraw-bank-name" className="text-[13px] font-medium">
                  {t('wallet.fields.bankName')}
                </label>
                <input
                  id="withdraw-bank-name"
                  type="text"
                  list="vn-banks-list"
                  aria-invalid={errors.bankName ? 'true' : undefined}
                  {...bankNameReg}
                  onChange={(event) => {
                    editedFields.current.add('bankName')
                    void bankNameReg.onChange(event)
                  }}
                  className="kn-input"
                />
                <datalist id="vn-banks-list">
                  {COMMON_VN_BANKS.map((bank) => (
                    <option key={bank} value={bank} />
                  ))}
                </datalist>
                {errors.bankName && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {t(errors.bankName.message)}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="withdraw-account-number" className="text-[13px] font-medium">
                  {t('wallet.fields.bankAccountNumber')}
                </label>
                <input
                  id="withdraw-account-number"
                  type="text"
                  aria-invalid={errors.bankAccountNumber ? 'true' : undefined}
                  {...bankAccountNumberReg}
                  onChange={(event) => {
                    editedFields.current.add('bankAccountNumber')
                    void bankAccountNumberReg.onChange(event)
                  }}
                  className="kn-input tabular-nums"
                />
                {errors.bankAccountNumber && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {t(errors.bankAccountNumber.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="withdraw-account-holder" className="text-[13px] font-medium">
                {t('wallet.fields.bankAccountHolder')}
              </label>
              <input
                id="withdraw-account-holder"
                type="text"
                aria-invalid={errors.bankAccountHolder ? 'true' : undefined}
                {...bankAccountHolderReg}
                onChange={(event) => {
                  editedFields.current.add('bankAccountHolder')
                  void bankAccountHolderReg.onChange(event)
                }}
                className="kn-input"
              />
              <p className="text-xs text-muted-foreground">{t('wallet.accountHolderHint')}</p>
              {errors.bankAccountHolder && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {t(errors.bankAccountHolder.message)}
                </p>
              )}
            </div>

            <div className="grid gap-2 border-t border-border pt-4">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={createWithdrawal.isPending || availableBalance <= 0}
              >
                {t(createWithdrawal.isPending ? 'wallet.submitting' : 'wallet.submitWithdraw')}
              </Button>
              {availableBalance <= 0 ? (
                <p className="text-xs text-muted-foreground">{t('wallet.zeroBalanceHint')}</p>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{t('wallet.processingTimeHint')}</span>
                </p>
              )}
            </div>
          </form>
        </section>

        <section
          className="kn-table-card grid content-start"
          aria-labelledby="wallet-withdrawals-heading"
        >
          <div className="kn-table-toolbar">
            <div className="flex items-baseline gap-2.5">
              <h2
                id="wallet-withdrawals-heading"
                className="text-base font-semibold tracking-tight"
              >
                {t('wallet.withdrawalsTitle')}
              </h2>
              {withdrawals.length > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t('table.rowsCount', { count: withdrawals.length })}
                </span>
              )}
            </div>
          </div>

          {withdrawalsQuery.isPending ? (
            <p role="status" className="p-5 text-sm text-muted-foreground">
              {t('wallet.loadingWithdrawals')}
            </p>
          ) : withdrawalsQuery.isError ? (
            <div className="p-5">
              <ErrorState
                title={t('wallet.withdrawalsLoadError')}
                description={t('feedback.checkBack')}
                onRetry={() => void withdrawalsQuery.refetch()}
                isRetrying={withdrawalsQuery.isFetching}
              />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={ArrowDownToLine}
                title={t('wallet.emptyWithdrawalsTitle')}
                description={t('wallet.emptyWithdrawalsDescription')}
                className="border-dashed bg-transparent py-8 shadow-none"
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {withdrawals.map((item) => {
                const isLive = item.status === 'REQUESTED' || item.status === 'PROCESSING'
                const dotColor =
                  item.status === 'COMPLETED'
                    ? 'bg-success'
                    : item.status === 'REJECTED' || item.status === 'FAILED'
                      ? 'bg-destructive'
                      : isLive
                        ? 'bg-warning'
                        : 'bg-muted-foreground'
                return (
                  <li
                    key={item.id}
                    className="grid gap-2 px-5 py-4 text-sm transition-colors duration-150 hover:bg-surface-subtle"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <ProductPrice
                        value={item.amount}
                        className="text-base font-semibold tabular-nums"
                      />
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-foreground">
                        <span className={`size-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
                        {t('wallet.withdrawalStatuses.' + item.status, {
                          defaultValue: item.status,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.bankName}
                      {item.maskedBankAccountNumber
                        ? ' • ' + item.maskedBankAccountNumber
                        : ''} • {item.bankAccountHolder}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {item.requestedAt && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          <OrderDate value={item.requestedAt} />
                        </p>
                      )}
                      {item.status === 'REQUESTED' && (
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
                      )}
                    </div>
                    {item.rejectionReason && (
                      <p className="text-xs font-medium text-destructive">
                        {t('wallet.rejectionReason', { reason: item.rejectionReason })}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="kn-table-card" aria-labelledby="wallet-transactions-heading">
        <div className="kn-table-toolbar">
          <div className="flex items-baseline gap-2.5">
            <h2 id="wallet-transactions-heading" className="text-base font-semibold tracking-tight">
              {t('wallet.transactionsTitle')}
            </h2>
            {transactions.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {t('table.rowsCount', { count: transactions.length })}
              </span>
            )}
          </div>
        </div>

        {transactionsQuery.isPending ? (
          <p role="status" className="p-5 text-sm text-muted-foreground">
            {t('wallet.loadingTransactions')}
          </p>
        ) : transactionsQuery.isError ? (
          <div className="p-5">
            <ErrorState
              title={t('wallet.transactionsLoadError')}
              description={t('feedback.checkBack')}
              onRetry={() => void transactionsQuery.refetch()}
              isRetrying={transactionsQuery.isFetching}
            />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={History}
              title={t('wallet.emptyTransactionsTitle')}
              description={t('wallet.emptyTransactionsDescription')}
              className="border-dashed bg-transparent py-8 shadow-none"
            />
          </div>
        ) : (
          <div className="kn-table-scroll">
            <table className="kn-table">
              <thead>
                <tr>
                  <th scope="col">{t('table.type')}</th>
                  <th scope="col">{t('table.date')}</th>
                  <th scope="col" className="text-right">
                    {t('table.amount')}
                  </th>
                  <th scope="col" className="text-right">
                    {t('table.balanceAfter')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCredit = CREDIT_TX_TYPES.has(tx.transactionType)
                  const isDebit = DEBIT_TX_TYPES.has(tx.transactionType)
                  return (
                    <tr key={tx.id}>
                      <td>
                        <p className="font-medium text-foreground">
                          {t('wallet.transactionTypes.' + tx.transactionType, {
                            defaultValue: tx.transactionType,
                          })}
                        </p>
                        {tx.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{tx.description}</p>
                        )}
                      </td>
                      <td className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                        {tx.createdAt ? <OrderDate value={tx.createdAt} /> : '—'}
                      </td>
                      <td
                        className={cn(
                          'text-right font-semibold whitespace-nowrap tabular-nums',
                          isCredit && 'text-success',
                          isDebit && 'text-destructive',
                        )}
                      >
                        {isCredit ? '+' : isDebit ? '−' : ''}
                        <ProductPrice value={Math.abs(Number(tx.amount ?? 0))} />
                      </td>
                      <td className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                        <ProductPrice value={tx.availableBalanceAfter ?? 0} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
