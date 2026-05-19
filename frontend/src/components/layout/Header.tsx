import { useLanguage } from '../../context/LanguageContext'

export function Header() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <header className="h-14 border-b border-gray-800 flex items-center justify-end px-6 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs font-medium">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded transition-colors ${
            language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('common.en')}
        </button>
        <button
          onClick={() => setLanguage('zh')}
          className={`px-3 py-1 rounded transition-colors ${
            language === 'zh' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {t('common.zh')}
        </button>
      </div>
    </header>
  )
}
