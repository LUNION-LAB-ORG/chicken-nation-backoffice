import { CheckCircle2, Clock, Eye, XCircle } from "lucide-react";
import { NationCardStatus } from "../types/carte-nation.types";

export const getStatusBadgeCard = (status: NationCardStatus) => {
  switch (status) {
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
