import LanguageDetector from 'i18next-browser-languagedetector'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const translations = import.meta.glob('../locales/**/*.json', {
    eager: true
})

const resources: Record<string, { translation: any }> = {}

for (const path in translations) {
    const match = path.match(/\.\/locales\/([^/]+)\/translation\.json$/)
    if (!match) continue
    const lang = match[1]
    resources[lang] = {
        translation: (translations[path] as any).default
    }
}

i18n
    .use(
        new LanguageDetector(null, {
            order: ['navigator'],
            caches: []
        })
    )
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        load: 'languageOnly'
    })

