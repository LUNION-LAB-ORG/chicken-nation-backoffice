 
import React from 'react';
import Image from 'next/image';

interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: string; 
}

function StatCard({ title, value, icon  }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6    ">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-regular text-gray-800">{value}</p>
        </div>
        <div className={`p-3  rounded-full`}>
          <Image
            src={icon}
            alt={title}
            width={30}
            height={30}
            className="w-7 h-7"
          />
        </div>
      </div>
    </div>
  );
}

function StatsCards() {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Conversations actives"
        value="3"
        icon="/icons/rapport/conversations.png"
 
      />
      <StatCard
        title="Tickets ouverts"
        value="2"
        icon="/icons/rapport/tickets.png"
        
      />
      <StatCard
        title="Tickets urgents"
        value={<span className="text-red-600">1</span>}
        icon="/icons/rapport/urgent.png"
      
      />
      <StatCard
        title="Équipe en ligne"
        value={<span className="text-green-600">4</span>}
        icon="/icons/rapport/team.png"
      
      />
    </div>
  );
}

export default StatsCards;
