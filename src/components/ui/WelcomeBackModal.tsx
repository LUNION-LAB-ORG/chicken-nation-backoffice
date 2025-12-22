"use client";

import { useUIStore } from "@/store/uiStore";

interface WelcomeBackModalProps {
  isOpen: boolean;
}

export default function WelcomeBackModal({ isOpen }: WelcomeBackModalProps) {
  const { setShowWelcomeBackModal } = useUIStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full transform animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#F17922] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Heureux de vous revoir !
          </h2>
          <p className="text-gray-600 mb-6">
            Bon retour sur Chicken Nation. Bon service !
          </p>

          <button
            onClick={() => setShowWelcomeBackModal(false)}
            className="w-full bg-[#F17922] cursor-pointer text-white font-semibold py-3 px-6 rounded-lg hover:from-primary-500 hover:to-[#F17922] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Merci !
          </button>
        </div>
      </div>
    </div>
  );
}