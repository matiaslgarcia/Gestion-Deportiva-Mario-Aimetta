import React from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function Toast({ type, title, message, onClose, autoClose = true, duration = 5000 }: ToastProps) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-200 dark:border-red-700';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-200 dark:border-yellow-700';
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full animate-slide-in-right`}>
      <div className={`glass rounded-2xl border shadow-2xl p-4 hover-lift ${getStyles()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 animate-pulse-soft">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 animate-fade-in">
              {title}
            </h4>
            {message && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 hover-lift"
          >
            <X className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
        
        {/* Barra de progreso para auto-close */}
        {autoClose && (
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' :
                type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              } animate-pulse`}
              style={{
                animation: `shrink ${duration}ms linear forwards`
              }}
            ></div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}