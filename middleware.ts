import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
 
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/gestion');
  
  // Si ce n'est pas une route protégée, continuer normalement
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
 
  // ✅ SÉCURITÉ: Récupérer le token directement depuis le cookie token
  const tokenCookie = request.cookies.get('chicken-nation-token');
  const authStatusCookie = request.cookies.get('chicken-nation-auth');

  // Vérifier que les cookies d'authentification existent
  if (!tokenCookie?.value || !authStatusCookie?.value || authStatusCookie.value !== 'true') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // Validation basique du format JWT (optionnel mais recommandé)
    const token = tokenCookie.value;
    const parts = token.split('.');

    if (parts.length !== 3) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // ✅ SÉCURITÉ: Vérifier l'expiration du token avec gestion d'erreurs
    try {
      /**
       * ⚠️ `atob` ne lit PAS le base64url, et un JWT est encodé en base64url.
       *
       * Sa partie centrale remplace « + » par « - » et « / » par « _ », deux
       * caractères que `atob` refuse : il lève, le `catch` juste en dessous
       * redirige vers l'accueil, et l'utilisateur est déconnecté sans rien
       * comprendre. Selon le contenu du jeton, cela touche une session sur
       * plusieurs, ce qui est le pire des cas : intermittent, donc
       * inexplicable. On rétablit l'alphabet standard et le remplissage avant
       * de décoder.
       */
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const rembourre = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(rembourre));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Token malformé
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Si tout est bon, continuer normalement
    return NextResponse.next();
  } catch {
    // En cas d'erreur, rediriger vers la page de connexion
    return NextResponse.redirect(new URL('/', request.url));
  }
}

// Configurer les chemins sur lesquels le middleware sera exécuté
export const config = {
  matcher: [
    // Appliquer ce middleware uniquement aux routes commençant par /gestion
    '/gestion/:path*',
  ],
};
