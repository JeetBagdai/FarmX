import React, { useState, useRef, useEffect } from 'react';
import { LanguageIcon } from './icons/LanguageIcon';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  languages: string[];
  isTranslating: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onLanguageChange, languages, isTranslating }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (lang: string) => {
    onLanguageChange(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-green-600 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <LanguageIcon />
        <span className="hidden md:inline">{currentLanguage}</span>
        {isTranslating && <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent border-solid rounded-full animate-spin ml-1"></div>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
          <ul className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {languages.map((lang) => (
              <li key={lang}>
                <button
                  onClick={() => handleSelect(lang)}
                  className={`w-full text-left block px-4 py-2 text-sm ${
                    currentLanguage === lang
                      ? 'bg-green-100 text-green-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                >
                  {lang}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(LanguageSelector);