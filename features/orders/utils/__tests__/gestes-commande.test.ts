import { describe, expect, it } from "bun:test";

import {
  distanceAuRestaurant,
  peutRecevoirCommande,
  sousTitreAffectation,
} from "../../../operations/utils/affectation-commande";
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

const SIEGE: ContexteGestes = { aLivrer: true, agirSurLivraison: true, surUneCourse: true };

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
    expect(gestes(OrderStatus.READY, UserRole.CAISSIER, { ...SIEGE, agirSurLivraison: false })).toEqual([]);
    expect(gestes(OrderStatus.READY, UserRole.CALL_CENTER, { ...SIEGE, aLivrer: false })).toEqual([]);
  });

  it("la liste des commandes ne les propose pas", () => {
    const liste = actionsCommande(OrderStatus.READY, droits(UserRole.ADMIN), "liste", SIEGE);
    expect(liste).not.toContain("terminer");
    expect(liste).not.toContain("affecter");
  });

  it("manager de ce restaurant : affecter et retirer, jamais terminer", () => {
    expect(gestes(OrderStatus.READY, UserRole.MANAGER, SIEGE)).toEqual(["affecter", "retirer"]);
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

describe("Affecter à un livreur : livreur d'un autre restaurant (10/11)", () => {
  const TEL = "+2250556440504";
  const faya = (distance_m: number | null) => ({
    phone: TEL,
    renfort: { restaurant_id: "r-faya", restaurant_name: "CHICKEN NATION FAYA", distance_m },
  });

  it("du restaurant : son téléphone, ou « La commande rejoint sa course »", () => {
    expect(sousTitreAffectation({ phone: TEL, renfort: null }, false)).toBe(TEL);
    expect(sousTitreAffectation({ phone: TEL }, true)).toBe("La commande rejoint sa course");
  });

  it("libre près du restaurant : son restaurant, sa distance et son téléphone", () => {
    expect(sousTitreAffectation(faya(480), false)).toBe(`Livreur de FAYA, à 500 m du restaurant · ${TEL}`);
    expect(sousTitreAffectation(faya(2340), false)).toBe(`Livreur de FAYA, à 2,3 km du restaurant · ${TEL}`);
  });

  it("déjà en course pour ce restaurant : la commande rejoint sa course", () => {
    expect(sousTitreAffectation(faya(null), true)).toBe("Livreur de FAYA · la commande rejoint sa course");
  });

  it("sans nom de restaurant, sans distance ni téléphone : rien d'inventé", () => {
    const anonyme = { phone: null, renfort: { restaurant_id: null, restaurant_name: null, distance_m: null } };
    expect(sousTitreAffectation(anonyme, false)).toBe("Livreur d'un autre restaurant");
  });

  it("distance lisible : arrondie à 100 m, au moins 100 m ; illisible : rien", () => {
    expect(distanceAuRestaurant(30)).toBe("à 100 m du restaurant");
    expect(distanceAuRestaurant(1000)).toBe("à 1,0 km du restaurant");
    expect(distanceAuRestaurant(null)).toBeNull();
    expect(distanceAuRestaurant(Number.NaN)).toBeNull();
  });
});
