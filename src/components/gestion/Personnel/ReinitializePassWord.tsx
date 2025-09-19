"use client";

import { useState } from "react";
import { resetUserPassword } from "@/services/userService";
import UserCredentialsModal from "./UserCredentialsModal";

interface ResetPasswordButtonProps {
    userId: string;
}


export default function ResetPasswordButton({ userId }: ResetPasswordButtonProps) {
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [resetUserCredentials, setResetUserCredentials] = useState<{ email: string; password: string } | null>(null);

    // Générer un mot de passe aléatoire
    const generateRandomPassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    };

    // Réinitialiser le mot de passe via l'API
    const handleResetPassword = async () => {
        try {
            const response = await resetUserPassword(userId);
            console.log("Mot de passe réinitialisé avec succès", response);
            
            // Mettre à jour les credentials pour le modal avec les données retournées par l'API
            setResetUserCredentials({
                email: response.email,
                password: response.password
            });
            
            setShowPasswordModal(true);
        } catch (error) {
            console.error("Erreur lors de la réinitialisation du mot de passe", error);
        }
    }

    return (
        <>
            {/* Bouton pour ouvrir le premier modal */}
            <button
                onClick={() => setShowWarningModal(true)}
                className="px-6 py-2 bg-[#F17922] cursor-pointer text-white text-sm font-medium rounded-xl hover:bg-[#F17922]/80 transition-colors duration-200"
            >
                Réinitialiser mon mot de passe
            </button>

            {/* Premier Modal - Avertissement */}
            {showWarningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full transform animate-in fade-in zoom-in duration-300">
                        <div className="text-center">
                            {/* Icône d'avertissement */}
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Attention
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Êtes-vous sûr de vouloir réinitialiser votre mot de passe ?
                                Un nouveau mot de passe sera généré et devra être utilisé pour vos prochaines connexions.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowWarningModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all duration-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    className="flex-1 bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-all duration-200"
                                >
                                    Continuer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <UserCredentialsModal
                open={showPasswordModal}
                email={resetUserCredentials?.email || ''}
                password={resetUserCredentials?.password || ''}
                onClose={() => setShowPasswordModal(false)}
            />
        </>
    );
}