/**
 * Maps Backend Offer ErrorCode (OFF_001..OFF_009) to an i18n message.
 * @param {unknown} error
 * @param {import('i18next').TFunction} t
 * @param {string} [fallbackKey]
 */
export function getOfferErrorMessage(error, t, fallbackKey = 'offers.errors.default') {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null

  if (typeof code === 'string' && code.length > 0) {
    const translated = t(`offers.errors.${code}`, { defaultValue: '' })
    if (translated) return translated
  }

  return t(fallbackKey)
}
