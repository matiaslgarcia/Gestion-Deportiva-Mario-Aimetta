import React from 'react';

interface LoaderProps {
  message?: string;
}

export function Loader({ message = "Cargando..." }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
      <p className="text-gray-700 text-sm">{message}</p>
    </div>
  );
}