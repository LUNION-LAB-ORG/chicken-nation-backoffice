"use client";

import React, { useState } from 'react';
import { Clock, ChefHat } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Image from 'next/image';
import { formatImageUrl } from '@/utils/imageHelpers';
import { OrderData } from './types';

interface PreparationTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preparationTime: number) => void;
  orderReference?: string;
  orderData?: OrderData | null;
}

const PreparationTimeModal: React.FC<PreparationTimeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderReference,
  orderData
}) => {
  const [selectedPreparationTime, setSelectedPreparationTime] = useState<number | null>(null);

  const [customPreparationTime, setCustomPreparationTime] = useState<number>(15);

  const [useCustom, setUseCustom] = useState(false);



  // Temps prédéfinis (en minutes)
  const predefinedTimes = [
    { prep: 10, label: "Express", description: "Plats simples" },
    { prep: 15, label: "Rapide", description: "Burgers, sandwichs" },
    { prep: 20, label: "Standard", description: "Plats principaux" },
    { prep: 25, label: "Élaboré", description: "Plats cuisinés" },
    { prep: 30, label: "Complexe", description: "Menus complets" },
    { prep: 40, label: "Spécial", description: "Commandes importantes" }
  ];

  const handlePredefinedSelect = (prep: number) => {
    setSelectedPreparationTime(prep);
    setUseCustom(false);
  };

  const handleCustomSelect = () => {
    setSelectedPreparationTime(customPreparationTime);
    setUseCustom(true);
  };

  const handleConfirm = () => {
    if (selectedPreparationTime) {
      onConfirm(selectedPreparationTime);
      onClose();
      // Reset
      setSelectedPreparationTime(null);
      setUseCustom(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset
    setSelectedPreparationTime(null);
    setUseCustom(false);
  };

  // Composant SafeImage utilisant formatImageUrl
  const SafeImage: React.FC<{
    src: string | undefined | null;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }> = ({ src, alt, width, height, className }) => {
    const imageUrl = formatImageUrl(src) || "/images/food2.png";

    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/images/food2.png";
        }}
      />
    );
  };

  console.log('🎭 [PreparationTimeModal] Rendu du modal, isOpen:', isOpen);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Temps de préparation${orderReference ? ` - ${orderReference}` : ''}`}
      size="large"
    >

      <div>
        {/* Section des plats commandés */}
        {orderData?.order_items && orderData.order_items.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ChefHat className="w-5 h-5 mr-2 text-orange-500" />
              Plats à préparer ({orderData.order_items.length} items)
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              {console.log('🍽️ [PreparationTimeModal] OrderData:', orderData)}
              {console.log('📋 [PreparationTimeModal] Order items:', orderData.order_items)}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderData.order_items.map((item, index) => (
                  <div key={item.id || index} className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <SafeImage
                        src={item.dish?.image}
                        alt={item.dish?.name || "Plat"}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.dish?.name || "Plat inconnu"}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Quantité: {item.quantity}</span>
                        {item.epice && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                            🌶️ Épicé
                          </span>
                        )}
                      </div>
                      {item.supplements && item.supplements.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Suppléments: {item.supplements.map(s => s.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {item.amount.toLocaleString()} F
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total de la commande:</span>
                  <span className="text-xl font-bold text-orange-600">
                    {orderData.amount.toLocaleString()} F
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="text-center text-yellow-800">
              <ChefHat className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="font-medium">Aucun plat trouvé</p>
              <p className="text-sm mt-1">
                {!orderData ? 'Données de commande non chargées' :
                  !orderData.order_items ? 'Pas d\'items dans la commande' :
                    orderData.order_items.length === 0 ? 'Liste d\'items vide' : 'Erreur inconnue'}
              </p>
              {console.log('⚠️ [PreparationTimeModal] Cas vide - orderData:', orderData)}
            </div>
          </div>
        )}

        {/* Temps prédéfinis */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Temps prédéfinis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedTimes.map((time, index) => (
              <div
                key={index}
                onClick={() => handlePredefinedSelect(time.prep)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${selectedPreparationTime === time.prep && !useCustom
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-orange-300'
                  }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 mb-2">{time.label}</div>
                  <div className="text-sm text-gray-600 mb-3">{time.description}</div>

                  <div className="flex items-center justify-center text-sm mb-3">
                    <ChefHat className="w-4 h-4 mr-1 text-orange-500" />
                    <span className="font-medium text-gray-600">Préparation</span>
                  </div>

                  <div className="text-2xl font-bold text-orange-600">
                    {time.prep} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temps personnalisé */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-500" />
            Temps personnalisé
          </h3>
          <div
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${useCustom
              ? 'border-orange-500 bg-orange-50 shadow-md'
              : 'border-gray-200 hover:border-orange-300'
              }`}
            onClick={handleCustomSelect}
          >
            <div className="grid grid-cols-1  gap-6">
              {/* Temps de préparation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChefHat className="w-4 h-4 inline mr-1" />
                  Temps de préparation
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={customPreparationTime}
                    onChange={(e) => {
                      setCustomPreparationTime(Number(e.target.value));
                      if (useCustom) {
                        setSelectedPreparationTime(Number(e.target.value));
                      }
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="min-w-[60px] text-center">
                    <span className="text-lg font-bold text-orange-600">{customPreparationTime}</span>
                    <span className="text-sm text-gray-500 ml-1">minutes</span>
                  </div>
                </div>
              </div>
            </div>

            {useCustom && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <div className="text-lg font-bold text-orange-600">
                  {customPreparationTime} minutes
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
        <div></div>
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPreparationTime}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirmer ({selectedPreparationTime || 0} min)
          </button>
        </div>
      </div>

      <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #f97316;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .slider::-moz-range-thumb {
            height: 40px;
            width: 20px;
            border-radius: 50%;
            background: #f97316;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `}</style>
    </Modal>
  );
};

export default PreparationTimeModal;