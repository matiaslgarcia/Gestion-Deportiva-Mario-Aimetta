import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-6 animate-fade-in">
      <button
        onClick={() => items[0]?.onClick?.()}
        className="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 hover-lift"
      >
        <Home className="h-4 w-4" />
        <span>Inicio</span>
      </button>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600" />
          
          {item.onClick && !item.active ? (
            <button
              onClick={item.onClick}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 hover-lift animate-slide-in-right"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {item.label}
            </button>
          ) : (
            <span 
              className={`${
                item.active 
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold' 
                  : 'text-gray-500 dark:text-gray-500'
              } animate-slide-in-right`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}