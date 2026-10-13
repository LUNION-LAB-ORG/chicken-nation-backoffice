import { Award, Calendar, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { CustomerMapperData } from "../../types/customer-mapper.types";
import { BoutonCopier } from "@/components/ui/BoutonCopier";
import { numeroACopier } from "@/utils/telephone";

interface ClientHeaderProps {
  customerData: CustomerMapperData;
}

const STATUT = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Nouveau: "bg-sky-50 text-sky-700 border-sky-200",
  Supprimé: "bg-rose-50 text-rose-700 border-rose-200",
} as const;


/**
 * Identité du client, puis ses quatre chiffres.
 *
 * ⚠️ PLUS DE BANNIÈRE. L'ancienne version empilait une bande orange de 128 px
 * et un avatar de 128 px qui débordait dessus, soit un tiers de la fenêtre
 * avant la première information utile — dans une MODALE, qui plus est. Pire :
 * le nom et les coordonnées étaient en `text-white`, donc l'email et le
 * téléphone passaient en blanc sur blanc dès qu'ils tombaient sous la bande.
 * Ils étaient invisibles.
 *
 * ⚠️ Les chiffres ont changé. « Points fidélité » et « Favoris » étaient deux
 * des quatre titres, alors que les points sont déjà dans la pastille de niveau
 * et que les favoris ont leur onglet — on lisait « 0 Favoris » en gros. À leur
 * place, le PANIER MOYEN et la DERNIÈRE COMMANDE, qui répondent aux deux
 * questions qu'on se pose vraiment : combien dépense-t-il, et est-il encore là.
 */
export function ClientHeader({ customerData }: ClientHeaderProps) {
  const initiales = customerData.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {customerData.image ? (
              <Image
                src={customerData.image}
                alt={customerData.fullName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F17922] text-lg font-bold text-white">
                {initiales}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-gray-900">
                {customerData.fullName}
              </h2>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                  STATUT[customerData.status as keyof typeof STATUT] ??
                  "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                {customerData.status}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F17922]/30 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#8A4B00]">
                <Award className="h-3.5 w-3.5" />
                {customerData.loyaltyLevel}
                <span className="font-normal text-[#A9683A]">
                  · {customerData.stats.loyaltyPoints} pts
                </span>
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600">
              {customerData.phone && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {customerData.phone}
                  <BoutonCopier
                    valeur={numeroACopier(customerData.phone)}
                    titre="Copier le numéro"
                  />
                </span>
              )}
              {customerData.email && (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{customerData.email}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-gray-500">
                <Calendar className="h-4 w-4 text-gray-400" />
                Client depuis {customerData.memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
