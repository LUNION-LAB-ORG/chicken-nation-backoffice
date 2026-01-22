import React from "react";
import { motion } from "framer-motion";
import { InfoCard } from "./InfoCard";
import { LevelCard } from "./LevelCard";

interface LoyaltyConfigDetailsProps {
  config: any;
}

export const LoyaltyConfigDetails = ({ config }: LoyaltyConfigDetailsProps) => {
  return (
    <motion.div
      key="view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard
          label="Points par 1000 XOF"
          value={`${(config.points_per_xof * 1000).toFixed(2)} points`}
          icon="💰"
        />
        <InfoCard
          label="Expiration des points"
          value={
            config.points_expiration_days
              ? `${config.points_expiration_days} jours`
              : "Jamais"
          }
          icon="⏰"
        />
        <InfoCard
          label={`Points minimum d'utilisation. Valeur: ${config.minimum_redemption_points * 20} XOF`}
          value={`${config.minimum_redemption_points} points`}
          icon="🎯"
        />
        <InfoCard
          label="Valeur d'un point"
          value={`${config.point_value_in_xof} XOF`}
          icon="💎"
        />
      </div>

      <div className="border-t-2 border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold text-[#595959] mb-4">
          Seuils des Niveaux
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LevelCard
            level="Standard"
            threshold={config.standard_threshold}
            color="bg-gray-400"
          />
          <LevelCard
            level="Premium"
            threshold={config.premium_threshold}
            color="bg-blue-500"
          />
          <LevelCard
            level="Gold"
            threshold={config.gold_threshold}
            color="bg-yellow-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
        <span className="text-gray-700 font-medium">Statut</span>
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            config.is_active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {config.is_active ? "Actif" : "Inactif"}
        </span>
      </div>
    </motion.div>
  );
};
