"use client"

import React from 'react';
import { Calendar } from 'lucide-react';
import { Ad } from '@/types/ad'; 

interface AdDetailProps {
  ad: Ad;
  onBack: () => void;
  onEdit?: (ad: Ad) => void;
  onResend?: (ad: Ad) => void;
}

export default function AdDetail({ ad, onBack, onEdit, onResend }: AdDetailProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(ad);
    }
  };

  const handleResend = () => {
    if (onResend) {
      onResend(ad);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-xl p-4 lg:p-6 border-2 border-[#D8D8D8]/30 mt-4">
     
      <div className="mt-4">
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-3 rounded-md">
              <Calendar className="text-primary-500 h-6 w-6" />
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-[11px] font-medium text-gray-800">{ad.title}</h2>
                <div className="text-gray-500 text-sm">
                  {new Date(ad.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })} | {new Date(ad.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-gray-700">{ad.content}</p>
              </div>

              <div className="flex flex-col gap-2 text-sm text-gray-500 mb-6">
                <p>Envoyé à : {ad.stats?.sentTo || 0} clients</p>
                <p>Lecture : {ad.stats?.readBy || 0} clients</p>
                <p>Taux de lecture : {Math.round((ad.stats?.readBy || 0) / (ad.stats?.sentTo || 1) * 100)}%</p>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Retour
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="px-4 py-2 text-primary-500 border border-primary-500 rounded-md hover:bg-orange-50"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-orange-600"
                  >
                    Relancer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
