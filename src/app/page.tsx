"use client";

import AuthHeader from "@/components/auth/AuthHeader";
import LoginForm from "@/components/auth/LoginForm";
import { useAuthStore } from "../../features/users/hook/authStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { LoginCredentials } from "../../features/users/types/auth.type";

/**
 * Page de connexion
 * Reproduit fidèlement l'écran de connexion de Chicken Nation
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, hydrate } = useAuthStore();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    // Forcer l'hydratation du store côté client
    hydrate();

    // Vérifier immédiatement si l'utilisateur est authentifié
    const checkAuthentication = () => {
      if (isAuthenticated && !redirecting) {
        setRedirecting(true);
        router.push("/gestion");
      } else {
        // Marquer que la vérification est terminée
        setCheckingAuth(false);
      }
    };

    // Délai court pour permettre l'hydratation du store
    const timer = setTimeout(checkAuthentication, 200);

    // Timer de sécurité pour éviter l'attente infinie
    const fallbackTimer = setTimeout(() => {
      if (checkingAuth) {
        setCheckingAuth(false);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [isAuthenticated, router, redirecting, checkingAuth, hydrate]);

  /**
   * Gère la soumission du formulaire de connexion
   */
  const handleLogin = async (credentials: LoginCredentials) => {
    setLoginError(null);

    try {
      // Effectuer la connexion via le store qui utilise maintenant notre service d'authentification
      await login(credentials);

      // Marquer qu'on est en train de rediriger
      setRedirecting(true);

      // Rediriger vers le tableau de bord
      router.push("/gestion");
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Erreur de connexion"
      );
    }
  };

  // Afficher un écran de chargement pendant la vérification ou la redirection
  if (checkingAuth || redirecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="mb-4">
            <Image
              src="/icons/chicken.png"
              alt="Chicken Nation"
              width={48}
              height={48}
              className="mx-auto"
            />
          </div>
          <h2 className="text-xl font-bold text-[#F17922] mb-4">
            {redirecting ? "Connexion réussie !" : "Vérification en cours..."}
          </h2>
          <p className="text-gray-600 mb-4">
            {redirecting
              ? "Vous allez être redirigé vers votre tableau de bord"
              : "Nous vérifions vos informations d'authentification"}
          </p>

          {/* Spinner de chargement */}
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Header fixe */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AuthHeader />
      </div>

      {/* Contenu principal - exactement la hauteur restante */}
      <main
        className={`${styles.fullHeightContainer} flex flex-col md:flex-row`}
        style={{
          backgroundColor: "black",
          backgroundImage: 'url("/images/background.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Section gauche avec mascotte - cachée sur mobile */}
        <div className="hidden md:flex flex-1 items-end justify-center pb-0 pt-6 px-6 lg:px-12">
          <div className="relative w-full max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl h-full max-h-[85vh]">
            <Image
              src="/images/mascote.png"
              alt="Chicken Nation Mascotte"
              fill
              priority
              className="object-contain object-bottom"
            />
          </div>
        </div>

        {/* Section droite avec formulaire - pleine largeur sur mobile */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            {/* Carte de connexion */}
            <div className="bg-white rounded-3xl shadow-lg p-8 z-10">
              <h2 className="text-center text-2xl text-[#F17922] font-bold text-primary mb-8">
                Commençons
              </h2>

              <div className="text-center text-sm  text-slate-600 mb-6">
                Identifiant de l&apos;admin
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {loginError}
                </div>
              )}

              <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
