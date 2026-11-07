import { describe, expect, it } from "bun:test";

import { peutRecevoirCommande } from "../../../operations/utils/affectation-commande";
import type { DisponibiliteLivreur } from "../../../livreurs/types/livreur.types";
import { UserRole } from "../../../users/types/user.types";
import { OrderStatus } from "../../types/order.types";
import { actionsCommande, type ContexteGestes, type DroitsCommande } from "../order-actions-rules";

const droits = (role: UserRole): DroitsCommande => ({
  role,
  peutLire: true,
  peutChangerStatut: true,
  peutModifier: true,
  peutSupprimer: false,
});

const gestes = (status: OrderStatus, role: UserRole, contexte: ContexteGestes = {}) =>
  actionsCommande(status, droits(role), "tiroir", contexte).filter((a) =>
    ["terminer", "affecter", "retirer"].includes(a),
  );

const SIEGE: ContexteGestes = { aLivrer: true, piloterCourses: true, surUneCourse: true };

describe("Terminer la commande : l'administrateur seul", () => {
  it.each([OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.READY, OrderStatus.PICKED_UP])(
    "%s : proposé",
    (status) => {
      expect(gestes(status, UserRole.ADMIN)).toContain("terminer");
      expect(gestes(status, UserRole.CALL_CENTER, SIEGE)).not.toContain("terminer");
    },
  );

  it("récupérée : proposé si elle est payée, sinon elle attend l'encaissement", () => {
    expect(gestes(OrderStatus.COLLECTED, UserRole.ADMIN, { payee: true })).toContain("terminer");
    expect(gestes(OrderStatus.COLLECTED, UserRole.ADMIN, { payee: false })).not.toContain("terminer");
  });

  it.each([OrderStatus.PENDING, OrderStatus.COMPLETED, OrderStatus.CANCELLED])("%s : jamais", (status) => {
    expect(gestes(status, UserRole.ADMIN, SIEGE)).toEqual([]);
  });
});

describe("Affecter et retirer : administrateur et call center", () => {
  it("commande prête dans une course : les deux", () => {
    expect(gestes(OrderStatus.READY, UserRole.CALL_CENTER, SIEGE)).toEqual(["affecter", "retirer"]);
    expect(gestes(OrderStatus.READY, UserRole.ADMIN, SIEGE)).toEqual(["terminer", "affecter", "retirer"]);
  });

  it("commande prête sans course : affecter seulement", () => {
    expect(gestes(OrderStatus.READY, UserRole.CALL_CENTER, { ...SIEGE, surUneCourse: false })).toEqual(["affecter"]);
  });

  it("en préparation : pas d'affectation, retrait si elle est dans une course", () => {
    expect(gestes(OrderStatus.IN_PROGRESS, UserRole.CALL_CENTER, SIEGE)).toEqual(["retirer"]);
  });

  it("sac déjà remis : ni l'un ni l'autre", () => {
    expect(gestes(OrderStatus.PICKED_UP, UserRole.CALL_CENTER, SIEGE)).toEqual([]);
  });

  it("sans le droit, ou commande à emporter : rien", () => {
    expect(gestes(OrderStatus.READY, UserRole.CAISSIER, { ...SIEGE, piloterCourses: false })).toEqual([]);
    expect(gestes(OrderStatus.READY, UserRole.CALL_CENTER, { ...SIEGE, aLivrer: false })).toEqual([]);
  });

  it("la liste des commandes ne les propose pas", () => {
    const liste = actionsCommande(OrderStatus.READY, droits(UserRole.ADMIN), "liste", SIEGE);
    expect(liste).not.toContain("terminer");
    expect(liste).not.toContain("affecter");
  });

  it("dans le menu : après Modifier, avant ce qui détruit", () => {
    const admin = { ...droits(UserRole.ADMIN), peutSupprimer: true };
    expect(actionsCommande(OrderStatus.READY, admin, "tiroir", SIEGE)).toEqual([
      "modifier",
      "terminer",
      "affecter",
      "retirer",
      "supprimer",
    ]);
  });
});

describe("Qui peut recevoir la commande", () => {
  const dispo = (s: Partial<DisponibiliteLivreur>) =>
    ({ etat: "DISPONIBLE", en_course: false, ...s }) as DisponibiliteLivreur;

  it("en course : toujours, même en pause ; inactif : jamais", () => {
    expect(peutRecevoirCommande(dispo({ etat: "EN_COURSE", en_course: true }))).toBe(true);
    expect(peutRecevoirCommande(dispo({ etat: "EN_PAUSE", en_course: true }))).toBe(true);
    expect(peutRecevoirCommande(dispo({ etat: "INACTIF", en_course: true }))).toBe(false);
  });

  it.each(["EN_PAUSE", "PAUSE_AUTO", "HORS_SERVICE", "INJOIGNABLE", "INACTIF"] as const)(
    "sans course, %s : refusé",
    (etat) => {
      expect(peutRecevoirCommande(dispo({ etat }))).toBe(false);
    },
  );

  it.each(["DISPONIBLE", "OFFRE_EN_ATTENTE", "EN_APPEL", "APPLI_FERMEE", "CONNEXION_COUPEE"] as const)(
    "sans course, %s : permis, la notification part",
    (etat) => {
      expect(peutRecevoirCommande(dispo({ etat }))).toBe(true);
    },
  );

  it("état inconnu (serveur plus ancien) : le serveur tranche", () => {
    expect(peutRecevoirCommande(null)).toBe(true);
  });
});
