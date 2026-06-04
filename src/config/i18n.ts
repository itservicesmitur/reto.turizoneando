import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'es',
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    react: {
      useSuspense: true,
    },
  })

export default i18n
