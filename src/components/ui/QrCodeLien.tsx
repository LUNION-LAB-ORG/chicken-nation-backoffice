"use client";

import { useEffect, useState } from "react";
import QR from "qrcode";
import { Download, QrCode as IconeQr } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { BoutonCopierLien } from "@/components/ui/CopierLien";

/**
 * QR code d'un lien de partage, affichable et téléchargeable.
 *
 * ⚠️ Le document de redirection cite explicitement les QR codes pour les
 * supports physiques. Un lien qu'on ne peut pas coller sur une affiche ne sert
 * qu'à moitié, et personne ne va recopier une adresse à la main depuis un
 * écran.
 *
 * ⚠️ L'image affichée et l'image téléchargée sont LA MÊME, générée une seule
 * fois en 1024 pixels puis réduite à l'affichage. Générer deux fois, une pour
 * l'écran et une pour le fichier, exposerait au défaut classique : un QR
 * vérifié à l'écran et un autre, différent, chez l'imprimeur.
 */
const TAILLE = 1024;

/** Nom de fichier lisible, sans accent ni caractère qui gêne un système. */
const nomDeFichier = (titre: string) =>
  `qr-${titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.png`;

/**
 * Fenêtre CONTROLEE : l'appelant décide de son ouverture.
 *
 * Séparée du bouton pour que le menu d'une ligne de tableau puisse l'ouvrir :
 * un menu déroulant se referme au clic, il ne peut donc pas héberger son propre
 * déclencheur.
 */
export function QrCodeModal({
  lien,
  titre,
  ouvert,
  onClose,
}: {
  lien: string;
  titre: string;
  ouvert: boolean;
  onClose: () => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!ouvert) return;
    let annule = false;
    QR.toDataURL(lien, {
      width: TAILLE,
      margin: 2,
      // Correction HAUTE : un QR imprimé est plié, sali, photographié de biais.
      // La marge de tolérance vaut le léger surcoût de densité.
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!annule) {
          setImage(url);
          setErreur(false);
        }
      })
      .catch(() => {
        if (!annule) setErreur(true);
      });
    return () => {
      annule = true;
    };
  }, [ouvert, lien]);

  const telecharger = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = nomDeFichier(titre);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR code téléchargé");
  };

  return (
    <Modal isOpen={ouvert} onClose={onClose} title={`QR code · ${titre}`}>
        <div className="flex flex-col items-center gap-4 p-1">
          {erreur ? (
            <p className="text-sm text-red-600 text-center py-8">
              Le QR code n&apos;a pas pu être généré.
            </p>
          ) : image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={image}
              alt={`QR code vers ${titre}`}
              className="w-56 h-56 rounded-2xl border border-gray-100"
            />
          ) : (
            <div className="w-56 h-56 rounded-2xl bg-gray-50 animate-pulse" />
          )}

          <p className="text-[11px] text-gray-400 break-all text-center font-mono max-w-sm">
            {lien}
          </p>

          <p className="text-[11px] text-gray-500 text-center max-w-sm leading-relaxed">
            Image de {TAILLE} pixels, correction d&apos;erreur haute : elle reste
            lisible pliée, salie ou photographiée de biais. Testez-la toujours
            avec un téléphone avant de lancer une impression.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={telecharger}
              disabled={!image}
              className="h-9 px-3.5 flex items-center gap-2 rounded-xl bg-[#F17922] text-white text-xs font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger l&apos;image
            </button>
            <BoutonCopierLien lien={lien} quoi={titre} compact />
          </div>
      </div>
    </Modal>
  );
}

/** Bouton autonome, pour un écran de détail. */
export function QrCodeLien({ lien, titre }: { lien: string; titre: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        title={`Afficher le QR code (${titre})`}
        className="h-8 sm:h-10 px-3 flex items-center gap-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
      >
        <IconeQr className="w-4 h-4 sm:w-5 sm:h-5 text-[#F17922] shrink-0" />
        <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
          QR code
        </span>
      </button>
      <QrCodeModal lien={lien} titre={titre} ouvert={ouvert} onClose={() => setOuvert(false)} />
    </>
  );
}
