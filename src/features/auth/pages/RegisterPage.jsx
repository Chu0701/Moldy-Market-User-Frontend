import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { registerSchema } from '@/features/auth/schemas/registerSchema'
import { registerAccount } from '@/services/auth/authService'
import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm'

const fields = [
  { name: 'fullName', label: 'profile.fullName', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'auth.login.email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'auth.register.phone', type: 'tel', autoComplete: 'tel' },
  {
    name: 'password',
    label: 'auth.login.password',
    type: 'password',
    autoComplete: 'new-password',
  },
  {
    name: 'confirmPassword',
    label: 'auth.register.confirmPassword',
    type: 'password',
    autoComplete: 'new-password',
  },
]

export function RegisterPage() {
  const { t } = useTranslation()
  const [registeredEmail, setRegisteredEmail] = useState(null)
  const [verificationCodeSent, setVerificationCodeSent] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  })

  async function onSubmit({ fullName, email, phone, password }) {
    try {
      const account = await registerAccount({ fullName, email, phone, password })
      reset()
      setVerificationCodeSent(true)
      setRegisteredEmail(account.email)
    } catch (error) {
      if (error?.code === 'EMAIL_NOT_VERIFIED') {
        reset()
        setVerificationCodeSent(false)
        setRegisteredEmail(email)
      } else if (error?.code === 'EMAIL_ALREADY_EXISTS') {
        setError(
          'email',
          { message: 'auth.register.emailTaken' },
          {
            shouldFocus: true,
          },
        )
      } else if (error?.code === 'PHONE_ALREADY_EXISTS') {
        setError(
          'phone',
          { message: 'profile.edit.phoneTaken' },
          {
            shouldFocus: true,
          },
        )
      } else {
        setError('root.server', {
          message:
            error?.code === 'EMAIL_DELIVERY_FAILED'
              ? 'auth.verify.deliveryFailed'
              : error?.status === 429
                ? 'auth.register.rateLimited'
                : 'auth.register.submitError',
        })
      }
    }
  }

  return (
    <section className="login-page" aria-labelledby="register-title">
      <h1 id="register-title">{t('navigation.register')}</h1>

      {registeredEmail ? (
        <div className="grid gap-4">
          <p
            role="status"
            className="rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-sm leading-6 text-foreground"
          >
            {t('auth.register.pending', { email: registeredEmail })}
          </p>
          <VerifyEmailForm initialEmail={registeredEmail} codeSent={verificationCodeSent} />
        </div>
      ) : (
        <form
          className="login-form"
          aria-busy={isSubmitting}
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          {fields.map(({ name, label, type, autoComplete }) => {
            const id = `register-${name}`
            const error = errors[name]

            return (
              <div key={name} className="login-field">
                <label htmlFor={id}>{t(label)}</label>
                <input
                  id={id}
                  type={type}
                  autoComplete={autoComplete}
                  required={name !== 'phone'}
                  readOnly={isSubmitting}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                  {...register(name)}
                />
                {error && (
                  <p id={`${id}-error`} role="alert">
                    {t(error.message)}
                  </p>
                )}
              </div>
            )
          })}

          {errors.root?.server?.message && (
            <p className="login-form-error" role="alert">
              {t(errors.root.server.message)}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {t(isSubmitting ? 'auth.register.submitting' : 'navigation.register')}
          </Button>
        </form>
      )}

      <div className="auth-card-footer">
        <Link to="/verify-email" className="login-register-link">
          {t('auth.verify.title')}
        </Link>

        <Link to="/login" className="login-register-link">
          {t('navigation.login')}
        </Link>
      </div>
    </section>
  )
}
