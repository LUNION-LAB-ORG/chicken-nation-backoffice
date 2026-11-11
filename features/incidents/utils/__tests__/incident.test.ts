import { describe, expect, it } from "bun:test";
import type { IncidentLigne } from "../../types/incident.types";
import {
  cibleNotificationIncident,
  doublonOuvert,
  dureeEnMots,
  estDoublon,
  estSiegeIncidents,
  filtresNets,
  finDeReference,
  formatMontant,
  graviteDepuisNote,
  graviteDepuisRessenti,
  lienTelephone,
  manqueALaCloture,
  manqueALaResolution,
  manqueAuSignalement,
  messageErreurIncident,
  origineImposee,
  pastilleIncidents,
  peutReglerIncidents,
  peutSignalerIncident,
  peutVoirIncidents,
  telephoneLisible,
  texteDelai,
  texteTempsCarte,
} from "../incident";

const ligne = (p: Partial<IncidentLigne> = {}): IncidentLigne => ({
  id: "i-1",
  code: "INC-261111-001",
  statut: "OUVERT",
  gravite: "MOYENNE",
  origine: "APPEL",
  pole: "RESTAURANT",
  categorie: { id: "cat-qualite", nom: "Qualité du plat" },
  extrait: "Poulet servi tiède.",
  commande: { id: "o-1", reference: "ORD-261110-50950" },
  restaurant: { id: "r-1", name: "Angré" },
  client: { id: "c-1", nom: "Awa Koné", telephone: "+2250707000001" },
  agent: null,
  geste: null,
  bon_montant: null,
  echeance_at: "2026-11-12T10:00:00.000Z",
  en_retard: false,
  created_at: "2026-11-11T10:00:00.000Z",
  resolu_at: null,
  cloture_at: null,
  ...p,
});

describe("incidents : qui voit le module", () => {
  it("suit les listes de rôles du serveur", () => {
    for (const role of ["ADMIN", "CALL_CENTER", "MARKETING", "LIVRAISON_OPS", "MANAGER", "ASSISTANT_MANAGER", "CAISSIER"]) {
      expect(peutVoirIncidents({ role })).toBe(true);
    }
    expect(peutVoirIncidents({ role: "COMPTABLE" })).toBe(false);
    expect(peutVoirIncidents({ role: "CUISINE" })).toBe(false);
    expect(peutVoirIncidents(null)).toBe(false);
  });

  it("signalent ceux qui prennent ou servent les commandes ; le siège traite partout", () => {
    expect(peutSignalerIncident({ role: "CAISSIER" })).toBe(true);
    expect(peutSignalerIncident({ role: "MARKETING" })).toBe(false);
    expect(peutSignalerIncident({ role: "LIVRAISON_OPS" })).toBe(false);
    expect(estSiegeIncidents({ role: "CALL_CENTER", type: "BACKOFFICE" })).toBe(true);
    expect(estSiegeIncidents({ role: "CALL_CENTER", type: "RESTAURANT" })).toBe(false);
    expect(estSiegeIncidents({ role: "MANAGER", type: "RESTAURANT" })).toBe(false);
    expect(peutReglerIncidents({ role: "ADMIN" })).toBe(true);
    expect(peutReglerIncidents({ role: "CALL_CENTER" })).toBe(false);
  });
});

describe("incidents : le temps en toutes lettres", () => {
  const maintenant = new Date("2026-11-12T13:00:00.000Z");

  it("dit le retard, sinon l'échéance", () => {
    expect(texteDelai(ligne(), maintenant)).toEqual({ texte: "en retard de 3 h", retard: true });
    const aTemps = texteDelai(ligne({ echeance_at: "2026-11-13T10:00:00.000Z" }), maintenant);
    expect(aTemps?.retard).toBe(false);
    expect(aTemps?.texte.startsWith("à résoudre avant le ")).toBe(true);
    expect(texteDelai(ligne({ statut: "RESOLU" }), maintenant)).toBeNull();
  });

  it("une carte résolue dit depuis quand, une carte clôturée dit quand", () => {
    expect(texteTempsCarte(ligne({ statut: "RESOLU", resolu_at: "2026-11-12T11:00:00.000Z" }), maintenant).texte).toBe(
      "résolu depuis 2 h",
    );
    expect(
      texteTempsCarte(ligne({ statut: "CLOTURE", cloture_at: "2026-11-12T11:00:00.000Z" }), maintenant).texte.startsWith(
        "clôturé le ",
      ),
    ).toBe(true);
  });

  it("donne l'ordre de grandeur d'une durée", () => {
    expect(dureeEnMots(20_000)).toBe("moins d'une minute");
    expect(dureeEnMots(45 * 60_000)).toBe("45 min");
    expect(dureeEnMots(3 * 3_600_000)).toBe("3 h");
    expect(dureeEnMots(47 * 3_600_000)).toBe("47 h");
    expect(dureeEnMots(72 * 3_600_000)).toBe("3 j");
  });
});

describe("incidents : montants, références, numéros", () => {
  it("écrit les montants comme le reste du back-office", () => {
    expect(formatMontant(2000)).toBe("2.000 F");
    expect(formatMontant(500)).toBe("500 F");
    expect(formatMontant(null)).toBe("0 F");
  });

  it("abrège une référence et espace un numéro", () => {
    expect(finDeReference("ORD-261110-50950")).toBe("…50950");
    expect(finDeReference("50950")).toBe("50950");
    expect(telephoneLisible("+2250707000001")).toBe("07 07 00 00 01");
    expect(telephoneLisible("+225•••••••01")).toBe("+225•••••••01");
    expect(telephoneLisible(null)).toBe("");
  });

  it("n'appelle pas un numéro masqué", () => {
    expect(lienTelephone("+2250707000001")).toBe("tel:+2250707000001");
    expect(lienTelephone("+225•••••••01")).toBeNull();
    expect(lienTelephone(null)).toBeNull();
  });
});

describe("incidents : signaler", () => {
  it("propose une gravité selon la note ou le ressenti", () => {
    expect(graviteDepuisNote(1)).toBe("HAUTE");
    expect(graviteDepuisNote(2)).toBe("MOYENNE");
    expect(graviteDepuisNote(3)).toBe("FAIBLE");
    expect(graviteDepuisRessenti("PAS_CONTENT")).toBe("HAUTE");
    expect(graviteDepuisRessenti("PEUT_MIEUX_FAIRE")).toBe("MOYENNE");
  });

  it("l'origine suit le lien quand il y en a un", () => {
    expect(origineImposee({ ticketId: "t" })).toBe("TICKET");
    expect(origineImposee({ avisId: "a" })).toBe("AVIS");
    expect(origineImposee({ commentId: "n" })).toBe("NOTE");
    expect(origineImposee({ orderId: "o" })).toBeNull();
    expect(origineImposee(null)).toBeNull();
  });

  it("repère l'incident déjà ouvert de la même catégorie", () => {
    const incidents = [ligne({ id: "ferme", statut: "CLOTURE" }), ligne({ id: "ouvert", statut: "RESOLU" })];
    expect(doublonOuvert(incidents, "cat-qualite")?.id).toBe("ouvert");
    expect(doublonOuvert(incidents, "cat-retard")).toBeNull();
    expect(doublonOuvert([ligne({ statut: "CLOTURE" })], "cat-qualite")).toBeNull();
    expect(doublonOuvert(undefined, "cat-qualite")).toBeNull();
    expect(doublonOuvert(incidents, "")).toBeNull();
  });

  it("dit ce qui manque, dans l'ordre de la fenêtre", () => {
    const vide = { orderId: "", categorieId: "", gravite: "" as const, origine: "" as const, description: "" };
    expect(manqueAuSignalement(vide, null)).toBe("Choisissez la commande.");
    expect(manqueAuSignalement({ ...vide, orderId: "o" }, null)).toBe("Choisissez la catégorie.");
    expect(manqueAuSignalement({ ...vide, orderId: "o", categorieId: "c" }, null)).toBe("Choisissez la gravité.");
    const presque = { ...vide, orderId: "o", categorieId: "c", gravite: "HAUTE" as const };
    expect(manqueAuSignalement(presque, null)).toBe("Indiquez l'origine du signalement.");
    // Lien : l'origine n'est pas demandée.
    expect(manqueAuSignalement(presque, "TICKET")).toBe("Décrivez le problème.");
    expect(manqueAuSignalement({ ...presque, origine: "APPEL", description: "Plat tiède" }, null)).toBeNull();
  });
});

describe("incidents : résoudre et clôturer", () => {
  it("résoudre demande la cause, l'action, le geste, et le montant d'un bon", () => {
    const base = { cause: "Oubli", action: "Liste de contrôle", geste: "EXCUSES" as const, bonMontant: null, bonExistant: false };
    expect(manqueALaResolution({ ...base, cause: " " })).toBe("Indiquez la cause.");
    expect(manqueALaResolution({ ...base, action: "ok" })).toBe("Indiquez l'action corrective.");
    expect(manqueALaResolution({ ...base, geste: "" })).toBe("Choisissez le geste pour le client.");
    expect(manqueALaResolution({ ...base, geste: "BON" })).toBe("Choisissez le montant du bon.");
    expect(manqueALaResolution({ ...base, geste: "BON", bonMontant: 2000 })).toBeNull();
    // Le bon existe déjà : rien à choisir.
    expect(manqueALaResolution({ ...base, geste: "BON", bonExistant: true })).toBeNull();
    expect(manqueALaResolution(base)).toBeNull();
  });

  it("clôturer demande le recontact, et la réaction d'un client informé", () => {
    expect(manqueALaCloture({ recontact: "", reaction: "" })).toBe("Indiquez si le client a été informé.");
    expect(manqueALaCloture({ recontact: "INFORME", reaction: " " })).toBe("Notez la réaction du client.");
    expect(manqueALaCloture({ recontact: "INFORME", reaction: "Satisfait" })).toBeNull();
    expect(manqueALaCloture({ recontact: "INJOIGNABLE", reaction: "" })).toBeNull();
  });
});

describe("incidents : filtres, cloche, erreurs", () => {
  it("retire les filtres vides", () => {
    expect(filtresNets({ restaurantId: "", pole: "LIVRAISON", recherche: "  " })).toEqual({ pole: "LIVRAISON" });
    expect(filtresNets({ recherche: " koné ", page: 2 })).toEqual({ recherche: "koné", page: 2 });
  });

  it("reconnaît une notification d'incident et rien d'autre", () => {
    expect(cibleNotificationIncident({ kind: "incident", incident_id: "i-1" })).toBe("i-1");
    expect(cibleNotificationIncident({ kind: "avis", avis_id: "a-1" })).toBeNull();
    expect(cibleNotificationIncident({ kind: "incident" })).toBeNull();
    expect(cibleNotificationIncident(null)).toBeNull();
  });

  it("la pastille compte les incidents que personne n'a pris", () => {
    expect(pastilleIncidents({ ouverts: 3 })).toBe(3);
    expect(pastilleIncidents({ ouverts: 0 })).toBeUndefined();
    expect(pastilleIncidents(undefined)).toBeUndefined();
  });

  it("rend le message du serveur quand il est écrit pour l'utilisateur", () => {
    expect(messageErreurIncident({ message: "Erreur temporaire du serveur.", messageServeur: "Le SMS n'est pas parti. Dictez le code au client." })).toBe(
      "Le SMS n'est pas parti. Dictez le code au client.",
    );
    expect(messageErreurIncident({ message: ["Choisissez la gravité.", "Décrivez le problème."] })).toBe(
      "Choisissez la gravité. Décrivez le problème.",
    );
    expect(messageErreurIncident({ message: "Internal server error" })).toBe("Une erreur est survenue. Réessayez.");
    expect(messageErreurIncident(null)).toBe("Une erreur est survenue. Réessayez.");
    expect(estDoublon({ code: "INCIDENT_DOUBLON" })).toBe(true);
    expect(estDoublon({ code: "AUTRE" })).toBe(false);
  });
});
