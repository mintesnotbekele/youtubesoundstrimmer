import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  className = '' 
}) => {
  return (
    <div className={`p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-2 ${className}`}>
      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
      <span className="text-red-400">{message}</span>
    </div>
  );
};

export default ErrorMessage; 