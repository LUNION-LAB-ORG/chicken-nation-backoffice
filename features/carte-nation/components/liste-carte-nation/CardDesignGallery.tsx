"use client";

import { AlertTriangle, ImagePlus, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { previewCard } from "../../services/carte-nation.service";
import { CardLevel } from "../../types/carte-nation.types";
import { LEVEL_OPTIONS, STUDENT_MARKER_DOT } from "../../utils/cardVisualOptions";
import { PhotoCropper } from "../PhotoCropper";

/**
 * Les 6 visuels possibles = 3 niveaux (dominante couleur) × marqueur étudiant
 * (jaune, indépendant) — cahier §4.5. Montre notamment « Étudiant + VIP ».
 */
const VARIANTS: {
  key: string;
  level: CardLevel;
  is_student: boolean;
  label: string;
  hint: string;
  dot: string;
}[] = LEVEL_OPTIONS.flatMap((lvl) => [
  {
    key: lvl.value,
    level: lvl.value,
    is_student: false,
    label: lvl.label,
    hint: lvl.hint,
    dot: lvl.dot,
  },
  {
    key: `${lvl.value}_ETU`,
    level: lvl.value,
    is_student: true,
    label: `${lvl.label} + Étudiant`,
    hint: "Marqueur jaune par-dessus le niveau",
    dot: STUDENT_MARKER_DOT,
  },
]);

interface CardDesignGalleryProps {
  onClose: () => void;
}

/**
 * Galerie des designs de carte + testeur de génération par niveau.
 * Les visuels sont produits par le VRAI générateur backend (render-only : aucun
 * fichier n'est créé sur S3, aucune carte n'est enregistrée). On peut changer le
 * nom / pseudo pour vérifier le rendu réel du texte.
 */
export function CardDesignGallery({ onClose }: CardDesignGalleryProps) {
  const [firstName, setFirstName] = useState("Awa");
  const [lastName, setLastName] = useState("Koné");
  const [nickname, setNickname] = useState("Jojo");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Photo de test : sans elle, l'aperçu utilise le champion par défaut.
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const generateAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        VARIANTS.map(async (v) => {
          const res = await previewCard(
            {
              level: v.level,
              is_student: v.is_student,
              first_name: firstName,
              last_name: lastName,
              nickname,
            },
            photo ?? undefined
          );
          return [v.key, res.data.image] as const;
        })
      );
      setPreviews(Object.fromEntries(results));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setIsLoading(false);
    }
  }, [firstName, lastName, nickname, photo]);

  // On ouvre le recadrage dès la sélection : le staff cale le médaillon avant
  // de voir le rendu, comme il le fera à l'approbation.
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setCropSrc(URL.createObjectURL(file));
  };

  useEffect(() => {
    generateAll();
    // Génération initiale uniquement : ensuite c'est « Régénérer » qui pilote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Designs de carte
            </h3>
            <p className="text-xs text-gray-500">
              Rendus par le générateur réel — aucun fichier créé, aucune carte
              enregistrée.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Fermer"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Recadrage : le cercle affiché = le médaillon final sur la carte */}
          {cropSrc && (
            <div className="rounded-2xl border-2 border-[#F17922]/30 bg-[#F17922]/5 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-900">
                Recadrer la photo de test
              </p>
              <PhotoCropper
                src={cropSrc}
                applyLabel="Utiliser ce cadrage"
                onCancel={() => {
                  setCropSrc(null);
                  if (photoInputRef.current) photoInputRef.current.value = "";
                }}
                onApply={(file) => {
                  setPhoto(file);
                  setPhotoPreview(URL.createObjectURL(file));
                  setCropSrc(null);
                }}
              />
            </div>
          )}

          {/* Testeur : on personnalise le texte rendu sur la carte */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl bg-gray-50 p-4">
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Prénom
              </span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#F17922]"
              />
            </label>
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Nom
              </span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#F17922]"
              />
            </label>
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Surnom
              </span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#F17922]"
              />
            </label>
            {/* Photo de test : sans elle, l'aperçu montre le champion par défaut */}
            <div className="flex items-end gap-2">
              <div>
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Photo
                </span>
                <div className="flex items-center gap-2">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview}
                      alt=""
                      className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-gray-400"
                      title="Aucune photo → champion par défaut"
                    >
                      <ImagePlus className="h-4 w-4" />
                    </div>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isLoading}
                    className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#F17922]/40 hover:text-[#F17922] disabled:opacity-50"
                  >
                    {photo ? "Changer" : "Tester une photo"}
                  </button>
                  {photo && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPhotoPreview(null);
                        if (photoInputRef.current) photoInputRef.current.value = "";
                      }}
                      disabled={isLoading}
                      className="whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
                      title="Revenir au champion par défaut"
                    >
                      Défaut
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={generateAll}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#F17922] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d96a1d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Régénérer
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Galerie : un visuel par type de carte */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {VARIANTS.map((meta) => {
              const image = previews[meta.key];
              return (
                <div
                  key={meta.key}
                  className="overflow-hidden rounded-2xl border border-gray-200"
                >
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: meta.dot }}
                    />
                    <span className="text-sm font-semibold text-gray-900">
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {meta.hint}
                    </span>
                  </div>
                  <div className="flex min-h-[180px] items-center justify-center bg-gray-50 p-3">
                    {image ? (
                      // Data-URL renvoyé par le backend → <img> (pas d'optimisation Next).
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={`Carte ${meta.label}`}
                        className="h-auto w-full rounded-xl shadow-sm"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-xs">Génération…</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
