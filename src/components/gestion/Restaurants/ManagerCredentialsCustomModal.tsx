"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface ManagerCredentialsCustomModalProps {
  open: boolean;
  email: string;
  password: string;
  onClose: () => void;
}

const ManagerCredentialsCustomModal: React.FC<
  ManagerCredentialsCustomModalProps
> = ({ open, email, password, onClose }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <style jsx global>{`
        .credentials-modal-overlay {
          animation: overlayShow 150ms ease-out;
        }
        .credentials-modal-content {
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

      {/* ✅ MODAL CUSTOM AVEC Z-INDEX TRÈS ÉLEVÉ */}
      <div className="fixed inset-0 overflow-y-auto z-99">
        {/* ✅ OVERLAY QUI NE FERME PAS LE MODAL */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md credentials-modal-overlay"
          aria-hidden="true"
          // ❌ PAS DE onClick={onClose} - Le modal ne se ferme pas en cliquant ailleurs
        />

        <div className="flex min-h-full  items-center justify-center p-4">
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl credentials-modal-content overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ✅ HEADER ÉLARGI AVEC DESIGN AMÉLIORÉ */}
            <div className="flex items-center px-8 py-4 bg-hex-fdedd3">
              <div className="flex-1 text-center">
                <h3 className="text-[#F17922] font-bold text-xl">
                  🔑 Accès du gérant
                </h3>
                <p className="text-[#F17922] text-sm mt-1 opacity-80">
                  Identifiants de connexion générés automatiquement
                </p>
              </div>
              {/* ✅ SEUL MOYEN DE FERMER LE MODAL */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 cursor-pointer hover:bg-white/20 transition-colors absolute right-6"
                aria-label="Fermer le modal"
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

            {/* ✅ CONTENU ÉLARGI ET AMÉLIORÉ */}
            <div className="p-8">
              <div className="flex flex-col gap-6 items-center">
                <div className="w-full flex flex-col gap-6 px-6 py-4">
                  {/* ✅ CHAMP EMAIL ÉLARGI */}
                  <div className="flex items-center justify-between bg-hex-f7f7f7 rounded-xl px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-hex-595959 text-sm font-medium">
                        👤 Utilisateur
                      </span>
                      <span className="text-[#F17922] font-mono text-lg font-bold">
                        {email}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="bg-[#F17922] text-blanc text-sm px-8 py-2 cursor-pointer rounded-lg ml-4 hover:bg-[#f18c3b] transition-colors font-medium"
                      onClick={() => {
                        navigator.clipboard.writeText(email);
                        toast.success("Email copié !");
                      }}
                    >
                      📋 Copier
                    </button>
                  </div>

                  {/* ✅ CHAMP MOT DE PASSE ÉLARGI */}
                  <div className="flex items-center justify-between bg-hex-f7f7f7 rounded-xl px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-hex-595959 text-sm font-medium">
                        🔐 Mot de passe
                      </span>
                      <span className="text-[#F17922] font-mono text-lg font-bold">
                        {password}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="bg-[#F17922] text-blanc text-sm px-8 py-2 cursor-pointer rounded-lg ml-4 hover:bg-[#f18c3b] transition-colors font-medium"
                      onClick={() => {
                        navigator.clipboard.writeText(password);
                        toast.success("Mot de passe copié !");
                      }}
                    >
                      📋 Copier
                    </button>
                  </div>
                </div>

                {/* ✅ MESSAGE D'INFORMATION ÉLARGI */}
                <div className="w-full px-6">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6">
                    <div className="text-center">
                      <div className="text-4xl mb-3">⚠️</div>
                      <p className="text-orange-800 text-lg font-bold mb-2">
                        Information importante
                      </p>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        Veuillez{" "}
                        <span className="font-bold">noter soigneusement</span>{" "}
                        ces identifiants de connexion.
                        <br />
                        Ils ne seront{" "}
                        <span className="font-bold text-red-600">
                          plus jamais affichés
                        </span>{" "}
                        après fermeture de cette fenêtre.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ✅ BOUTONS DE FERMETURE ÉLARGIS */}
                <div className="w-full px-6 pt-4 space-y-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-[#F17922] to-[#FA6345] hover:from-[#E06A1B] hover:to-[#E85A3A] text-blanc font-bold py-4 px-6 rounded-xl transition-all duration-200 text-lg shadow-lg"
                  >
                    ✅ J&apos;ai noté les identifiants - Fermer
                  </button>
                  <p className="text-center text-xs text-gray-500">
                    Vous pouvez aussi fermer en cliquant sur le ❌ en haut à
                    droite
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagerCredentialsCustomModal;
