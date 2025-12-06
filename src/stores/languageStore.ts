import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations, Language } from '@/lib/translations'

interface LanguageState {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: keyof typeof translations['de-CH']) => string
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set, get) => ({
            language: 'de-CH', // Default to Swiss German
            setLanguage: (language) => set({ language }),
            t: (key) => {
                const lang = get().language
                return translations[lang][key] || translations['de-CH'][key] || key
            },
        }),
        {
            name: 'language-storage',
        }
    )
)
