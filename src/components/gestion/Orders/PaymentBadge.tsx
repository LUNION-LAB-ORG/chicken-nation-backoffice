"use client"

import React from 'react';

export type PaymentStatus = 'PAID' | 'REFUNDED' | 'TO_REFUND';

interface PaymentBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export default function PaymentBadge({ status, className = '' }: PaymentBadgeProps) {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return {
          text: 'Payé',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'REFUNDED':
        return {
          text: 'Remboursé',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'TO_REFUND':
        return {
          text: 'À rembourser',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      default:
        return {
          text: 'Payé',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${className}
      `}
    >
      {config.text}
    </span>
  );
}