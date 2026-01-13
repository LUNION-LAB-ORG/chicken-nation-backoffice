'use client';

import { useEffect } from 'react';

export default function OneSignalProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;

    script.onload = () => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
        await OneSignal.init({
          appId: '84ad1a4a-379f-477a-b498-4d51766dde9e',
        });
      });
    };

    document.head.appendChild(script);
  }, []);

  return null;
}
