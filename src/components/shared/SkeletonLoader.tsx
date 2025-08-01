import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'list' | 'dashboard';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ type = 'card', count = 3, className = '' }: SkeletonLoaderProps) {
  const renderCardSkeleton = () => (
    <div className={`card-modern p-6 animate-fade-in ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className="skeleton w-12 h-12 rounded-full"></div>
        <div className="flex-1">
          <div className="skeleton h-4 w-3/4 mb-2"></div>
          <div className="skeleton h-3 w-1/2"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="skeleton h-3 w-full"></div>
        <div className="skeleton h-3 w-5/6"></div>
        <div className="skeleton h-3 w-4/6"></div>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <div className="skeleton h-8 w-16 rounded-lg"></div>
        <div className="skeleton h-8 w-16 rounded-lg"></div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`card-modern overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-100">
        <div className="skeleton h-6 w-48 mb-2"></div>
        <div className="skeleton h-4 w-32"></div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 py-3">
              <div className="skeleton w-8 h-8 rounded-full"></div>
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div className="skeleton h-4 w-full"></div>
                <div className="skeleton h-4 w-3/4"></div>
                <div className="skeleton h-4 w-1/2"></div>
                <div className="skeleton h-4 w-2/3"></div>
              </div>
              <div className="flex space-x-2">
                <div className="skeleton h-6 w-6 rounded"></div>
                <div className="skeleton h-6 w-6 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-modern p-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-center space-x-3">
            <div className="skeleton w-10 h-10 rounded-full"></div>
            <div className="flex-1">
              <div className="skeleton h-4 w-2/3 mb-2"></div>
              <div className="skeleton h-3 w-1/3"></div>
            </div>
            <div className="skeleton h-6 w-16 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-modern p-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="skeleton w-8 h-8 rounded-lg"></div>
              <div className="skeleton w-6 h-6 rounded"></div>
            </div>
            <div className="skeleton h-8 w-16 mb-2"></div>
            <div className="skeleton h-4 w-24"></div>
          </div>
        ))}
      </div>
      
      {/* Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-modern p-6">
          <div className="skeleton h-6 w-48 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="skeleton w-8 h-8 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-3/4 mb-1"></div>
                  <div className="skeleton h-3 w-1/2"></div>
                </div>
                <div className="skeleton h-6 w-12 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card-modern p-6">
          <div className="skeleton h-6 w-48 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="skeleton w-8 h-8 rounded-full"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-3/4 mb-1"></div>
                  <div className="skeleton h-3 w-1/2"></div>
                </div>
                <div className="skeleton h-6 w-12 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'table':
      return renderTableSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'dashboard':
      return renderDashboardSkeleton();
    default:
      return (
        <div className={`space-y-4 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
              {renderCardSkeleton()}
            </div>
          ))}
        </div>
      );
  }
}