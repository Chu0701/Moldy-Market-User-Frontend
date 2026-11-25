import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { loginSchema } from '@/features/auth/schemas/loginSchema'
import { useLogin } from '@/features/auth/hooks/useLogin'

const loginErrorKeys = new Map([
  ['INVALID_CREDENTIALS', 'auth.login.invalidCredentials'],
  ['ACCOUNT_LOCKED', 'auth.login.accountLocked'],
  ['ACCOUNT_DISABLED', 'auth.login.accountDisabled'],
])

function getReturnPath(from) {
  if (typeof from !== 'string' || !from.startsWith('/')) return '/'

  try {
    const target = new URL(from, window.location.origin)
    if (target.origin !== window.location.origin) return '/'
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return '/'
  }
}

export function LoginPage() {
  const { t } = useTranslation()
  const signIn = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  async function onSubmit(values) {
    try {
      await signIn(values)
    } catch (error) {
      const message =
        error?.status === 429
          ? 'auth.login.rateLimited'
          : (loginErrorKeys.get(error?.code) ?? 'auth.login.submitError')

      setError('root.server', { message })
      return
    }

    navigate(getReturnPath(location.state?.from), { replace: true })
  }

  return (
    <section className="login-page">
      <h1>{t('navigation.login')}</h1>

      <form
        className="login-form"
        noValidate
        aria-busy={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="login-field">
          <label htmlFor="login-email">{t('auth.login.email')}</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="login-email-error" role="alert">
              {t(errors.email.message)}
            </p>
          )}
        </div>

        <div className="login-field">
          <label htmlFor="login-password">{t('auth.login.password')}</label>
          <div className="password-input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              {...register('password')}
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
          {errors.password && (
            <p id="login-password-error" role="alert">
              {t(errors.password.message)}
            </p>
          )}
        </div>

        {errors.root?.server?.message && (
          <p className="login-form-error" role="alert">
            {t(errors.root.server.message)}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {t(isSubmitting ? 'auth.login.submitting' : 'navigation.login')}
        </Button>
      </form>

      <div className="auth-card-footer">
        <Link to="/register" className="login-register-link">
          {t('navigation.register')}
        </Link>
        <Link to="/forgot-password" className="login-register-link">
          {t('auth.forgot.link')}
        </Link>
        <Link to="/verify-email" className="login-register-link">
          {t('auth.verify.title')}
        </Link>
      </div>
    </section>
  )
}
