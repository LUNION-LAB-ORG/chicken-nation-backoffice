"use client";
import { useState, useEffect } from "react";

export function useOfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Composant à retourner
  const OfflineBanner = () => {
    if (isOnline) return null;

    return (
      <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-50">
        ⚠️ Vous êtes hors ligne. Certaines fonctionnalités peuvent ne pas fonctionner.
      </div>
    );
  };

  return OfflineBanner;
}
