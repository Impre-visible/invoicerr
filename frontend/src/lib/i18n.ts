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
} console.log(resources)


i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    })

export default i18n
