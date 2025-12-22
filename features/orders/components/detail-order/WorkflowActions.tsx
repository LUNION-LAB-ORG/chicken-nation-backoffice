import React from "react";
import { WorkflowConfig } from "../../types/orderDetails.types";

interface WorkflowActionsProps {
  currentStatus: string;
  workflowConfig: WorkflowConfig;
  canAcceptCommande: boolean;
  canRejectCommande: boolean;
  canUpdateCommande: boolean;
  onWorkflowAction: () => void;
  onReject: () => void;
  onPrint: () => void;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  currentStatus,
  workflowConfig,
  canAcceptCommande,
  canRejectCommande,
  canUpdateCommande,
  onWorkflowAction,
  onReject,
  onPrint,
}) => {
  // Nouvelle commande - Afficher Accepter et Refuser
  if (currentStatus === "NOUVELLE") {
    return (
      <>
        <div className="mt-6 flex justify-between gap-4">
          {canRejectCommande && (
            <button
              type="button"
              onClick={onReject}
              className="w-full py-3 px-4 bg-white border border-[#FF3B30] hover:bg-gray-50 text-[#FF3B30] rounded-xl font-medium"
            >
              Refuser
            </button>
          )}
          {canAcceptCommande && (
            <button
              type="button"
              onClick={onWorkflowAction}
              className="w-full py-3 px-4 bg-[#F17922] hover:bg-[#F17922] text-white rounded-xl font-medium"
            >
              {workflowConfig.buttonText}
            </button>
          )}
          {!canAcceptCommande && !canRejectCommande && (
            <div className="w-full text-center py-3 text-gray-500 text-sm">
              Vous n&apos;avez pas les permissions pour gérer cette commande
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onPrint}
          className="w-full mt-3 py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
        >
          Imprimer
        </button>
      </>
    );
  }

  // En cours ou En préparation - Afficher bouton workflow + Annuler
  if (workflowConfig.buttonText && currentStatus !== "PRÊT") {
    return (
      <>
        <div className="mt-6 flex justify-between gap-4">
          {canRejectCommande && (
            <button
              type="button"
              onClick={onReject}
              className="w-full py-3 px-4 bg-white border border-[#FF3B30] hover:bg-gray-50 text-[#FF3B30] rounded-xl font-medium"
            >
              Annuler
            </button>
          )}
          {canUpdateCommande && (
            <button
              type="button"
              onClick={onWorkflowAction}
              className="w-full py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
            >
              {workflowConfig.buttonText}
            </button>
          )}
          {!canUpdateCommande && !canRejectCommande && (
            <div className="w-full text-center py-3 text-gray-500 text-sm">
              Vous n&apos;avez pas les permissions pour modifier cette commande
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onPrint}
          className="w-full mt-3 py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
        >
          Imprimer
        </button>
      </>
    );
  }

  // Prêt - Afficher seulement bouton Terminer
  if (workflowConfig.buttonText && currentStatus === "PRÊT") {
    return (
      <>
        <div className="mt-6">
          {canUpdateCommande ? (
            <button
              type="button"
              onClick={onWorkflowAction}
              className="w-full py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
            >
              {workflowConfig.buttonText}
            </button>
          ) : (
            <div className="w-full text-center py-3 text-gray-500 text-sm">
              Vous n&apos;avez pas les permissions pour modifier cette commande
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onPrint}
          className="w-full mt-3 py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
        >
          Imprimer
        </button>
      </>
    );
  }

  // Commande terminée
  return (
    <>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">Commande terminée</p>
      </div>
      <button
        type="button"
        onClick={onPrint}
        className="w-full mt-3 py-3 px-4 bg-[#F17922] hover:bg-[#F17972] text-white rounded-xl font-medium"
      >
        Imprimer
      </button>
    </>
  );
};

export default WorkflowActions;
