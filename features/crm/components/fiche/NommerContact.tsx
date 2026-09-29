"use client";

import React, { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRenommerMutation } from "../../queries/contact.mutation";

/**
 * Donner un nom à un contact qui n'en a pas.
 *
 * ⚠️ Prénom et nom sont saisis SÉPARÉMENT. Un champ unique obligerait à
 * deviner l'ordre, et le prénom sert à personnaliser les messages de coupon :
 * une découpe qui se trompe fait dire « Bonjour Koné ! » à Salif Koné, à
 * chaque envoi. Deux champs coûtent une seconde et suppriment la question.
 *
 * Le composant ne décide de rien : il s'affiche quand l'appelant l'estime
 * possible, et le serveur refuse ce qui doit l'être — un client qui a
 * renseigné son nom lui-même dans l'application n'est pas renommable ici.
 */
export function NommerContact({ id }: { id: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const renommer = useRenommerMutation();

  const fermer = () => {
    setOuvert(false);
    setPrenom("");
    setNom("");
  };

  const enregistrer = async () => {
    if (!prenom.trim() || renommer.isPending) return;
    try {
      const r = await renommer.mutateAsync({
        id,
        dto: { prenom: prenom.trim(), nom: nom.trim() || undefined },
      });
      toast.success(
        r.sur_le_compte
          ? `Nommé ${r.nom}, sur la fiche et sur son compte`
          : `Nommé ${r.nom}`,
      );
      fermer();
    } catch {
      // La mutation a déjà dit pourquoi ; on garde la saisie pour la corriger.
    }
  };

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        title="Donner un nom à ce client"
        aria-label="Donner un nom à ce client"
        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-[#F17922] hover:border-[#F17922]/60 cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" /> Nommer
      </button>
    );
  }

  const champ =
    "rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-[#F17922] w-32";

  // Entrée enregistre, Échap annule : l'agent est au téléphone, il ne vise pas
  // des boutons pendant qu'il parle.
  const touches = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void enregistrer();
    if (e.key === "Escape") fermer();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        autoFocus
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
        onKeyDown={touches}
        placeholder="Prénom"
        aria-label="Prénom"
        maxLength={60}
        className={champ}
      />
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        onKeyDown={touches}
        placeholder="Nom (facultatif)"
        aria-label="Nom de famille"
        maxLength={60}
        className={champ}
      />
      <button
        type="button"
        onClick={enregistrer}
        disabled={renommer.isPending || !prenom.trim()}
        aria-label="Enregistrer le nom"
        className="shrink-0 rounded-lg bg-[#F17922] p-1.5 text-white disabled:opacity-50 cursor-pointer"
      >
        {renommer.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </button>
      <button
        type="button"
        onClick={fermer}
        aria-label="Annuler"
        className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-500 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
