import { CheckCircle2, Clock, Eye, XCircle } from "lucide-react";

export const getStatusBadgeCard = (status: string) => {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />
          En attente
        </span>
      );
    case "IN_REVIEW":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <Eye className="w-3 h-3" />
          En révision
        </span>
      );
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          Approuvée
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Rejetée
        </span>
      );
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          Active
        </span>
      );
    case "SUSPENDED":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />
          Suspendue
        </span>
      );
    case "REVOKED":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          <XCircle className="w-3 h-3" />
          Révoquée
        </span>
      );
    default:
      return null;
  }
};
