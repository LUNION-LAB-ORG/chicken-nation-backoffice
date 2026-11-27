/**
 * Recherche d'une commande (27/11) : lecture de la saisie, et filtre sur
 * place de l'onglet « À relancer », avec les mêmes repères que le serveur.
 * Lancer : `bun test features/orders/utils/__tests__/recherche-commande.test.ts`
 */
import { describe, expect, it } from "bun:test";
import {
  commandeCorrespond,
  lireRecherche,
  reperesDeBrouillon,
  type ReperesCommande,
} from "../recherche-commande";

const commande: ReperesCommande = {
  reference: "ORD-261127-48213",
  noms: ["Awa Koné", "Kone Awa"],
  telephones: ["+2250707070707"],
  emails: ["awa@exemple.ci", null],
  note: "Commande pour Marc Yao, 05 44 33 22 11",
  codes: ["NOEL25", "kk-8f3a21"],
};

const trouve = (saisie: string) => commandeCorrespond(commande, lireRecherche(saisie));

describe("lireRecherche", () => {
  it("resserre la saisie et retire le « # » de tête", () => {
    expect(lireRecherche("  Awa   Koné ")).toBe("Awa Koné");
    expect(lireRecherche("#ORD-261127")).toBe("ORD-261127");
  });

  it("rien en dessous de deux caractères", () => {
    expect(lireRecherche("a")).toBe("");
    expect(lireRecherche(undefined)).toBe("");
  });
});

describe("commandeCorrespond", () => {
  it("sans saisie, tout correspond", () => {
    expect(commandeCorrespond(commande, "")).toBe(true);
  });

  it("par la référence, en partie, sans tenir compte de la casse", () => {
    expect(trouve("ord-261127")).toBe(true);
    expect(trouve("48213")).toBe(true);
    expect(trouve("ORD-999")).toBe(false);
  });

  it("par le nom du client, accents et ordre des mots ignorés", () => {
    expect(trouve("kone")).toBe(true);
    expect(trouve("Koné Awa")).toBe(true);
    expect(trouve("awa kone")).toBe(true);
    expect(trouve("awa traore")).toBe(false);
  });

  it("par la personne pour qui la commande est passée (note)", () => {
    expect(trouve("marc yao")).toBe(true);
    expect(trouve("05 44 33 22 11")).toBe(true);
    expect(trouve("0544332211")).toBe(true);
  });

  it("par le numéro, sous toutes ses écritures, ou une partie", () => {
    expect(trouve("0707070707")).toBe(true);
    expect(trouve("07 07 07 07 07")).toBe(true);
    expect(trouve("+225 07 07 07 07 07")).toBe(true);
    expect(trouve("002250707070707")).toBe(true);
    expect(trouve("7070")).toBe(true);
    expect(trouve("0102030405")).toBe(false);
  });

  it("trois chiffres ne désignent pas un numéro", () => {
    expect(trouve("070")).toBe(false);
  });

  it("par l'adresse électronique quand la saisie contient « @ »", () => {
    expect(trouve("awa@exemple")).toBe(true);
    expect(trouve("exemple.ci")).toBe(false);
  });

  it("code promo et référence de paiement : en entier seulement", () => {
    expect(trouve("noel25")).toBe(true);
    expect(trouve("kk-8f3a21")).toBe(true);
    expect(trouve("noel")).toBe(false);
  });

  it("un numéro masqué (rôle marketing) ne se laisse pas deviner", () => {
    const masquee: ReperesCommande = { reference: "ORD-1", telephones: ["+225•••••••07"] };
    expect(commandeCorrespond(masquee, lireRecherche("0707"))).toBe(false);
  });
});

describe("reperesDeBrouillon", () => {
  const panier = reperesDeBrouillon({ reference: "ORD-261127-10001", client_nom: "Yao Marc", telephone: "+2250544332211" });

  it("un panier à relancer se retrouve par nom, numéro ou référence", () => {
    expect(commandeCorrespond(panier, lireRecherche("marc"))).toBe(true);
    expect(commandeCorrespond(panier, lireRecherche("05 44 33 22 11"))).toBe(true);
    expect(commandeCorrespond(panier, lireRecherche("10001"))).toBe(true);
    expect(commandeCorrespond(panier, lireRecherche("awa"))).toBe(false);
  });
});
