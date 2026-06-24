import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'

const LANG_KEY = 'i18nextLng'
const saved = localStorage.getItem(LANG_KEY)
const initialLng = saved === 'en' ? 'en' : 'es'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLng,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  })

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANG_KEY, lng)
})

export default i18n
