import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { checkoutSchema } from '@/features/checkout/schemas/checkoutSchema'
import { isAmbiguousCheckoutError } from '@/features/checkout/checkoutPayment'

const fields = [
  { name: 'receiverName', label: 'checkout.receiverName', autoComplete: 'name' },
  {
    name: 'phoneNumber',
    label: 'checkout.phoneNumber',
    type: 'tel',
    autoComplete: 'tel',
  },
  {
    name: 'shippingAddress',
    label: 'checkout.shippingAddress',
    multiline: true,
    autoComplete: 'street-address',
  },
  { name: 'note', label: 'checkout.note', multiline: true, autoComplete: 'off' },
]

/** @param {{ onSubmit?: Function, isSubmitting?: boolean, canSubmit?: boolean, submitError?: string }} props */
export function CheckoutForm({
  onSubmit,
  isSubmitting = false,
  canSubmit = true,
  submitError,
} = {}) {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const fullName = profileQuery.data?.fullName ?? ''
  const phone = profileQuery.data?.phone ?? ''
  const editedFields = useRef(new Set())
  const submitLock = useRef(false)
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      receiverName: fullName,
      phoneNumber: phone,
      shippingAddress: '',
      method: 'COD',
      note: '',
    },
  })

  useEffect(() => {
    const profileValues = { receiverName: fullName, phoneNumber: phone }

    for (const [name, value] of Object.entries(profileValues)) {
      if (!editedFields.current.has(name)) {
        setValue(name, value)
      }
    }
  }, [fullName, phone, setValue])

  return (
    <form
      className="checkout-panel"
      noValidate
      onSubmit={(event) =>
        void handleSubmit(async (values) => {
          if (submitLock.current || isSubmitting || !canSubmit || !onSubmit) return
          submitLock.current = true
          try {
            await onSubmit(values)
          } catch (error) {
            if (!isAmbiguousCheckoutError(error)) submitLock.current = false
          }
        })(event)
      }
    >
      <h2>{t('checkout.deliveryTitle')}</h2>

      <fieldset disabled={isSubmitting} className="grid gap-5">
        {fields.map(({ name, label, type = 'text', multiline, autoComplete }) => {
          const Field = multiline ? 'textarea' : 'input'
          const id = 'checkout-' + name
          const error = errors[name]
          const registration = register(name)

          return (
            <div key={name} className="checkout-field">
              <label htmlFor={id}>{t(label)}</label>
              <Field
                id={id}
                type={multiline ? undefined : type}
                rows={multiline ? 3 : undefined}
                autoComplete={autoComplete}
                required={name !== 'note'}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? id + '-error' : undefined}
                {...registration}
                onChange={(event) => {
                  editedFields.current.add(name)
                  void registration.onChange(event)
                }}
              />
              {error && (
                <p id={id + '-error'} className="checkout-error" role="alert">
                  {t(error.message)}
                </p>
              )}
            </div>
          )
        })}

        <fieldset className="grid gap-3">
          <legend className="mb-3 font-medium">{t('checkout.paymentTitle')}</legend>
          {['COD', 'ONLINE_BANKING'].map((method) => (
            <label key={method} className="flex min-h-11 items-center gap-3">
              <input type="radio" value={method} {...register('method')} />
              <span>{t('checkout.methods.' + method)}</span>
            </label>
          ))}
        </fieldset>
      </fieldset>
      <p id="checkout-notice" className="checkout-notice">
        {t('checkout.submitNotice')}
      </p>
      {submitError && (
        <p role="alert" className="checkout-error">
          {submitError}
        </p>
      )}
      <Button
        type="submit"
        disabled={!onSubmit || isSubmitting || !canSubmit}
        aria-describedby="checkout-notice"
      >
        {t(isSubmitting ? 'checkout.submitting' : 'checkout.placeOrder')}
      </Button>
    </form>
  )
}
