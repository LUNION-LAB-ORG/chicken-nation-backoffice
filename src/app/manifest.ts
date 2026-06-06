import type { MetadataRoute } from "next";

/**
 * Manifest PWA — permet « Ajouter à l'écran d'accueil » et l'ouverture en plein
 * écran (sans barre Safari) sur mobile. Next sert ce fichier sur
 * `/manifest.webmanifest` et injecte automatiquement le <link rel="manifest">.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chicken Nation — Backoffice",
    short_name: "Chicken Nation",
    description: "Gestion Chicken Nation (commandes, clients, acquisition…)",
    start_url: "/gestion",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#F17922",
    icons: [
      { src: "/icons/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
