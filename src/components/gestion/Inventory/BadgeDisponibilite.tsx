"use client";

/**
 * Disponibilité d'un produit, en lecture. Remplace l'interrupteur pour un
 * profil qui ne peut pas la changer : masquer l'interrupteur sans rien mettre
 * à sa place ferait disparaître l'information.
 */
export default function BadgeDisponibilite({
  disponible,
}: {
  disponible: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
        disponible ? "bg-[#FFF6E9] text-[#F17922]" : "bg-gray-100 text-gray-500"
      }`}
    >
      {disponible ? "Disponible" : "Indisponible"}
    </span>
  );
}
