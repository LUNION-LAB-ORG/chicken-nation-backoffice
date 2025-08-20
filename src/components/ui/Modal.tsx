"use client"

import React, { useEffect } from 'react'
import Image from 'next/image'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'default' | 'large' | 'full'
}

export default function Modal({ isOpen, onClose, title, children, size = 'default' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

   const getMaxWidth = () => {
    switch (size) {
      case 'large':
        return 'max-w-5xl';
      case 'full':
        return 'max-w-[95%]';
      default:
        return 'max-w-3xl';
    }
  };

  return (
    <>
      <style jsx global>{`
        .modal-overlay {
          animation: overlayShow 150ms ease-out;
        }
        .modal-content {
          animation: modalSlide 150ms ease-out;
        }
        @keyframes overlayShow {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes modalSlide {
          from {
            opacity: 0;
            transform: translateY(-2%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-xs modal-overlay"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className={`relative w-full ${getMaxWidth()} rounded-2xl bg-white shadow-xl modal-content overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-6 py-2 bg-[#FDEDD3]">
              <div className="flex-1 text-center">
                <h3 className="text-[#F17922] font-medium">{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="rounded-full p-1 cursor-pointer  hover:bg-white/20 transition-colors absolute right-4"
              >
                <Image 
                  src="/icons/close.png"
                  alt="Fermer"
                  width={20}
                  height={20}
                  className="opacity-80"
                />
              </button>
            </div>

            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
