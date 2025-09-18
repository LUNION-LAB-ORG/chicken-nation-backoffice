/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ PERFORMANCE: Optimisations de production
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // ✅ PERFORMANCE: Optimisations du bundle (temporairement réduites)
  experimental: {
    serverExternalPackages: ['puppeteer'],
    optimizeCss: false, 
    optimizePackageImports: ['lucide-react', 'date-fns'],
    forceSwcTransforms: false,
    swcTraceProfiling: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kfy9qwx5yd.ufs.sh',
      },
      {
        protocol: 'https',
        hostname: 'chicken.turbodeliveryapp.com',
      },
    ],
    // ✅ PERFORMANCE: Formats d'images modernes
    formats: ['image/webp', 'image/avif'],
    // ✅ PERFORMANCE: Tailles optimisées
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // ✅ Support des SVG avec CSP strict
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
 
  eslint: {
  
    ignoreDuringBuilds: true,
    dirs: [],  
  },
  typescript: {
   
    ignoreBuildErrors: true,
  },
 

 
};

module.exports = nextConfig;
