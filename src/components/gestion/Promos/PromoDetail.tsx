"use client"

import React from 'react'
import { PromoCardData } from './PromoCard'
import { Edit, Trash2, Copy, Share } from 'lucide-react'

interface PromoDetailProps {
  promo: PromoCardData
  onEdit?: (promo: PromoCardData) => void
  onDelete?: (promo: PromoCardData) => void
  onDuplicate?: (promo: PromoCardData) => void
  className?: string
}

const PromoDetail = ({ promo, onEdit, onDelete, onDuplicate, className = '' }: PromoDetailProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'expired':
        return 'Expiré'
      case 'upcoming':
        return 'À venir'
      default:
        return 'Inconnu'
    }
  }

  return (
    <div className={`bg-white rounded-xl p-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prévisualisation de la promotion */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prévisualisation</h3>
          <div
            className="w-full h-48 rounded-xl p-6 flex flex-col justify-between shadow-lg"
            style={{ backgroundColor: promo.background }}
          >
            <div>
              <div 
                className="text-4xl font-bold mb-2"
                style={{ color: promo.textColor }}
              >
                {promo.discount}
              </div>
              <div 
                className="text-lg font-medium mb-2"
                style={{ color: promo.textColor }}
              >
                {promo.title}
              </div>
              <div 
                className="text-sm opacity-90"
                style={{ color: promo.textColor }}
              >
                {promo.description}
              </div>
            </div>
            
            {promo.validUntil && (
              <div 
                className="text-sm opacity-75"
                style={{ color: promo.textColor }}
              >
                Valide jusqu&apos;au {promo.validUntil}
              </div>
            )}
          </div>
        </div>

        {/* Informations détaillées */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Détails de la promotion</h3>
          
          {/* Card principale avec toutes les informations */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
            
            {/* Informations principales - Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">TITRE</label>
                <p className="text-sm font-semibold text-gray-900 truncate">{promo.title}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">RÉDUCTION</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{promo.discount}</span>
                  <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                    {promo.type === 'percentage' ? '%' : '€'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">DESCRIPTION</label>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{promo.description}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Statut et Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">STATUT</label>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(promo.status || 'unknown')}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {getStatusText(promo.status || 'unknown')}
                </span>
              </div>
              {promo.validUntil && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">EXPIRE LE</label>
                  <p className="text-sm font-medium text-gray-900">{promo.validUntil}</p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100"></div>

            {/* Couleurs */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-3">PERSONNALISATION</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Arrière-plan</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded border border-gray-200"
                      style={{ backgroundColor: promo.background }}
                    />
                    <span className="text-xs font-mono text-gray-500">{promo.background}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Texte</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded border border-gray-200"
                      style={{ backgroundColor: promo.textColor }}
                    />
                    <span className="text-xs font-mono text-gray-500">{promo.textColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          🛠️ Actions disponibles
        </h4>
        <div className="flex flex-wrap gap-3">
          {onEdit && (
            <button
              onClick={() => onEdit(promo)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Edit size={18} />
              <span>Modifier</span>
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => onDuplicate(promo)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Copy size={18} />
              <span>Dupliquer</span>
            </button>
          )}

          <button
            onClick={() => navigator.share?.({ title: promo.title, text: promo.description })}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Share size={18} />
            <span>Partager</span>
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(promo)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Trash2 size={18} />
              <span>Supprimer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromoDetail
