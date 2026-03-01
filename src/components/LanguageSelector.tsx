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
      {/* Button: flag only on mobile, flag + name on sm+ */}
      <button
        className="flex items-center gap-1.5 px-2 py-2 sm:px-3 rounded-lg hover:bg-slate-100 transition-colors"
        title={i18n.t('language.selectLanguage')}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-xl leading-none">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-slate-700 hidden sm:inline">
          {currentLanguage.name}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Click-outside overlay (mobile touch + desktop) */}
          <div
            className="fixed inset-0 z-[199]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Mobile: left-0 so dropdown opens rightward (safe on small screens).
              sm+: right-0 so it aligns to button's right edge in the header. */}
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 min-w-max bg-white rounded-lg shadow-lg border border-slate-200 z-[200] overflow-hidden">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${currentLangCode === language.code ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
                  }`}
              >
                <span className="text-xl leading-none">{language.flag}</span>
                <span className="font-medium whitespace-nowrap">{language.name}</span>
                {currentLangCode === language.code && (
                  <span className="ml-4 text-primary-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
