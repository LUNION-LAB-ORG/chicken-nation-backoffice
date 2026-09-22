/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ PERFORMANCE: Optimisations de production
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // ✅ PERFORMANCE: Optimisations du bundle (temporairement réduites)
  experimental: {
    // `serverExternalPackages` retiré : la clé était déclarée ICI alors qu'elle
    // est de premier niveau, donc ignorée depuis toujours — d'où l'avertissement
    // au démarrage. Et elle ne désignait que `puppeteer`, qui n'était importé
    // nulle part et vient d'être retiré des dépendances. Rien à déplacer.
    optimizeCss: false,
    optimizePackageImports: ["lucide-react", "date-fns"],
    forceSwcTransforms: false,
    swcTraceProfiling: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "kfy9qwx5yd.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "api-private.chicken-nation.com",
      },
      {
        protocol: "https",
        hostname: "images.bfmtv.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "dvsxt5681pvqm.cloudfront.net",
      },
    ],
    // ✅ PERFORMANCE: Formats d'images modernes
    formats: ["image/webp", "image/avif"],
    // ✅ PERFORMANCE: Tailles optimisées
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // ✅ Support des SVG avec CSP strict
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // La clé `eslint` a disparu en Next 16, en même temps que `next lint` : elle
  // n'est plus reconnue et le signalait à chaque démarrage. Rien n'est perdu,
  // le lint ne s'exécute plus au build de toute façon.
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
