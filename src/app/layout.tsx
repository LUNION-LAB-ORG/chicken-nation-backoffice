import type { Metadata, Viewport } from "next";
import "./globals.css";
import { urbanist, blocklynCondensed, blocklynGrunge } from "./fonts";
import { Toaster } from "react-hot-toast";
import { GoogleMapsProvider } from "@/contexts/GoogleMapsContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import OneSignalProvider from "@/providers/OneSignalProvider";

// Métadonnées de l'application
export const metadata: Metadata = {
  title: "Chicken Nation",
  description: "Champion dans poulet",
  applicationName: "Chicken Nation",
  icons: {
    icon: "/icons/logo.png",
    shortcut: "/icons/logo.png",
    apple: "/icons/logo.png",
  },
  // Permet l'ouverture en plein écran depuis l'écran d'accueil iOS (mode standalone)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chicken Nation",
  },
};

// Next 15 : themeColor / viewportFit doivent être dans `viewport`, pas dans `metadata`
export const viewport: Viewport = {
  themeColor: "#F17922",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${urbanist.variable} ${blocklynCondensed.variable} ${blocklynGrunge.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <OneSignalProvider />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#f38200",
              color: "#fff",
            },
          }}
        />
        <NuqsAdapter>
          <QueryProvider>
            <GoogleMapsProvider>{children}</GoogleMapsProvider>
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
