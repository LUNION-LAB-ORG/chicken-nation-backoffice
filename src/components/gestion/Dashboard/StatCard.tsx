import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconColor, trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div style={{ color: iconColor }}>
          <Icon size={24} strokeWidth={2} />
        </div>
        {trend && (
          <div className={`flex items-center ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}%
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="text-gray-500 text-sm">{title}</div>
    </div>
  );
};

export default StatCard;