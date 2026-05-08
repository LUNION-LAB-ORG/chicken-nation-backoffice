"use client";

import Image from 'next/image';
import React from 'react';
import { useTicketStatsQuery } from '@/hooks/useTicketsQuery';

interface SatisfactionRowProps {
  label: string;
  value: string;
  color?: string;
}

function SatisfactionRow({ label, value, color }: SatisfactionRowProps) {
  return (
    <div className="py-1 px-2 md:px-4">
      <div className="flex items-center justify-between">
        <p className="md:text-sm lg:text-sm text-xs text-gray-600 font-medium">{label}</p>
        <div className="ml-4">
          {color ? (
            <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-gray-200 text-slate-600`}>
              {value}
            </span>
          ) : (
            <span className="md:text-sm lg:text-sm text-xs font-medium text-[#F17922]">{value}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SatisfactionClient() {
  const { data, isLoading } = useTicketStatsQuery();

  const score = isLoading
    ? '…'
    : data?.satisfactionScore != null
      ? `${data.satisfactionScore.toFixed(1)}/10`
      : '--';

  return (
    <div className="bg-white rounded-2xl border-0 overflow-hidden h-full flex flex-col">
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-2">
            <Image src="/icons/rapport/satisfaction.png" width={24} height={24} alt="satisfaction" className="mt-1" />
            <h3 className="lg:text-2xl md:text-base text-md font-semibold text-gray-900">
              Satisfaction client
            </h3>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-0">
          <SatisfactionRow label="Note moyenne" value={score} />
          <SatisfactionRow label="Très satisfait" value="--" color="gray" />
          <SatisfactionRow label="Amélioration requise" value="--" color="gray" />
        </div>
      </div>
    </div>
  );
}

export default SatisfactionClient;
