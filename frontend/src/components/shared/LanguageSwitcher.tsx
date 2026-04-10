import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { languages } from '@/i18n';

interface LanguageSwitcherProps {
  variant?: 'header' | 'footer' | 'mobile';
  showLabel?: boolean;
  showFlag?: boolean;
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  showLabel = true,
  showFlag = true,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    const selectedLang = languages.find((lang) => lang.code === langCode);
    if (selectedLang) {
      document.documentElement.dir = selectedLang.dir;
      document.documentElement.lang = langCode;
    }
    setIsOpen(false);
  };

  const baseButtonStyles = {
    header: 'flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700',
    footer: 'flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300',
    mobile: 'flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-50',
  };

  const dropdownStyles = {
    header: 'absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50',
    footer: 'absolute bottom-full mb-2 left-0 w-48 bg-gray-800 rounded-xl shadow-lg border border-gray-700 py-2 z-50',
    mobile: 'absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50',
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={baseButtonStyles[variant]}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span>{currentLanguage.flag}</span>}
        {showLabel && (
          <span className="text-sm font-medium">
            {currentLanguage.code.toUpperCase()}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={dropdownStyles[variant]} role="listbox">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 ${
                variant === 'footer' ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-700'
              } ${currentLanguage.code === lang.code ? 'bg-sky-50 text-sky-700' : ''}`}
              role="option"
              aria-selected={currentLanguage.code === lang.code}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className={`text-xs ${variant === 'footer' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {lang.name}
                  </span>
                </div>
              </div>
              {currentLanguage.code === lang.code && (
                <Check className="w-4 h-4 text-sky-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
