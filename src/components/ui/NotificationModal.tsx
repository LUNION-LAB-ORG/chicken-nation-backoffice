"use client"

import React from 'react'
import Image from 'next/image'
import { Notification } from '@/services/notificationService'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Clock, User, Tag, Eye, EyeOff } from 'lucide-react'

interface NotificationModalProps {
  notification: Notification | null
  isOpen: boolean
  onClose: () => void
  onMarkAsRead?: (notificationId: string) => void
  onMarkAsUnread?: (notificationId: string) => void
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAsUnread
}) => {
 
  React.useEffect(() => {
    if (notification) {
      console.log('Données de la notification :', notification);
    }
  }, [notification]);

  if (!isOpen || !notification) return null;

  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      })
    } catch {
      return 'Il y a quelques instants'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ORDER':
        return 'bg-green-100 text-green-800'
      case 'PAYMENT':
        return 'bg-blue-100 text-blue-800'
      case 'DELIVERY':
        return 'bg-orange-100 text-orange-800'
      case 'PROMOTION':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ORDER':
        return '🛒'
      case 'PAYMENT':
        return '💳'
      case 'DELIVERY':
        return '🚚'
      case 'PROMOTION':
        return '🎉'
      default:
        return '📢'
    }
  }

  const handleToggleRead = () => {
    if (notification.is_read && onMarkAsUnread) {
      onMarkAsUnread(notification.id)
    } else if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative flex items-center justify-center px-0 pt-0 pb-0 bg-[#FFF3E3] rounded-t-2xl h-[40px]">
          <h2 className="text-base font-sofia-semibold text-[#F17922] mx-auto text-center">Détails de la notification</h2>
          <Image
            src="/icons/close.png"
            width={20}
            height={20}
            alt="Fermer"
            onClick={onClose}
            className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
          />
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-4 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(notification.type)}`}>
              <span className="mr-2">{getTypeIcon(notification.type)}</span>
              {notification.type}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              notification.is_read
                ? 'bg-gray-100 text-gray-600'
                : 'bg-orange-100 text-orange-600'
            }`}>
              {notification.is_read ? 'Lue' : 'Non lue'}
            </span>
          </div>

          {/* Icon */}
          {notification.icon && (
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gray-100">
                <Image
                  src={notification.icon}
                  alt="Notification icon"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {notification.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Additional Data */}
          {notification.data && Object.keys(notification.data).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Informations supplémentaires</h4>
              <div className="space-y-2">
                {Object.entries(notification.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-gray-900 font-medium">
                      {typeof value === 'number' && key.includes('amount')
                        ? `${value.toLocaleString()} FCFA`
                        : String(value)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Créée {formatNotificationTime(notification.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>Destinataire: {notification.target}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag size={16} />
              <span>ID: {notification.id}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[44px] bg-[#ECECEC] text-[#71717A] rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleToggleRead}
            className="flex-1 h-[44px] bg-[#F17922] text-white rounded-lg hover:bg-[#F17922]/90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {notification.is_read ? (
              <>
                <EyeOff size={16} />
                Marquer comme non lue
              </>
            ) : (
              <>
                <Eye size={16} />
                Marquer comme lue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationModal
