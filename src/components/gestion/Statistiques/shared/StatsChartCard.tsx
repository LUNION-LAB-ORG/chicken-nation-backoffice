'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper carte pour les sections graphiques des statistiques.
 * Style aligné avec le dashboard existant (white, rounded, shadow).
 */
export default function StatsChartCard({
  title,
  subtitle,
  icon: Icon,
  rightContent,
  children,
  className = '',
}: StatsChartCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-[#F17922]" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>

      {/* Chart Content */}
      {children}
    </div>
  );
}
