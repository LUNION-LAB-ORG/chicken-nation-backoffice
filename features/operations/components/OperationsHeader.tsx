"use client";

import React, { useState } from "react";
import { AlertCircle } from "lucide-react";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";

import { useCourseByPickupCodeQuery } from "../queries/course-by-pickup-code.query";
import { PickupCodeInput } from "./PickupCodeInput";
import { PickupValidationModal } from "./PickupValidationModal";

/**
 * Header de la page Opérations :
 *  - Titre
 *  - Champ "Code retrait" — le livreur dicte, la caissière tape → modal de validation
 */
export const OperationsHeader: React.FC = () => {
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const { data: course, isLoading, isError, refetch } = useCourseByPickupCodeQuery(
    submittedCode ?? "",
    submittedCode !== null,
  );

  const handleCloseModal = () => setSubmittedCode(null);

  return (
    <div>
      <DashboardPageHeader
        mode="list"
        title="Opérations"
        subtitle="Suivi temps réel des commandes et récupération livreur"
      />
      <div className="mt-3 max-w-md">
        <PickupCodeInput onSubmit={setSubmittedCode} isLoading={isLoading} />
        {isError && submittedCode && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Aucune course trouvée pour le code <strong>{submittedCode}</strong>.
            </span>
            <button
              onClick={() => {
                setSubmittedCode(null);
                refetch();
              }}
              className="ml-auto text-[#F17922] underline"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      {course && submittedCode && (
        <PickupValidationModal course={course} onClose={handleCloseModal} />
      )}
    </div>
  );
};
