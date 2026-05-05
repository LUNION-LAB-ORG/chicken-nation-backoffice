"use client";

import React, { useState } from "react";

import { useDashboardStore } from "@/store/dashboardStore";

import AffectationSection from "./AffectationSection";
import ContactSection from "./ContactSection";
import DocumentsSection from "./DocumentsSection";
import ProfilSection from "./ProfilSection";
import ScoringQueueSection from "./ScoringQueueSection";
import WorkflowActions from "./WorkflowActions";

import AssignRestaurantModal from "@/components/gestion/Livreurs/AssignRestaurantModal";
import RejectLivreurModal from "@/components/gestion/Livreurs/RejectLivreurModal";
import SuspendLivreurModal from "@/components/gestion/Livreurs/SuspendLivreurModal";
import { useLivreurDetail } from "../../hook/use-livreurs";
import type { Livreur } from "../../types/livreur.types";

interface LivreurDetailsProps {
  selectedItem: Livreur;
}

/**
 * Page détail livreur — layout 2 colonnes inspiré de OrderDetails.
 *
 * - Colonne gauche (3/5) : Profil + Contact + Documents (avec zoom lightbox)
 * - Colonne droite (2/5) : Affectation (restaurant + véhicule) + Actions admin
 *
 * Le bouton retour est géré par `LivreursHeader` (pattern MenuHeader) en haut de la page.
 * Refetch automatique du livreur via useLivreurDetail pour avoir les données à jour.
 */
const LivreurDetails: React.FC<LivreurDetailsProps> = ({ selectedItem }) => {
  const { data: fresh } = useLivreurDetail(selectedItem.id);
  const livreur = fresh ?? selectedItem;

  const setSectionView = useDashboardStore((s) => s.setSectionView);
  const backToList = () => setSectionView("livreurs", "list");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const livreurNom =
    `${livreur.first_name ?? ""} ${livreur.last_name ?? ""}`.trim() || livreur.phone;

  return (
    <>
      <div className="bg-white rounded-xl min-h-screen shadow-sm mt-4">
        <div className="flex flex-col md:flex-row gap-4 md:gap-12">
          {/* Partie gauche */}
          <div className="md:w-3/5 p-4 sm:p-6 h-auto">
            <ProfilSection livreur={livreur} />
            <ContactSection livreur={livreur} />
            <DocumentsSection livreur={livreur} />
          </div>

          {/* Partie droite */}
          <div className="md:w-2/5 p-4 sm:p-6 pb-20 md:pb-6 bg-[#FBFBFB] h-auto overflow-y-auto md:overflow-visible">
            <AffectationSection
              livreur={livreur}
              onAssignRestaurant={() => setAssignOpen(true)}
            />
            <ScoringQueueSection livreurId={livreur.id} />
            <WorkflowActions
              livreur={livreur}
              onBack={backToList}
              onReject={() => setRejectOpen(true)}
              onSuspend={() => setSuspendOpen(true)}
              onAssignRestaurant={() => setAssignOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modals d'actions — restent en modal car formulaires courts */}
      <RejectLivreurModal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        livreurId={livreur.id}
        livreurNom={livreurNom}
      />
      <SuspendLivreurModal
        isOpen={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        livreurId={livreur.id}
        livreurNom={livreurNom}
      />
      <AssignRestaurantModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        livreurId={livreur.id}
        livreurNom={livreurNom}
        currentRestaurantId={livreur.restaurant_id}
      />
    </>
  );
};

export default LivreurDetails;
