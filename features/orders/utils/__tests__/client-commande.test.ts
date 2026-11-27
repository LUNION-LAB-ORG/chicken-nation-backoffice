import { describe, expect, it } from "bun:test";
import {
  changeDeClient,
  clientAuNumero,
  etatClientCommande,
  ficheClient,
  memeNumero,
  numeroCanonique,
  prenomEtNom,
  rechercheDuNumero,
} from "../client-commande";

// Lancer : `bun test ./features/orders/utils/__tests__/client-commande.test.ts`

const ange = { id: "c1", fullname: "GNAGNE ANGE JUNIAS", phone: "+2250500968284", email: "" };

describe("memeNumero", () => {
  it("reconnaît le même numéro écrit autrement", () => {
    expect(memeNumero("+2250500968284", "05 00 96 82 84")).toBe(true);
    expect(memeNumero("+225 05 00 96 82 84", "002250500968284")).toBe(true);
  });

  it("distingue deux numéros", () => {
    expect(memeNumero("+2250500968284", "+2250707070707")).toBe(false);
  });

  it("un numéro vide ou incomplet n'est le même que lui-même", () => {
    expect(memeNumero("", "")).toBe(false);
    expect(memeNumero("0500", "0500")).toBe(true);
    expect(memeNumero("0500", "+2250500968284")).toBe(false);
  });
});

describe("etatClientCommande", () => {
  it("même numéro, autre nom : c'est toujours le client rattaché", () => {
    expect(etatClientCommande({ fullname: "Junior", phone: "0500968284" }, ange)).toEqual({
      etat: "rattache",
      client: ange,
    });
  });

  it("autre numéro : autre client, avec le numéro à chercher", () => {
    expect(etatClientCommande({ fullname: "Awa Koné", phone: "07 07 07 07 07" }, ange)).toEqual({
      etat: "autre",
      telephone: "+2250707070707",
    });
  });

  it("numéro encore incomplet : autre client, rien à chercher pour l'instant", () => {
    expect(etatClientCommande({ fullname: "Awa", phone: "0707" }, ange)).toEqual({
      etat: "autre",
      telephone: null,
    });
  });

  it("sans client rattaché : vide tant que rien n'est saisi, autre client ensuite", () => {
    expect(etatClientCommande({ fullname: "", phone: "", email: "" }, null)).toEqual({ etat: "vide" });
    expect(etatClientCommande({ fullname: "Awa" }, null)).toEqual({ etat: "autre", telephone: null });
  });

  it("fiche vidée d'un client rattaché : vide, pas un nouveau client", () => {
    expect(etatClientCommande({ fullname: "", phone: "", email: "" }, ange)).toEqual({ etat: "vide" });
  });
});

describe("clientAuNumero", () => {
  const trouves = [
    { id: "a", phone: "+22505009682849" },
    { id: "b", phone: "+2250500968284" },
  ];

  it("garde le client qui porte exactement le numéro", () => {
    expect(clientAuNumero(trouves, "0500968284")?.id).toBe("b");
  });

  it("aucun client à ce numéro", () => {
    expect(clientAuNumero(trouves, "0707070707")).toBeNull();
    expect(clientAuNumero(undefined, "0707070707")).toBeNull();
  });
});

describe("changeDeClient", () => {
  const awa = { id: "c2", fullname: "Awa Koné", phone: "+2250707070707", email: "" };

  it("faux à la création, et tant que le client d'origine reste rattaché", () => {
    expect(changeDeClient(null, awa, false)).toBe(false);
    expect(changeDeClient(ange, ange, false)).toBe(false);
  });

  it("vrai pour un autre client connu ou un nouveau client", () => {
    expect(changeDeClient(ange, awa, false)).toBe(true);
    expect(changeDeClient(ange, null, true)).toBe(true);
  });

  it("faux quand la fiche est seulement vidée", () => {
    expect(changeDeClient(ange, null, false)).toBe(false);
  });
});

describe("fiche, recherche et nom", () => {
  it("fiche d'un client du serveur, sans « null » dans le nom", () => {
    expect(ficheClient({ id: "c3", phone: "+2250101010101", first_name: null, last_name: "Koné", email: null })).toEqual({
      id: "c3",
      fullname: "Koné",
      phone: "+2250101010101",
      email: "",
    });
  });

  it("cherche les chiffres du numéro, sans le plus", () => {
    expect(rechercheDuNumero(numeroCanonique("05 00 96 82 84")!)).toBe("2250500968284");
  });

  it("prénom puis nom", () => {
    expect(prenomEtNom("  Awa   Koné Traoré ")).toEqual({ first_name: "Awa", last_name: "Koné Traoré" });
    expect(prenomEtNom("Awa")).toEqual({ first_name: "Awa", last_name: "" });
    expect(prenomEtNom("")).toEqual({ first_name: "", last_name: "" });
  });
});
