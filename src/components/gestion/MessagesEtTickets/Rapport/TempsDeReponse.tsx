"use client";

import React from 'react';
import Image from 'next/image';
import { useTicketStatsQuery } from '@/hooks/useTicketsQuery';

function formatMinutes(minutes: number): string {
  if (!minutes || minutes === 0) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

interface ReponseRowProps {
  label: string;
  value: string;
  badge?: boolean;
}

function ReponseRow({ label, value, badge }: ReponseRowProps) {
  return (
    <div className="py-1 px-2 md:px-4">
      <div className="flex items-center justify-between">
        <p className="md:text-sm lg:text-sm text-xs text-gray-600 font-medium">{label}</p>
        <div className="ml-4">
          {badge ? (
            <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full md:text-[10px] text-[10px] font-medium bg-gray-200 text-slate-600">
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

function TempsDeReponse() {
  const { data, isLoading } = useTicketStatsQuery();

  const avgResolution = isLoading ? '…' : formatMinutes(data?.averageResolutionTime ?? 0);

  return (
    <div className="bg-white rounded-2xl border-0 overflow-hidden h-full flex flex-col">
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="lg:text-2xl md:text-base text-md font-semibold text-gray-900 flex items-center">
            <Image
              src="/icons/rapport/clock.png"
              alt="Temps de réponse"
              width={24}
              height={24}
              className="mr-2 self-center mt-1"
            />
            Temps de réponse
          </h3>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-0">
          <ReponseRow label="Temps de résolution moyen" value={avgResolution} />
          <ReponseRow label="En retard" value="--" badge />
        </div>
      </div>
    </div>
  );
}

export default TempsDeReponse;
