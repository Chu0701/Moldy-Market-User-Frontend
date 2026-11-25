import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en/common.json'
import viCommon from './locales/vi/common.json'

export const SUPPORTED_LANGUAGES = ['vi', 'en']
export const DEFAULT_LANGUAGE = 'vi'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      vi: { common: viCommon },
      en: { common: enCommon },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
} else {
  i18n.addResourceBundle('vi', 'common', viCommon, true, true)
  i18n.addResourceBundle('en', 'common', enCommon, true, true)
  void i18n.changeLanguage(i18n.language || DEFAULT_LANGUAGE)
}

if (import.meta.hot) {
  import.meta.hot.accept(
    ['./locales/vi/common.json', './locales/en/common.json'],
    ([viMod, enMod]) => {
      if (viMod?.default) {
        i18n.addResourceBundle('vi', 'common', viMod.default, true, true)
      }
      if (enMod?.default) {
        i18n.addResourceBundle('en', 'common', enMod.default, true, true)
      }
      void i18n.changeLanguage(i18n.language || DEFAULT_LANGUAGE)
    },
  )
}

export default i18n
