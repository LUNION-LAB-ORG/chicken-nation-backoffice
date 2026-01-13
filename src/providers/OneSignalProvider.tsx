'use client';

import { useEffect } from 'react';

export default function OneSignalProvider() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (typeof window === 'undefined') return;

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;

    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.init({
          appId,
        });
      });
    };

    document.head.appendChild(script);
  }, []);

  return null;
}
