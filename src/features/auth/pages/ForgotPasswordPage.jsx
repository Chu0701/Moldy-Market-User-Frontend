import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { loginSchema } from '@/features/auth/schemas/loginSchema'
import { forgotPassword, resetPassword } from '@/services/auth/authService'

const requestSchema = z.object({
  email: loginSchema.shape.email,
})

const resetSchema = z
  .object({
    email: loginSchema.shape.email,
    code: z.string().regex(/^[0-9]{6}$/, 'auth.verify.codeInvalid'),
    newPassword: z.string().min(8, 'auth.forgot.passwordMin').max(100, 'auth.forgot.passwordMax'),
    confirmPassword: z.string().min(1, 'auth.forgot.confirmRequired'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'auth.forgot.passwordMismatch',
  })

const errorKeys = new Map([
  ['OTP_INVALID', 'auth.verify.invalid'],
  ['OTP_EXPIRED', 'auth.verify.expired'],
  ['OTP_ATTEMPTS_EXCEEDED', 'auth.verify.attemptsExceeded'],
  ['OTP_RESEND_TOO_SOON', 'auth.verify.tooSoon'],
  ['EMAIL_DELIVERY_FAILED', 'auth.verify.deliveryFailed'],
])

function resolveErrorKey(error) {
  return (
    errorKeys.get(error?.code) ??
    (error?.status === 429 ? 'auth.verify.rateLimited' : 'auth.forgot.submitError')
  )
}

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState('request')
  const [targetEmail, setTargetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resending, setResending] = useState(false)
  const [resentNotice, setResentNotice] = useState(false)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return undefined
    const timer = window.setTimeout(() => setRemaining((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  const requestForm = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  })

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '', code: '', newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
  })

  async function handleRequestOtp(values) {
    const email = values.email.trim()
    requestForm.clearErrors('root.server')
    try {
      await forgotPassword({ email })
      setTargetEmail(email)
      resetForm.setValue('email', email)
      setRemaining(60)
      setStep('reset')
    } catch (error) {
      requestForm.setError('root.server', { message: resolveErrorKey(error) })
    }
  }

  async function handleResetSubmit(values) {
    resetForm.clearErrors('root.server')
    setResentNotice(false)
    try {
      await resetPassword({
        email: values.email.trim(),
        code: values.code.trim(),
        newPassword: values.newPassword,
      })
      resetForm.reset()
      setStep('done')
    } catch (error) {
      resetForm.setError('root.server', { message: resolveErrorKey(error) })
    }
  }

  async function handleResend() {
    if (resending || remaining > 0 || !targetEmail) return
    resetForm.clearErrors('root.server')
    setResentNotice(false)
    setResending(true)
    try {
      await forgotPassword({ email: targetEmail })
      setRemaining(60)
      setResentNotice(true)
    } catch (error) {
      resetForm.setError('root.server', { message: resolveErrorKey(error) })
    } finally {
      setResending(false)
    }
  }

  return (
    <section className="login-page" aria-labelledby="forgot-password-title">
      <h1 id="forgot-password-title">{t('auth.forgot.title')}</h1>

      {step === 'done' && (
        <div className="grid gap-4">
          <p
            role="status"
            className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-3 text-sm text-foreground"
          >
            {t('auth.forgot.success')}
          </p>
          <Button asChild>
            <Link to="/login">{t('navigation.login')}</Link>
          </Button>
        </div>
      )}

      {step === 'request' && (
        <form
          className="login-form"
          noValidate
          aria-busy={requestForm.formState.isSubmitting}
          onSubmit={requestForm.handleSubmit(handleRequestOtp)}
        >
          <p className="text-sm text-muted-foreground">{t('auth.forgot.subtitle')}</p>

          <div className="login-field">
            <label htmlFor="forgot-email">{t('auth.login.email')}</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(requestForm.formState.errors.email)}
              {...requestForm.register('email')}
            />
            {requestForm.formState.errors.email && (
              <p role="alert">{t(requestForm.formState.errors.email.message)}</p>
            )}
          </div>

          {requestForm.formState.errors.root?.server && (
            <p className="login-form-error" role="alert">
              {t(requestForm.formState.errors.root.server.message)}
            </p>
          )}

          <Button type="submit" disabled={requestForm.formState.isSubmitting}>
            {t(
              requestForm.formState.isSubmitting
                ? 'auth.verify.sending'
                : 'auth.forgot.sendCodeAction',
            )}
          </Button>
        </form>
      )}

      {step === 'reset' && (
        <form
          className="login-form"
          noValidate
          aria-busy={resetForm.formState.isSubmitting}
          onSubmit={resetForm.handleSubmit(handleResetSubmit)}
        >
          <p className="rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-xs leading-5 text-muted-foreground">
            {t('auth.forgot.codeSentHint', { email: targetEmail })}
          </p>

          <input type="hidden" {...resetForm.register('email')} />

          <div className="login-field">
            <label htmlFor="reset-code">{t('auth.verify.code')}</label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              required
              className="text-center font-mono text-lg font-semibold tracking-[0.35em]"
              aria-invalid={Boolean(resetForm.formState.errors.code)}
              {...resetForm.register('code')}
            />
            {resetForm.formState.errors.code && (
              <p role="alert">{t(resetForm.formState.errors.code.message)}</p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="reset-new-password">{t('auth.forgot.newPassword')}</label>
            <div className="password-input-wrap">
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                aria-invalid={Boolean(resetForm.formState.errors.newPassword)}
                {...resetForm.register('newPassword')}
              />
              <button
                type="button"
                className="password-toggle-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
            {resetForm.formState.errors.newPassword && (
              <p role="alert">{t(resetForm.formState.errors.newPassword.message)}</p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="reset-confirm-password">{t('auth.forgot.confirmPassword')}</label>
            <input
              id="reset-confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-invalid={Boolean(resetForm.formState.errors.confirmPassword)}
              {...resetForm.register('confirmPassword')}
            />
            {resetForm.formState.errors.confirmPassword && (
              <p role="alert">{t(resetForm.formState.errors.confirmPassword.message)}</p>
            )}
          </div>

          {resetForm.formState.errors.root?.server && (
            <p className="login-form-error" role="alert">
              {t(resetForm.formState.errors.root.server.message)}
            </p>
          )}

          {resentNotice && (
            <p
              role="status"
              className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-foreground"
            >
              {t('auth.verify.resent')}
            </p>
          )}

          <Button type="submit" disabled={resetForm.formState.isSubmitting}>
            {t(
              resetForm.formState.isSubmitting
                ? 'auth.forgot.resetting'
                : 'auth.forgot.resetAction',
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={resending || remaining > 0}
            onClick={() => void handleResend()}
          >
            {remaining > 0
              ? t('auth.verify.wait', { seconds: remaining })
              : t(resending ? 'auth.verify.sending' : 'auth.verify.resend')}
          </Button>
        </form>
      )}

      {step !== 'done' && (
        <div className="auth-card-footer">
          <Link to="/login" className="login-register-link">
            {t('navigation.login')}
          </Link>
        </div>
      )}
    </section>
  )
}
