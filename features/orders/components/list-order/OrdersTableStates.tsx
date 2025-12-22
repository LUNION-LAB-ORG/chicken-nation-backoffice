import React from "react";

export const LoadingState: React.FC = () => {
  return (
    <div className="min-w-full bg-white h-screen border-1 border-slate-300 p-3 rounded-xl overflow-hidden flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

interface ErrorStateProps {
  error: Error | null;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="min-w-full bg-white h-screen border-1 border-slate-300 p-3 rounded-xl overflow-hidden flex justify-center items-center">
      <div className="text-red-500 text-center">
        <p className="text-lg font-medium">
          Erreur lors du chargement des commandes
        </p>
        <p className="text-sm">{error?.message || "Erreur inconnue"}</p>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "Aucune commande disponible",
}) => {
  return (
    <div className="min-w-full bg-white h-screen border-1 border-slate-300 p-3 rounded-xl overflow-hidden flex justify-center items-center">
      <div className="text-gray-500 text-center">
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};