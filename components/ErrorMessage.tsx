import React from 'react';

interface ErrorMessageProps {
  message: string;
  t: (key: string) => string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, t }) => {
  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
      <p className="font-bold">{t('Error')}</p>
      <p>{message}</p>
    </div>
  );
};

export default React.memo(ErrorMessage);