import React from 'react';
import LanguageSelector from './LanguageSelector';
import { FarmIcon } from './icons/FarmIcon';

interface HeaderProps {
    t: (key: string) => string;
    currentLanguage: string;
    onLanguageChange: (language: string) => void;
    languages: string[];
    isTranslating: boolean;
}

const Header: React.FC<HeaderProps> = ({ t, currentLanguage, onLanguageChange, languages, isTranslating }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
            <FarmIcon />
            <div>
                <h1 className="text-2xl font-bold text-green-800">{t('FarmX')}</h1>
                <p className="text-xs text-gray-500 hidden sm:block">{t('AI Agricultural Advisor for India')}</p>
            </div>
        </div>
        <div>
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