// PageHeader.tsx
import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  onAdd: () => void;
  addButtonText: string;
}

export function PageHeader({ title, description, onAdd, addButtonText }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between py-4 px-6 bg-white shadow rounded-md">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="mt-2 text-base text-gray-600">{description}</p>
      </div>
      <div className="mt-4 sm:mt-0 sm:ml-6">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-150"
        >
          {addButtonText}
        </button>
      </div>
    </header>
  );
}
