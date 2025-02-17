import { isDev } from '@minko-fe/vite-config/client'
import i18next, { type InitOptions } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { setupI18n as _setupI18n, type I18nSetupOptions } from 'vite-plugin-i18n-detector/client'

type SetupOptions = InitOptions & {
  fallbackLng?: string
  lookupTarget?: string
  debug?: boolean
  cache?: I18nSetupOptions['cache']
  onInited?: I18nSetupOptions['onInited']
}

function setupI18n(options: SetupOptions) {
  const { fallbackLng = 'en', lookupTarget = 'lang', debug = isDev(), cache, onInited, ...rest } = options || {}

  i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      returnNull: false,
      react: {
        useSuspense: true,
      },
      debug,
      resources: {},
      nsSeparator: '.',
      keySeparator: false,
      interpolation: {
        escapeValue: false,
      },
      fallbackLng,
      detection: {
        order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator'],
        caches: ['localStorage', 'sessionStorage', 'cookie'],
        lookupQuerystring: lookupTarget,
        lookupLocalStorage: lookupTarget,
        lookupSessionStorage: lookupTarget,
        lookupCookie: lookupTarget,
      },
      ...rest,
    })

  const { loadResourceByLang } = _setupI18n({
    language: i18next.language,
    onInited(langs, currentLang) {
      if (!langs.includes(i18next.language)) {
        i18next.changeLanguage(fallbackLng)
      }
      onInited?.(langs, currentLang)
    },
    onResourceLoaded: (langs, currentLang) => {
      Object.keys(langs).forEach((ns) => {
        i18next.addResourceBundle(currentLang, ns, langs[ns])
      })
    },
    cache,
    fallbackLng,
  })

  const _changeLanguage = i18next.changeLanguage
  i18next.changeLanguage = async (lang: string | undefined, ...args) => {
    let currentLng = i18next.language
    // If language did't change, return
    if (currentLng === lang) return undefined as any
    currentLng = lang || currentLng
    await loadResourceByLang(currentLng)
    return _changeLanguage(currentLng, ...args)
  }
}

export { setupI18n }
export { i18next }
export * from 'react-i18next'
