// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from "bun:test";

import { arretsDeLaCourse, toLatLng } from "../arrets-course";

const livraison = (id, rang, address) => ({ id, sequence_order: rang, order: { reference: `ORD-${id}`, address } });

describe("arretsDeLaCourse", () => {
  test("adresse en texte JSON, comme le serveur la renvoie : l'arrêt est sur la carte", () => {
    const texte = JSON.stringify({ title: "Maison", address: "Riviera 2", latitude: 5.3622, longitude: -3.9576 });
    expect(arretsDeLaCourse([livraison("a", 1, texte)])).toEqual({
      stops: [{ id: "a", index: 1, lat: 5.3622, lng: -3.9576, label: "ORD-a" }],
      invalidCount: 0,
    });
  });

  test("adresse en objet, ordre de la tournée, adresse sans coordonnées comptée à part", () => {
    const r = arretsDeLaCourse([
      livraison("b", 2, { latitude: "5.30", longitude: "-3.97" }),
      livraison("a", 1, { latitude: 5.29, longitude: -3.96 }),
      livraison("c", 3, "Rue sans coordonnées"),
      livraison("d", 4, null),
    ]);
    expect(r.stops.map((s) => s.id)).toEqual(["a", "b"]);
    expect(r.stops[1]).toMatchObject({ lat: 5.3, lng: -3.97 });
    expect(r.invalidCount).toBe(2);
  });
});

describe("toLatLng", () => {
  test("nombres finis dans les bornes seulement", () => {
    expect(toLatLng(5.3, -3.9)).toEqual({ lat: 5.3, lng: -3.9 });
    expect(toLatLng(null, -3.9)).toBeNull();
    expect(toLatLng(Number.NaN, 1)).toBeNull();
    expect(toLatLng(95, 1)).toBeNull();
  });
});
