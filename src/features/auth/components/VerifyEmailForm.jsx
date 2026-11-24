import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { loginSchema } from '@/features/auth/schemas/loginSchema'
import { resendVerification, verifyEmail } from '@/services/auth/authService'

const verificationSchema = z.object({
  email: loginSchema.shape.email,
  code: z.string().regex(/^[0-9]{6}$/, 'auth.verify.codeInvalid'),
})

const errorKeys = new Map([
  ['OTP_INVALID', 'auth.verify.invalid'],
  ['OTP_EXPIRED', 'auth.verify.expired'],
  ['OTP_ATTEMPTS_EXCEEDED', 'auth.verify.attemptsExceeded'],
  ['OTP_RESEND_TOO_SOON', 'auth.verify.tooSoon'],
  ['EMAIL_DELIVERY_FAILED', 'auth.verify.deliveryFailed'],
])

/** @param {{ initialEmail?: string, codeSent?: boolean }} props */
export function VerifyEmailForm({ initialEmail = '', codeSent = false }) {
  const { t } = useTranslation()
  const [action, setAction] = useState(null)
  const [verified, setVerified] = useState(false)
  const [resent, setResent] = useState(false)
  const [now, setNow] = useState(Date.now)
  const [retryAt, setRetryAt] = useState(() => (codeSent ? Date.now() + 60_000 : 0))

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    reset,
    resetField,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verificationSchema),
    defaultValues: { email: initialEmail, code: '' },
    mode: 'onTouched',
  })

  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000))
  const busy = action !== null

  useEffect(() => {
    if (now >= retryAt) return
    const timer = window.setTimeout(() => setNow(Date.now()), 1000)
    return () => window.clearTimeout(timer)
  }, [now, retryAt])

  function showError(error) {
    setError('root.server', {
      message:
        errorKeys.get(error?.code) ??
        (error?.status === 429 ? 'auth.verify.rateLimited' : 'auth.verify.submitError'),
    })
  }

  async function onVerify(values) {
    if (busy) return
    clearErrors('root.server')
    setResent(false)
    setAction('verify')

    try {
      await verifyEmail(values)
      reset()
      setVerified(true)
    } catch (error) {
      showError(error)
    } finally {
      setAction(null)
    }
  }

  async function onResend() {
    if (busy || remaining > 0) return
    if (!(await trigger('email'))) return

    clearErrors('root.server')
    setResent(false)
    setAction('resend')

    try {
      await resendVerification({ email: getValues('email').trim() })
      resetField('code')
      const sentAt = Date.now()
      setNow(sentAt)
      setRetryAt(sentAt + 60_000)
      setResent(true)
    } catch (error) {
      showError(error)
    } finally {
      setAction(null)
    }
  }

  if (verified) {
    return (
      <div className="grid gap-4">
        <p role="status">{t('auth.verify.success')}</p>
        <Button asChild>
          <Link to="/login">{t('navigation.login')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <form className="login-form" noValidate aria-busy={busy} onSubmit={handleSubmit(onVerify)}>
      <div className="login-field">
        <label htmlFor="verify-email">{t('auth.login.email')}</label>
        <input
          id="verify-email"
          type="email"
          autoComplete="email"
          required
          readOnly={busy}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'verify-email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="verify-email-error" role="alert">
            {t(errors.email.message)}
          </p>
        )}
      </div>

      <div className="login-field">
        <label htmlFor="verify-code">{t('auth.verify.code')}</label>
        <input
          id="verify-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          required
          readOnly={busy}
          className="text-center font-mono text-lg font-semibold tracking-[0.35em]"
          aria-invalid={Boolean(errors.code)}
          aria-describedby={errors.code ? 'verify-code-error' : undefined}
          {...register('code')}
        />
        {errors.code && (
          <p id="verify-code-error" role="alert">
            {t(errors.code.message)}
          </p>
        )}
      </div>

      {errors.root?.server && (
        <p className="login-form-error" role="alert">
          {t(errors.root.server.message)}
        </p>
      )}

      {resent && (
        <p
          role="status"
          className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-foreground"
        >
          {t('auth.verify.resent')}
        </p>
      )}

      <Button type="submit" disabled={busy}>
        {t(action === 'verify' ? 'auth.verify.verifying' : 'auth.verify.title')}
      </Button>

      <Button type="button" variant="outline" disabled={busy || remaining > 0} onClick={onResend}>
        {remaining > 0
          ? t('auth.verify.wait', { seconds: remaining })
          : t(action === 'resend' ? 'auth.verify.sending' : 'auth.verify.resend')}
      </Button>
    </form>
  )
}
