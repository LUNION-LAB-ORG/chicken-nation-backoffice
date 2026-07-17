"use client";

import { Loader2, ZoomIn } from "lucide-react";
import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

/** Résolution du fichier recadré exporté. */
const OUTPUT = 512;

interface PhotoCropperProps {
  /** Source à recadrer : data-URL (photo locale) ou URL http (photo déjà soumise). */
  src: string;
  /** Renvoie la photo recadrée, prête à être envoyée au backend. */
  onApply: (file: File) => void;
  onCancel: () => void;
  applyLabel?: string;
  isBusy?: boolean;
  /** Erreur d'export (image inaccessible, canvas taint, etc.). */
  onError?: (message: string) => void;
}

/**
 * Une image http (photo déjà stockée sur CloudFront) chargée en cross-origin
 * TAINTE le canvas → l'export échoue. On la route par le proxy same-origin du
 * backoffice (whitelisté), ce qui supprime tout CORS. Les data:/blob: locales
 * (simulateur, photo juste sélectionnée) passent en direct.
 */
function toSameOrigin(src: string): string {
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (/^https?:\/\//.test(src)) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Chargement de l'image impossible"));
    img.src = src;
  });
}

/** Découpe la zone recadrée (coords natives) → File PNG carré (le générateur masque en cercle). */
async function cropToFile(src: string, area: Area): Promise<File> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT, OUTPUT);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export impossible"))),
      "image/png"
    )
  );
  return new File([blob], "photo-recadree.png", { type: "image/png" });
}

/**
 * Recadrage circulaire d'une photo, côté backoffice, AVANT génération de la carte.
 * Le cercle affiché = le médaillon final de la carte.
 *
 * Basé sur react-easy-crop (`cropShape="round"`) : il gère lui-même l'empilement
 * image / fenêtre de crop / voile sombre — plus de bug de cercle « qui passe
 * derrière ». Lib MIT largement éprouvée, 1 seule dépendance (normalize-wheel).
 */
export function PhotoCropper({
  src,
  onApply,
  onCancel,
  applyLabel = "Appliquer le recadrage",
  isBusy,
  onError,
}: PhotoCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [rendering, setRendering] = useState(false);

  const sameOriginSrc = toSameOrigin(src);

  const handleApply = useCallback(async () => {
    if (!pixels) return;
    setRendering(true);
    try {
      onApply(await cropToFile(sameOriginSrc, pixels));
    } catch (e) {
      onError?.(
        e instanceof Error ? e.message : "Recadrage impossible sur cette image"
      );
    } finally {
      setRendering(false);
    }
  }, [pixels, sameOriginSrc, onApply, onError]);

  const busy = isBusy || rendering;

  return (
    <div className="space-y-3">
      {/* Conteneur positionné : react-easy-crop se place en absolu à l'intérieur */}
      <div className="relative mx-auto h-72 w-full overflow-hidden rounded-2xl bg-gray-900">
        <Cropper
          image={sameOriginSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area, areaPixels) => setPixels(areaPixels)}
        />
      </div>

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
          disabled={busy || !pixels}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[#F17922] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d96a1d] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
