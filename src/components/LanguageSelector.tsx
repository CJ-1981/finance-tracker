import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setIsOpen(false)
  }

  // Get current language code, handling regional variants (e.g., en-US -> en)
  const getCurrentLanguageCode = () => {
    const lang = i18n.language || 'en'
    return lang.split('-')[0]
  }

  const currentLangCode = getCurrentLanguageCode()
  const currentLanguage = languages.find(l => l.code === currentLangCode) || languages[0]

  const toggleDropdown = () => setIsOpen(!isOpen)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDropdown()
    }
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        title={i18n.t('language.selectLanguage')}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-slate-700 hidden sm:inline">
          {currentLanguage.name}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
          onBlur={(e) => {
            // Close when focus moves outside the dropdown
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setIsOpen(false)
            }
          }}
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${
                currentLangCode === language.code ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
              }`}
            >
              <span className="text-xl">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
              {currentLangCode === language.code && (
                <span className="ml-auto text-primary-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
