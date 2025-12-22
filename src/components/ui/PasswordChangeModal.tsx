"use client";

import { useUIStore } from "@/store/uiStore";
import Image from "next/image";

interface PasswordChangeModalProps {
  isOpen: boolean;
}

export default function PasswordChangeModal({
  isOpen,
}: PasswordChangeModalProps) {
  const { setShowPasswordChangeModal, setShowEditProfile } = useUIStore();

  if (!isOpen) return null;

  const handleChangePassword = () => {
    setShowPasswordChangeModal(false);
    setShowEditProfile(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-out scale-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F17922] to-orange-600 px-8 py-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-white rounded-full p-4 mb-4 shadow-lg">
              <Image
                src="/images/mascot.png"
                alt="Mascotte Chicken Nation"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Bienvenue chez Chicken Nation !
            </h2>
            <div className="w-16 h-1 bg-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-8 py-6">
          <div className="text-center mb-8">
            {/* Alerte sécurité */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-6 h-6 text-amber-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-amber-800 font-semibold">
                  Sécurité requise
                </span>
              </div>
              <p className="text-amber-700 text-sm">
                Pour des raisons de sécurité, nous vous demandons de changer le
                mot de passe qui vous a été communiqué.
              </p>
            </div>

            {/* Conseil */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-5 h-5 text-orange-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-orange-800 font-medium text-sm">
                  Conseil de sécurité
                </span>
              </div>
              <p className="text-orange-700 text-sm">
                Choisissez un mot de passe fort avec au moins 8 caractères,
                incluant des lettres, chiffres et symboles.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleChangePassword}
              className="w-full bg-gradient-to-r cursor-pointer from-[#F17922] to-orange-500 hover:from-[#F17922] hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-orange-400/50 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Modifier mon mot de passe
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Cette étape est obligatoire
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
