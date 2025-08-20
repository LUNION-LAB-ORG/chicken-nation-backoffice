import React from 'react';

interface ProgressItemProps {
  label: string;
  value: number;
  color: string;
}

const ProgressItem: React.FC<ProgressItemProps> = ({ label, value, color }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium">{value.toFixed(1)}k</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${(value / 500) * 100}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

const ProgressSection: React.FC = () => {
  const items = [
    { label: 'Commandes', value: 0, color: '#FF6B35' },
    { label: 'Livraisons', value: 0, color: '#3B82F6' },
    { label: 'Retours', value: 0, color: '#EF4444' },
    { label: 'Autres', value: 0, color: '#10B981' },
  ];

  return (
    <div className="progress-section">
      <h3 className="chart-title">Revenu par catégorie</h3>
      <div className="mt-4">
        {items.map((item, index) => (
          <ProgressItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

export default ProgressSection;
