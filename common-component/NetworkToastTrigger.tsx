'use client';

import { useNetworkStatus } from "@/hooks/useOfflineBanner copy";
import { toast } from "react-hot-toast";





export function NetworkToastTrigger() {
  const isOnline = useNetworkStatus();

  return (
    <div

    >
      {isOnline
        ? toast.success('✅ Vous êtes en ligne')
        : toast.error('⚠️ Vous êtes hors ligne. Certaines fonctionnalités peuvent ne pas fonctionner.')}
    </div>
  );
}
