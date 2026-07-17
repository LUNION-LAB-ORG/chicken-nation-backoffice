"use client";

import { Loader2, ZoomIn } from "lucide-react";
import { useCallback, useRef, useState } from "react";

/** Viewport d'édition (px) et résolution de sortie du recadrage. */
const VIEWPORT = 280;
const OUTPUT = 512;

interface PhotoCropperProps {
  /** Source à recadrer : data-URL (photo locale) ou URL (photo déjà soumise). */
  src: string;
  /** Renvoie la photo recadrée, prête à être envoyée au backend. */
  onApply: (file: File) => void;
  onCancel: () => void;
  applyLabel?: string;
  isBusy?: boolean;
}

/**
 * Recadrage circulaire d'une photo, côté backoffice, AVANT génération de la carte.
 * Le cadre reproduit le médaillon rond de la carte : ce que le staff voit ici est
 * exactement ce qui sera dessiné.
 *
 * Fait maison volontairement : aucune lib de crop n'était présente et les
 * candidates ne garantissent pas React 19. Le rendu canvas applique EXACTEMENT la
 * même transformation (cover + zoom + translation) que l'aperçu à l'écran.
 */
export function PhotoCropper({
  src,
  onApply,
  onCancel,
  applyLabel = "Appliquer le recadrage",
  isBusy,
}: PhotoCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [rendering, setRendering] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const dragging = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  // Échelle « cover » : la photo remplit toujours le cercle, sans bande vide.
  const baseScale = natural.w
    ? Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h)
    : 1;
  const scale = baseScale * zoom;
  const drawW = natural.w * scale;
  const drawH = natural.h * scale;

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    // Bornes : on empêche de sortir la photo du cercle (pas de vide dans le cadre).
    const maxX = Math.max(0, (drawW - VIEWPORT) / 2);
    const maxY = Math.max(0, (drawH - VIEWPORT) / 2);
    setPos((p) => ({
      x: Math.min(maxX, Math.max(-maxX, p.x + dx)),
      y: Math.min(maxY, Math.max(-maxY, p.y + dy)),
    }));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const handleApply = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    setRendering(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Même transformation qu'à l'écran, remise à l'échelle de sortie.
      const k = OUTPUT / VIEWPORT;
      const w = drawW * k;
      const h = drawH * k;
      const dx = (OUTPUT - w) / 2 + pos.x * k;
      const dy = (OUTPUT - h) / 2 + pos.y * k;
      ctx.drawImage(img, dx, dy, w, h);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (blob) {
        onApply(new File([blob], "photo-recadree.png", { type: "image/png" }));
      }
    } finally {
      setRendering(false);
    }
  }, [drawW, drawH, pos, onApply]);

  const busy = isBusy || rendering;

  return (
    <div className="space-y-3">
      {/* Cadre rond : reproduit le médaillon de la carte */}
      <div className="flex justify-center">
        <div
          className="relative touch-none overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-inner ring-2 ring-[#F17922]"
          style={{ width: VIEWPORT, height: VIEWPORT, cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="Photo à recadrer"
            crossOrigin="anonymous"
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({ w: el.naturalWidth, h: el.naturalHeight });
              setPos({ x: 0, y: 0 });
              setZoom(1);
            }}
            className="pointer-events-none absolute select-none"
            style={{
              width: drawW || undefined,
              height: drawH || undefined,
              left: "50%",
              top: "50%",
              marginLeft: -drawW / 2,
              marginTop: -drawH / 2,
              transform: `translate(${pos.x}px, ${pos.y}px)`,
            }}
          />
        </div>
      </div>

      <p className="text-center text-xs text-gray-500">
        Glisse la photo pour la cadrer · le cercle = le rendu final sur la carte
      </p>

      {/* Zoom */}
      <div className="flex items-center gap-3">
        <ZoomIn className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          disabled={busy}
          onChange={(e) => {
            const z = Number(e.target.value);
            setZoom(z);
            // Re-borne la position : un dézoom ne doit pas laisser de vide.
            const s = baseScale * z;
            const maxX = Math.max(0, (natural.w * s - VIEWPORT) / 2);
            const maxY = Math.max(0, (natural.h * s - VIEWPORT) / 2);
            setPos((p) => ({
              x: Math.min(maxX, Math.max(-maxX, p.x)),
              y: Math.min(maxY, Math.max(-maxY, p.y)),
            }));
          }}
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
          disabled={busy || !natural.w}
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[#F17922] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d96a1d] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
