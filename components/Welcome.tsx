import React from 'react';

interface WelcomeProps {
    t: (key: string) => string;
}

const Welcome: React.FC<WelcomeProps> = ({ t }) => {
  return (
    <div className="text-center p-8 bg-white rounded-xl shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('Welcome to FarmX')}</h2>
      <p className="text-gray-600 max-w-xl mx-auto">
        {t('Your AI partner in agriculture. Select your region and a crop to receive a detailed market forecast and data-driven recommendations to maximize your yield and profits.')}
      </p>
    </div>
  );
};

export default React.memo(Welcome);