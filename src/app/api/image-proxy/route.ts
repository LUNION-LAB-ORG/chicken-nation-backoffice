import { NextRequest, NextResponse } from 'next/server';

// ✅ SÉCURITÉ : Configuration stricte pour le proxy d'images
const ALLOWED_DOMAINS = [
  'chicken.turbodeliveryapp.com',
  'kfy9qwx5yd.ufs.sh'
];

const ALLOWED_PROTOCOLS = ['https:'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

/**
 * ✅ SÉCURITÉ : Validation stricte des URLs pour éviter SSRF
 */
function validateImageUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);

    // Vérifier le protocole
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Protocole non autorisé' };
    }

    // Vérifier le domaine
    if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      return { isValid: false, error: 'Domaine non autorisé' };
    }

    // Vérifier qu'il n'y a pas de redirection vers localhost/IP privées
    const hostname = parsedUrl.hostname;
    if (hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return { isValid: false, error: 'Adresse privée non autorisée' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'URL invalide' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('URL manquante', { status: 400 });
    }

    // ✅ SÉCURITÉ : Validation stricte de l'URL
    const validation = validateImageUrl(imageUrl);
    if (!validation.isValid) {
      return new NextResponse(validation.error || 'URL non autorisée', { status: 403 });
    }

    // ✅ SÉCURITÉ : Récupération sécurisée avec timeout et validation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ChickenNation-ImageProxy/1.0',
        },
        // ✅ SÉCURITÉ : Pas de redirection automatique
        redirect: 'manual'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return new NextResponse('Image non trouvée', { status: 404 });
      }

      // ✅ SÉCURITÉ : Validation du type de contenu
      const contentType = response.headers.get('content-type') || '';
      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        return new NextResponse('Type de contenu non autorisé', { status: 415 });
      }

      // ✅ SÉCURITÉ : Vérification de la taille
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        return new NextResponse('Fichier trop volumineux', { status: 413 });
      }

      // Obtenir le buffer de l'image avec limite de taille
      const imageBuffer = await response.arrayBuffer();

      // ✅ SÉCURITÉ : Double vérification de la taille
      if (imageBuffer.byteLength > MAX_FILE_SIZE) {
        return new NextResponse('Fichier trop volumineux', { status: 413 });
      }

      // ✅ SÉCURITÉ : Headers sécurisés
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400', // Cache 24h (réduit)
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Content-Security-Policy': "default-src 'none'",
        },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new NextResponse('Timeout de la requête', { status: 408 });
      }
      throw fetchError;
    }

  } catch {
    // ✅ SÉCURITÉ : Pas de détails d'erreur exposés
    return new NextResponse('Erreur serveur', { status: 500 });
  }
}
