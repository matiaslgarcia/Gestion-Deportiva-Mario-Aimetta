// PaymentStatusBadge.tsx
import React from 'react';

interface PaymentStatusBadgeProps {
  statusColor?: string;
}

export function PaymentStatusBadge({ statusColor = 'red' }: PaymentStatusBadgeProps) {
  let label = '';
  let bgClass = '';
  let textClass = '';

  switch (statusColor) {
    case 'green':
      label = 'Pagado';
      bgClass = 'bg-green-100';
      textClass = 'text-green-800';
      break;
    case 'yellow':
      label = 'Pendiente';
      bgClass = 'bg-yellow-100';
      textClass = 'text-yellow-800';
      break;
    case 'red':
      label = 'No Pagado';
      bgClass = 'bg-red-100';
      textClass = 'text-red-800';
      break;
    default:
      label = 'Desconocido';
      bgClass = 'bg-gray-100';
      textClass = 'text-gray-800';
      break;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold leading-5 sm:px-3 sm:py-1 sm:text-sm ${bgClass} ${textClass}`}
    >
      {label}
    </span>
  );
}
