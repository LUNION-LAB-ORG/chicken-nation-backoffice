import { getAuthToken } from "@/utils/authUtils";

/** « ?a=1&b=2 » sans les valeurs vides : un filtre effacé ne part pas au serveur. */
export function versQuery(params?: object): string {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([cle, valeur]) => {
    if (valeur === undefined || valeur === null || valeur === "") return;
    q.append(cle, String(valeur));
  });
  const texte = q.toString();
  return texte ? `?${texte}` : "";
}

/**
 * Téléchargement authentifié (export, rapport). Le nom vient de l'en-tête
 * du serveur, qui connaît le format réellement produit.
 */
export async function telecharger(chemin: string, params: object, nomParDefaut: string): Promise<void> {
  const jeton = getAuthToken();
  if (!jeton) throw new Error("Session expirée, reconnectez-vous");
  const reponse = await fetch(`${process.env.NEXT_PUBLIC_API_PREFIX}${chemin}${versQuery(params)}`, {
    headers: { Authorization: `Bearer ${jeton}` },
  });
  if (!reponse.ok) {
    const corps = await reponse.json().catch(() => ({}));
    throw new Error(
      reponse.status === 403 ? "Vous n'avez pas le droit d'exporter" : corps.message || `Export impossible (${reponse.status})`,
    );
  }
  const nom = /filename="([^"]+)"/.exec(reponse.headers.get("Content-Disposition") ?? "")?.[1] ?? nomParDefaut;
  const url = URL.createObjectURL(await reponse.blob());
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}
