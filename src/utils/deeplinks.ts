/**
 * Liens de redirection vers l'application mobile.
 *
 * Un seul lien sert les deux cas : si le client a l'application, elle s'ouvre
 * directement sur la page visée ; sinon il est renvoyé vers la boutique. C'est
 * la page `/app-mobile/deep-link` du site qui fait cet aiguillage, pas nous.
 *
 * ⚠️ L'adresse canonique exige le `www.` ET le `/fr/`. Sans l'un des deux, la
 * redirection ne fonctionne pas : c'est un incident déjà vécu sur ce projet, ne
 * pas « simplifier » cette constante.
 */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.chicken-nation.com").replace(/\/+$/, "");

const BASE = `${SITE}/fr/app-mobile/deep-link`;

/**
 * ⚠️ Le paramètre attend l'IDENTIFIANT de l'objet, pas une référence lisible.
 * Le tableau de spécification parle de « REFERENCE », mais la page du site
 * résout la valeur en appelant l'API par identifiant.
 */
export const lienPlat = (dishId: string) => `${BASE}?product=${encodeURIComponent(dishId)}`;
export const lienCategorie = (categoryId: string) => `${BASE}?category=${encodeURIComponent(categoryId)}`;
export const lienCommande = (orderId: string) => `${BASE}?order=${encodeURIComponent(orderId)}`;
export const lienBons = () => `${BASE}?voucher=true`;
export const lienFidelite = () => `${BASE}?loyalty=true`;
export const lienCarteNation = () => `${BASE}?nation-card=true`;
/** Acquisition : page de téléchargement, sans cible particulière. */
export const lienTelechargement = () => `${SITE}/fr/app-mobile/download`;

/**
 * Copie un texte dans le presse-papiers.
 *
 * ⚠️ `navigator.clipboard` n'existe QUE sur une origine sécurisée. Le repli par
 * champ masqué couvre les accès en http, sans quoi le bouton ne ferait rien du
 * tout et sans le moindre message.
 */
export async function copierDansLePressePapiers(texte: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texte);
      return true;
    }
    const champ = document.createElement("textarea");
    champ.value = texte;
    champ.setAttribute("readonly", "");
    champ.style.position = "fixed";
    champ.style.opacity = "0";
    document.body.appendChild(champ);
    champ.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(champ);
    return ok;
  } catch {
    return false;
  }
}
