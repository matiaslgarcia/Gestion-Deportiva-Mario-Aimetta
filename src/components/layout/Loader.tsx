import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'minimal';
}

export function Loader({ message = 'Cargando...', size = 'md', variant = 'default' }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const containerClasses = {
    default: 'flex flex-col items-center justify-center min-h-[400px] p-8',
    glass: 'flex flex-col items-center justify-center min-h-[400px] p-8 glass rounded-2xl',
    minimal: 'flex items-center justify-center p-4'
  };

  return (
    <div className={`${containerClasses[variant]} animate-fade-in`}>
      <div className="relative animate-pulse-soft">
        {/* Spinner principal */}
        <Loader2 className={`${sizeClasses[size]} text-gradient-primary animate-spin`} />
        
        {/* Anillo exterior */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-indigo-200 dark:border-indigo-800 rounded-full animate-pulse`}></div>
        
        {/* Efectos de brillo */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full animate-glow blur-sm`}></div>
        
        {/* Partículas decorativas */}
        <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <Sparkles className="absolute -bottom-2 -left-2 h-3 w-3 text-blue-400 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {message && variant !== 'minimal' && (
        <div className="mt-6 text-center animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">{message}</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
      
      {/* Efecto de fondo sutil */}
      {variant === 'glass' && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-xl"></div>
      )}
    </div>
  );
}