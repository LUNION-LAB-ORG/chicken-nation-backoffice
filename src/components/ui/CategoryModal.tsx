"use client"

import React, { useEffect } from 'react'
import Image from 'next/image'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function CategoryModal({ isOpen, onClose, title, children }: CategoryModalProps) {
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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm modal-overlay"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl modal-content overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-[#FDEDD3]">
              <div className="flex-1 text-center">
                <h3 className="text-[#F17922] font-medium">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-white/20 transition-colors"
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
