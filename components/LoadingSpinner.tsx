import React from 'react';

interface LoadingSpinnerProps {
  t: (key: string) => string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ t }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg font-semibold text-gray-700">{t('Analyzing Market Data...')}</p>
        <p className="text-sm text-gray-500">{t('This may take a moment.')}</p>
    </div>
  );
};

export default React.memo(LoadingSpinner);