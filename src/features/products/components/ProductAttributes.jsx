import { useTranslation } from 'react-i18next'

/** @param {{ attributes?: Record<string, unknown> | null }} props */
export function ProductAttributes({ attributes }) {
  const { t, i18n } = useTranslation()

  function formatValue(value) {
    if (typeof value === 'string') return value.trim()
    if (typeof value === 'number') return value.toLocaleString(i18n.resolvedLanguage)
    if (typeof value === 'boolean') {
      return t(value ? 'products.detail.attributeYes' : 'products.detail.attributeNo')
    }
    return ``
  }

  const rows = Object.entries(attributes ?? {})
    .map(([name, value]) => ({
      name,
      text: Array.isArray(value)
        ? value.map(formatValue).filter(Boolean).join(', ')
        : formatValue(value),
    }))
    .filter(({ text }) => text !== '')

  if (rows.length === 0) return null

  return (
    <section className="product-attributes">
      <h2>{t('products.detail.attributesTitle')}</h2>

      <dl>
        {rows.map(({ name, text }) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
