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
    description: "Gestion Chicken Nation : commandes, clients, support",
    start_url: "/gestion",
    scope: "/",
    display: "standalone",
    // Pas de verrou d'orientation : le module Messages et les tableaux se
    // consultent en paysage sur tablette.
    background_color: "#ffffff",
    theme_color: "#F17922",
    icons: [
      // Chaque taille déclarée correspond à un fichier de cette taille réelle
      // (l'ancien manifest servait le même 512 en le déclarant 192).
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
