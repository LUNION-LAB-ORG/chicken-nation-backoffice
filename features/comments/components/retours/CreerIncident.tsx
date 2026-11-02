import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useTicketCategoriesQuery } from "@/hooks/useTicketCategoriesQuery";
import type { TicketCategory } from "@/services/ticketCategoryService";
import { useTicketAvisMutation } from "../../queries/avis-prive.mutation";
import type { AvisFiche } from "../../types/avis-prive.types";
import { formatRecu } from "../../utils/avis-prive";
import { ChampListe } from "./Elements";

/**
 * « Créer un incident » : ouvre un ticket du module Messages et tickets,
 * rattaché au client et à la commande cochée. Le serveur y met le commentaire
 * en message interne et passe l'avis en « Incident ouvert ».
 */
export function CreerIncident({ avis, ouvert, onFermer }: { avis: AvisFiche; ouvert: boolean; onFermer: () => void }) {
  const { data, isLoading } = useTicketCategoriesQuery({ status: "ACTIVE", limit: 100 }, ouvert);
  // Le serveur rend un tableau ; d'anciennes versions, une page `{ data }`.
  const categories = useMemo<TicketCategory[]>(
    () => (Array.isArray(data) ? data : ((data as { data?: TicketCategory[] } | undefined)?.data ?? [])),
    [data],
  );
  const [choix, setChoix] = useState("");
  const mutation = useTicketAvisMutation();
  // Une seule catégorie : elle est présélectionnée.
  const categorie = choix || (categories.length === 1 ? categories[0].id : "");

  const commande = avis.dernieres_commandes?.find((c) => c.id === avis.order_id) ?? null;

  const creer = () => {
    if (!categorie) return;
    mutation.mutate({ id: avis.id, valeur: categorie }, { onSuccess: onFermer });
  };

  return (
    <Modal isOpen={ouvert} onClose={onFermer} title="Créer un incident">
      <div className="flex flex-col gap-4 p-1">
        <ChampListe
          label="Catégorie"
          valeur={categorie}
          onChange={setChoix}
          vide="Choisir"
          options={categories.map((c) => ({ valeur: c.id, libelle: c.name }))}
          desactive={isLoading}
        />
        <div className="text-xs font-medium text-gray-500">
          Commande
          <div className="mt-1 text-sm font-semibold text-gray-900">
            {commande ? `${commande.reference} · ${formatRecu(commande.created_at)}` : "Commande cochée"}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onFermer}
            className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={creer}
            disabled={!categorie || mutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F17922] px-4 text-sm font-semibold text-white hover:bg-[#e06a15] disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Créer le ticket
          </button>
        </div>
      </div>
    </Modal>
  );
}
