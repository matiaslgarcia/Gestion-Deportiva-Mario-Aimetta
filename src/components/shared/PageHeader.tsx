import React from 'react';
import { Plus, Sparkles } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  onAdd: () => void;
  addButtonText: string;
}

export function PageHeader({ title, description, onAdd, addButtonText }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between mt-4 py-8 px-8 glass rounded-2xl border border-white/20 shadow-2xl backdrop-blur-xl animate-fade-in hover-lift">
      <div className="flex-1 animate-slide-in-left">
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="h-8 w-8 text-gradient-primary animate-pulse-soft" />
          <h1 className="text-3xl lg:text-4xl font-bold text-gradient-primary animate-pulse-soft">{title}</h1>
        </div>
        <p className="mt-3 text-base lg:text-lg text-gray-600 dark:text-gray-300 font-medium">{description}</p>
        
        {/* Línea decorativa */}
        <div className="mt-4 w-24 h-1 bg-gradient-primary rounded-full animate-glow"></div>
      </div>
      
      {/* Botón de agregar */}
      <div className="mt-6 sm:mt-0 sm:ml-8 animate-slide-in-right">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('PageHeader button clicked - event:', e);
            console.log('PageHeader onAdd function:', onAdd);
            try {
              onAdd();
              console.log('PageHeader onAdd executed successfully');
            } catch (error) {
              console.error('Error executing onAdd:', error);
            }
          }}
          className="relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group overflow-hidden z-10 cursor-pointer"
        >
          <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          {addButtonText}
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
      
      {/* Efectos de fondo */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-50 blur-xl -z-10 pointer-events-none"></div>
    </header>
  );
}
