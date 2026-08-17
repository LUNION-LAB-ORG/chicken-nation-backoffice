"use client";

import Modal from "@/components/ui/Modal";
import {
  getSupplementsOfCategory,
  reorderSupplements,
  Supplement,
} from "@/services/supplementService";
import { formatImageUrl } from "@/utils/imageHelpers";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, GripVertical, Loader2 } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type Categorie = "FOOD" | "DRINK" | "ACCESSORY";

const LIBELLE: Record<Categorie, string> = {
  FOOD: "Sauces",
  DRINK: "Boissons",
  ACCESSORY: "Suppléments",
};

/**
 * Ordre d'affichage des suppléments dans l'application cliente.
 *
 * Le classement est propre à chaque catégorie : ranger les boissons ne touche
 * pas aux sauces. La liste est chargée entière, sans pagination, parce qu'un
 * classement page par page ne permettrait jamais de faire remonter un
 * supplément depuis la fin.
 *
 * Deux façons de déplacer : le glisser-déposer à la souris, et les flèches.
 * Les flèches ne sont pas un ornement, ce sont elles qui rendent l'écran
 * utilisable au pavé tactile et sur une tablette.
 */
export default function ReorderSupplementsModal({
  isOpen,
  onClose,
  categorie,
}: {
  isOpen: boolean;
  onClose: () => void;
  categorie: Categorie;
}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Supplement[]>([]);
  const [chargement, setChargement] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modifie, setModifie] = useState(false);
  const [glisse, setGlisse] = useState<number | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const liste = await getSupplementsOfCategory(categorie);
      setItems(Array.isArray(liste) ? liste : []);
      setModifie(false);
    } catch {
      setErreur("Impossible de charger les suppléments de cette catégorie.");
    } finally {
      setChargement(false);
    }
  }, [categorie]);

  useEffect(() => {
    if (isOpen) charger();
  }, [isOpen, charger]);

  const deplacer = (depuis: number, vers: number) => {
    if (vers < 0 || vers >= items.length || depuis === vers) return;
    setItems((liste) => {
      const copie = [...liste];
      const [element] = copie.splice(depuis, 1);
      copie.splice(vers, 0, element);
      return copie;
    });
    setModifie(true);
  };

  const enregistrer = async () => {
    if (!modifie || enregistrement) return;
    setEnregistrement(true);
    try {
      await reorderSupplements(items.map((i) => i.id));
      // Les suppléments voyagent avec le détail des plats : sans invalidation,
      // la prise de commande garderait l'ancien ordre jusqu'au rechargement.
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      queryClient.invalidateQueries({ queryKey: ["supplements"] });
      toast.success("Ordre d'affichage enregistré");
      setModifie(false);
      onClose();
    } catch {
      toast.error("L'ordre n'a pas pu être enregistré");
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ordre d'affichage · ${LIBELLE[categorie]}`}
    >
      <div className="p-6">
        <p className="mb-4 text-[13px] text-[#9796A1]">
          Le premier de la liste apparaît en premier dans l&apos;application.
          Faites glisser un supplément ou utilisez les flèches, puis
          enregistrez.
        </p>

        {chargement ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : erreur ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-[13px] font-semibold text-red-600">{erreur}</p>
            <button
              type="button"
              onClick={charger}
              className="mt-3 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-[#9796A1]">
            Aucun supplément dans cette catégorie.
          </p>
        ) : (
          <ul className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => setGlisse(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (glisse !== null) deplacer(glisse, index);
                  setGlisse(null);
                }}
                onDragEnd={() => setGlisse(null)}
                className={`flex items-center gap-3 rounded-xl border bg-white p-2.5 ${
                  glisse === index
                    ? "border-[#F17922] opacity-60"
                    : "border-gray-200"
                }`}
              >
                <GripVertical
                  size={16}
                  className="shrink-0 cursor-grab text-gray-300"
                />
                <span className="w-6 shrink-0 text-center text-[12px] font-semibold text-[#9796A1]">
                  {index + 1}
                </span>

                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  {item.image ? (
                    <Image
                      src={formatImageUrl(item.image)}
                      alt={item.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-gray-800">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-[#9796A1]">
                    {Number(item.price || 0).toLocaleString("fr-FR")} XOF
                    {item.available === false && (
                      <span className="ml-2 text-gray-400">indisponible</span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => deplacer(index, index - 1)}
                    title="Monter"
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1}
                    onClick={() => deplacer(index, index + 1)}
                    title="Descendre"
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={enregistrer}
            disabled={!modifie || enregistrement}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F17922] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#d96a1d] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {enregistrement && <Loader2 size={14} className="animate-spin" />}
            Enregistrer l&apos;ordre
          </button>
        </div>
      </div>
    </Modal>
  );
}
