import React from 'react';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
    t: (key: string) => string;
    currentLanguage: string;
    onLanguageChange: (language: string) => void;
    languages: string[];
    isTranslating: boolean;
}

const Header: React.FC<HeaderProps> = ({ t, currentLanguage, onLanguageChange, languages, isTranslating }) => {
  return (
    <header className="bg-white shadow-md relative z-30">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-green-700">{t('FarmX')}</h1>
            <p className="text-sm text-gray-500">{t('AI Agricultural Advisor for India')}</p>
        </div>
        <div className="absolute top-1/2 right-4 -translate-y-1/2">
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

export default Header;