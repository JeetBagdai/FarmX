import React from 'react';

interface ErrorMessageProps {
  message: string;
  t: (key: string) => string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, t }) => {
  return (
    <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-md shadow-md transition-colors" role="alert">
      <p className="font-bold">{t('Error')}</p>
      <p>{message}</p>
    </div>
  );
};

export default React.memo(ErrorMessage);