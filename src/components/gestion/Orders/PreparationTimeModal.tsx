"use client";

import React, { useState } from 'react';
import { Clock, ChefHat, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Image from 'next/image';
import { formatImageUrl } from '@/utils/imageHelpers';
import { useOrderByIdQuery, useUpdatePreparationTimeMutation } from '@/hooks/useOrdersQuery';
import { OrderData } from './types';

interface PreparationTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preparationTime: number) => void;
  orderReference?: string;
  orderId?: string | null; // ✅ Passer l'ID pour fetch les données complètes
  // orderData?: OrderData | null; // ✅ Déprécié, on utilise orderId
}

const PreparationTimeModal: React.FC<PreparationTimeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderReference,
  orderId
}) => {
  // ✅ Fetch les données complètes de la commande
  const { data: orderData, isLoading: orderLoading, error: orderError } = useOrderByIdQuery(orderId);
  
  // ✅ Mutation pour sauvegarder le temps de préparation
  const updatePreparationTimeMutation = useUpdatePreparationTimeMutation();

  const [selectedPreparationTime, setSelectedPreparationTime] = useState<number | null>(null);
  const [customPreparationTime, setCustomPreparationTime] = useState<number>(15);
  const [useCustom, setUseCustom] = useState(false);



  // Temps prédéfinis (en minutes)
  const predefinedTimes = [
    { prep: 10, label: "Express"},
    { prep: 15, label: "Rapide"},
    { prep: 20, label: "Standard"},
    { prep: 25, label: "Élaboré"},
    { prep: 30, label: "Complexe"},
    { prep: 40, label: "Spécial"}
  ];

  const handlePredefinedSelect = (prep: number) => {
    setSelectedPreparationTime(prep);
    setUseCustom(false);
  };

  const handleCustomSelect = () => {
    setSelectedPreparationTime(customPreparationTime);
    setUseCustom(true);
  };

  const handleConfirm = async () => {
    if (selectedPreparationTime && orderId) {
      try {
        // ✅ Sauvegarder en base de données
        await updatePreparationTimeMutation.mutateAsync({
          orderId,
          preparationTime: selectedPreparationTime
        });
        
        // ✅ Notifier le parent (pour compatibilité)
        onConfirm(selectedPreparationTime);
        
        // ✅ Fermer le modal
        onClose();
        
        // Reset
        setSelectedPreparationTime(null);
        setUseCustom(false);
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du temps de préparation:', error);
        // Le modal reste ouvert en cas d'erreur pour que l'utilisateur puisse réessayer
      }
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

  // Console log supprimé - le modal utilise maintenant un hook pour fetch les données

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Temps de préparation${orderReference ? ` - ${orderReference}` : ''}`}
      size="large"
    >

      <div>
        {/* Section des plats commandés */}
        {orderLoading ? (
          <div className="mb-8 p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
              <span className="text-gray-600">Chargement des détails de la commande...</span>
            </div>
          </div>
        ) : orderError ? (
          <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="text-center text-red-800">
              <ChefHat className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <p className="font-medium">Erreur lors du chargement</p>
              <p className="text-sm mt-1">Impossible de récupérer les détails de la commande</p>
            </div>
          </div>
        ) : orderData?.order_items && orderData.order_items.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ChefHat className="w-5 h-5 mr-2 text-[#F17922]" />
              Plats à préparer 
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderData.order_items.map((item, index) => (
                  <div key={item.id || index} className="flex items-center space-x-3 r p-3  ">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <SafeImage
                        src={item.dish?.image}
                        alt={item.dish?.name || "Plat"}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.dish?.name || "Plat inconnu"}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Quantité: {item.quantity || 1}</span>
                       
                      </div>
                      {/* ✅ Gestion des suppléments selon la structure API réelle */}
                      {item.supplements && Array.isArray(item.supplements) && item.supplements.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Suppléments: {item.supplements.map((s, i) => 
                            typeof s === 'string' ? s : s?.name || `Supplément ${i + 1}`
                          ).join(', ')}
                        </div>
                      )}

                       {item.epice ? (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                            🌶️ Épicé
                          </span>
                        ) : (
                          <div> <span className="bg-green-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                            🌿Non Épicé
                          </span>
                          </div>
                        ) 
                      }
                    </div> 
                  </div>
                ))}
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
                    orderData.order_items.length === 0 ? 'Liste d\'items vide' : 'Structure de données inattendue'}
              </p>
            </div>
          </div>
        )}

        {/* Temps prédéfinis */}
        <div className="mb-8"> 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedTimes.map((time, index) => (
              <div
                key={index}
                onClick={() => handlePredefinedSelect(time.prep)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${selectedPreparationTime === time.prep && !useCustom
                  ? 'border-[#F17922] bg-orange-50 shadow-md'
                  : 'border-gray-200 hover:border-orange-300'
                  }`}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-600 mb-2">{time.label}</div> 
                  <div className="text-2xl font-bold text-orange-600">
                    {time.prep} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temps personnalisé   */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-[#F17922]" />
            Temps personnalisé
          </h3>
          <div
            className={`p-8 rounded-2xl border-2 transition-all duration-300 ${useCustom
              ? 'border-[#F17922] bg-gradient-to-br from-orange-50 to-yellow-50 shadow-xl transform scale-[1.02]'
              : 'border-gray-200 hover:border-orange-300 hover:shadow-lg'
              }`}
            onClick={handleCustomSelect}
          >
            {/* Header avec indicateur dynamique */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full transition-all duration-300 ${
                  useCustom ? 'bg-[#F17922] shadow-lg' : 'bg-gray-300'
                }`}>
                  <ChefHat className={`w-5 h-5 ${
                    useCustom ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Temps de préparation</div>
                  <div className="text-xs text-gray-500">Ajustez selon vos besoins</div>
                </div>
              </div>
              
              {/* Affichage du temps avec animation */}
              <div className={`px-6 py-3 rounded-2xl transition-all duration-300 ${
                useCustom 
                  ? 'bg-white shadow-md border-2 border-orange-200' 
                  : 'bg-gray-100 border border-gray-300'
              }`}>
                <div className="text-center">
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    useCustom ? 'text-orange-600' : 'text-gray-700'
                  }`}>
                    {customPreparationTime}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">minutes</div>
                </div>
              </div>
            </div>

            {/* SLIDER RÉVOLUTIONNAIRE avec indicateurs visuels */}
            <div className="relative">
              {/* Labels de temps sur l'axe */}
              <div className="flex justify-between text-xs text-gray-900 mb-2 px-1">
                <span>5min</span>
                <span className="opacity-70">50min</span>
                <span className="opacity-70">100min</span>
                <span className="opacity-70">150min</span>
                <span>200min</span>
              </div>
              
              {/* Container du slider avec zones colorées */}
              <div className="relative h-6 bg-white rounded-full overflow-hidden">
                {/* Zones de difficulté avec indicateurs visuels */}
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-gradient-to-r from-green-200 to-green-300 opacity-70"></div>
                  <div className="flex-1 bg-gradient-to-r from-yellow-200 to-yellow-300 opacity-70"></div>
                  <div className="flex-1 bg-gradient-to-r from-orange-200 to-orange-300 opacity-70"></div>
                  <div className="flex-1 bg-gradient-to-r from-red-200 to-red-300 opacity-70"></div>
                </div>
                
                {/* Track actif jusqu'à la position */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-200 shadow-md"
                  style={{ width: `${((customPreparationTime - 5) / (200 - 5)) * 100}%` }}
                ></div>
                
                {/* Slider input invisible */}
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {/* Thumb personnalisé avec animation */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-200"
                  style={{ left: `${((customPreparationTime - 5) / (200 - 5)) * 100}%` }}
                >
                  <div className={`w-8 h-8 rounded-full border-4 border-white shadow-lg transition-all duration-200 ${
                    useCustom 
                      ? 'bg-[#F17922] shadow-orange-200 transform scale-110' 
                      : 'bg-gray-400 shadow-gray-200'
                  }`}>
                    {/* Indicateur central */}
                    <div className={`absolute inset-1 rounded-full ${
                      useCustom ? 'bg-white opacity-30' : 'bg-gray-200 opacity-50'
                    }`}></div>
                  </div>
                  
                  {/* Tooltip flottant */}
                  <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    useCustom 
                      ? 'bg-orange-600 text-white shadow-lg opacity-100' 
                      : 'bg-gray-600 text-white opacity-0'
                  }`}>
                    {customPreparationTime}min
                    {/* Flèche */}
                    <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent ${
                      useCustom ? 'border-t-orange-600' : 'border-t-gray-600'
                    }`}></div>
                  </div>
                </div>
              </div> 
            </div>
             
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
        <div></div>
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 cursor-pointer bg-white border border-gray-300 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPreparationTime || updatePreparationTimeMutation.isPending}
            className="px-6 py-2 bg-[#F17922] cursor-pointer text-white rounded-2xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {updatePreparationTimeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sauvegarde...</span>
              </>
            ) : (
              <span>Confirmer ({selectedPreparationTime || 0} min)</span>
            )}
          </button>
        </div>
      </div>
 
    </Modal>
  );
};

export default PreparationTimeModal;