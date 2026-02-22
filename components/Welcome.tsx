import React from 'react';

interface WelcomeProps {
    t: (key: string) => string;
}

const Welcome: React.FC<WelcomeProps> = ({ t }) => {
  return (
    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('Welcome to FarmX')}</h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
        {t('Your AI partner in agriculture. Select your region and a crop to receive a detailed market forecast and data-driven recommendations to maximize your yield and profits.')}
      </p>
    </div>
  );
};

export default React.memo(Welcome);