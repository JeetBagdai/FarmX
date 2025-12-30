import React from 'react';
import LanguageSelector from './LanguageSelector';
import { FarmIcon } from './icons/FarmIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface HeaderProps {
    t: (key: string) => string;
    currentLanguage: string;
    onLanguageChange: (language: string) => void;
    languages: string[];
    isTranslating: boolean;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ t, currentLanguage, onLanguageChange, languages, isTranslating, isDarkMode, toggleDarkMode }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-[60] transition-colors duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
            <FarmIcon />
            <div>
                <h1 className="text-2xl font-bold text-green-800 dark:text-green-500">{t('FarmX')}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{t('AI Agricultural Advisor for India')}</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <LanguageSelector 
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                languages={languages}
                isTranslating={isTranslating}
            />
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);