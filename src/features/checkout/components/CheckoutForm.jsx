import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { checkoutSchema } from '@/features/checkout/schemas/checkoutSchema'

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

export function CheckoutForm() {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const fullName = profileQuery.data?.fullName ?? ''
  const phone = profileQuery.data?.phone ?? ''
  const editedFields = useRef(new Set())
  const {
    register,
    setValue,
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
    <form className="checkout-panel" noValidate onSubmit={(event) => event.preventDefault()}>
      <h2>{t('checkout.deliveryTitle')}</h2>

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

      <p id="checkout-notice" className="checkout-notice">
        {t('checkout.unavailable')}
      </p>
      {/* TODO(doc14:Q16,Q17): enable submission after the checkout contract is agreed. */}
      <Button type="submit" disabled aria-describedby="checkout-notice">
        {t('checkout.placeOrder')}
      </Button>
    </form>
  )
}
