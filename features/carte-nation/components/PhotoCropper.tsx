"use client";

import { Cropper } from "@origin-space/image-cropper";
import { Loader2, ZoomIn } from "lucide-react";
import { useCallback, useState } from "react";

/** Résolution du fichier recadré exporté. */
const OUTPUT = 512;

type Area = { x: number; y: number; width: number; height: number };

interface PhotoCropperProps {
  /** Source à recadrer : data-URL (photo locale) ou URL (photo déjà soumise). */
  src: string;
  /** Renvoie la photo recadrée, prête à être envoyée au backend. */
  onApply: (file: File) => void;
  onCancel: () => void;
  applyLabel?: string;
  isBusy?: boolean;
  /** Erreur d'export (image cross-origin non autorisée au canvas, etc.). */
  onError?: (message: string) => void;
}

/**
 * Découpe la zone recadrée (coords natives renvoyées par le cropper) dans un
 * canvas carré → File PNG. Le crop est en 1:1 ; le générateur de carte masque
 * ensuite la photo en cercle (médaillon), donc un carré suffit ici.
 */
async function cropToFile(src: string, area: Area): Promise<File> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Chargement de l'image impossible"));
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");

  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT,
    OUTPUT
  );

  const blob: Blob = await new Promise((resolve, reject) =>
    // toBlob lève une SecurityError si l'image est cross-origin sans CORS.
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export impossible"))),
      "image/png"
    )
  );
  return new File([blob], "photo-recadree.png", { type: "image/png" });
}

/**
 * Recadrage circulaire d'une photo, côté backoffice, AVANT génération de la carte.
 * Le cadre reproduit le médaillon rond de la carte : ce que le staff cale ici est
 * exactement ce qui sera dessiné.
 *
 * Basé sur @origin-space/image-cropper : headless, ZÉRO dépendance runtime, peer
 * React 19 — plus sûr et plus léger qu'une lib de crop classique.
 */
export function PhotoCropper({
  src,
  onApply,
  onCancel,
  applyLabel = "Appliquer le recadrage",
  isBusy,
  onError,
}: PhotoCropperProps) {
  const [area, setArea] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rendering, setRendering] = useState(false);

  const handleApply = useCallback(async () => {
    if (!area) return;
    setRendering(true);
    try {
      onApply(await cropToFile(src, area));
    } catch (e) {
      onError?.(
        e instanceof Error ? e.message : "Recadrage impossible sur cette image"
      );
    } finally {
      setRendering(false);
    }
  }, [area, src, onApply, onError]);

  const busy = isBusy || rendering;

  return (
    <div className="space-y-3">
      <Cropper.Root
        image={src}
        aspectRatio={1}
        zoom={zoom}
        onZoomChange={setZoom}
        onCropChange={setArea}
        className="relative mx-auto flex h-72 w-72 items-center justify-center overflow-hidden rounded-2xl bg-gray-900/90 touch-none"
      >
        <Cropper.Description className="sr-only" />
        <Cropper.Image className="pointer-events-none h-full w-full object-cover" />
        {/* Fenêtre de crop circulaire + voile sombre autour = le médaillon final */}
        <Cropper.CropArea className="pointer-events-none rounded-full border-4 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ring-2 ring-[#F17922]" />
      </Cropper.Root>

      <p className="text-center text-xs text-gray-500">
        Glisse et zoome la photo · le cercle = le rendu final sur la carte
      </p>

      <div className="flex items-center gap-3">
        <ZoomIn className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          disabled={busy}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-[#F17922]"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={busy || !area}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[#F17922] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d96a1d] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
