import React, { createContext, useContext, useState, useEffect } from 'react'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

type Language = 'en' | 'zh'
type Translations = typeof en
type TranslationKey = keyof Translations

const translations: Record<Language, Translations> = { en, zh }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language')
    return (saved === 'en' || saved === 'zh') ? saved : 'zh'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: TranslationKey) => {
    return translations[language][key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
