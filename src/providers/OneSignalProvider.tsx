"use client";

import { useEffect } from "react";

export const isLocalhost = () => {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
};

export default function OneSignalProvider() {
  useEffect(() => {
    if (isLocalhost()) {
      console.info("[OneSignal] désactivé en local");
      return;
    }
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
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
