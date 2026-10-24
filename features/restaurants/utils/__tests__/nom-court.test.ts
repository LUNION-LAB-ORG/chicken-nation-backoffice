// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from "bun:test";

import { nomCourtRestaurant } from "../nom-court";

describe("nomCourtRestaurant", () => {
  test("retire le nom de la marque en tête", () => {
    expect(nomCourtRestaurant("CHICKEN NATION ZONE 4")).toBe("ZONE 4");
    expect(nomCourtRestaurant("CHICKEN NATION ANGRÉ")).toBe("ANGRÉ");
    expect(nomCourtRestaurant("Chicken Nation Riviera")).toBe("Riviera");
    expect(nomCourtRestaurant("  chicken  nation - Marcory ")).toBe("Marcory");
  });

  test("garde un nom sans le préfixe", () => {
    expect(nomCourtRestaurant("Angré")).toBe("Angré");
    expect(nomCourtRestaurant("Restaurant Chicken Nation Zone 4")).toBe("Restaurant Chicken Nation Zone 4");
    expect(nomCourtRestaurant("CHICKEN NATIONAL")).toBe("CHICKEN NATIONAL");
  });

  test("garde le nom entier quand il n'y a que la marque", () => {
    expect(nomCourtRestaurant("CHICKEN NATION")).toBe("CHICKEN NATION");
    expect(nomCourtRestaurant("Chicken Nation ")).toBe("Chicken Nation");
  });

  test("rien sans nom", () => {
    expect(nomCourtRestaurant(null)).toBeNull();
    expect(nomCourtRestaurant(undefined)).toBeNull();
    expect(nomCourtRestaurant("   ")).toBeNull();
  });
});
