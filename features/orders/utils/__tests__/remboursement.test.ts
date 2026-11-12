import { describe, expect, it } from "bun:test";
import { estRemboursable, formatMontant, messageErreurRemboursement, peutRembourser, texteRembourse } from "../remboursement";

describe("remboursement : qui voit le bouton", () => {
  it("l'administrateur partout, le manager sur son restaurant", () => {
    expect(peutRembourser({ role: "ADMIN", type: "BACKOFFICE" }, "r-1")).toBe(true);
    expect(peutRembourser({ role: "MANAGER", type: "RESTAURANT", restaurant_id: "r-1" }, "r-1")).toBe(true);
    expect(peutRembourser({ role: "MANAGER", type: "RESTAURANT", restaurant_id: "r-1" }, "r-2")).toBe(false);
  });

  it("personne d'autre", () => {
    for (const role of ["ASSISTANT_MANAGER", "CAISSIER", "CALL_CENTER", "MARKETING", "COMPTABLE"]) {
      expect(peutRembourser({ role, type: "RESTAURANT", restaurant_id: "r-1" }, "r-1")).toBe(false);
    }
    expect(peutRembourser(null, "r-1")).toBe(false);
  });
});

describe("remboursement : sur quels paiements", () => {
  it("un paiement KKiaPay réussi", () => {
    expect(estRemboursable({ status: "SUCCESS", mode: "WALLET", reference: "459100796371" })).toBe(true);
  });

  it("ni un encaissement saisi à la main, ni des espèces, ni un paiement déjà remboursé", () => {
    expect(estRemboursable({ status: "SUCCESS", mode: "MOBILE_MONEY", reference: "PAY-1762900000000-12" })).toBe(false);
    expect(estRemboursable({ status: "SUCCESS", mode: "CASH", reference: "459100796371" })).toBe(false);
    expect(estRemboursable({ status: "REVERTED", mode: "WALLET", reference: "459100796371" })).toBe(false);
    expect(estRemboursable({ status: "SUCCESS", mode: "WALLET", reference: "" })).toBe(false);
  });
});

describe("remboursement : mots", () => {
  it("montants et ligne « Remboursé »", () => {
    expect(formatMontant(6060)).toBe("6.060 F");
    expect(texteRembourse({ rembourse_at: null })).toBe("Remboursé");
    expect(texteRembourse({ rembourse_at: "2026-11-12T10:20:00", rembourse_par_nom: "Mariam" })).toBe("Remboursé le 12/11 à 10 h 20 par Mariam");
  });

  it("le message du serveur passe, pas le texte technique", () => {
    expect(messageErreurRemboursement({ message: "Erreur temporaire du serveur.", messageServeur: "KKiaPay ne répond pas. Réessayez dans un instant." })).toBe(
      "KKiaPay ne répond pas. Réessayez dans un instant.",
    );
    expect(messageErreurRemboursement({ message: "Internal server error" })).toBe("Une erreur est survenue. Réessayez.");
    expect(messageErreurRemboursement({ message: "KKiaPay refuse : il ne trouve pas cette transaction." })).toBe(
      "KKiaPay refuse : il ne trouve pas cette transaction.",
    );
  });
});
