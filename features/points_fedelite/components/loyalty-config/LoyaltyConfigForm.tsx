import React, { useState } from "react";
import { motion } from "framer-motion";
import { FormField } from "./FormField";
import { LoyaltyConfigFormData } from "../../types/loyalty.types";

interface LoyaltyConfigFormProps {
  initialData: LoyaltyConfigFormData;
  onSubmit: (data: LoyaltyConfigFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const LoyaltyConfigForm = ({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: LoyaltyConfigFormProps) => {
  const [formData, setFormData] = useState<LoyaltyConfigFormData>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation locale simple
    const standard = Number(formData.standard_threshold);
    const premium = Number(formData.premium_threshold);
    const gold = Number(formData.gold_threshold);

    if (standard < premium && premium < gold) {
      onSubmit(formData);
    }
  };

  return (
    <motion.form
      key="form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Points par XOF dépensé"
          value={formData.points_per_xof}
          onChange={(v) => setFormData({ ...formData, points_per_xof: v })}
          type="number"
          step="0.001"
          min="0"
          placeholder="0.002"
          helper="Ex: 0.002 = 2 points pour 1000 XOF"
        />
        <FormField
          label="Expiration des points (jours)"
          value={formData.points_expiration_days || ""}
          onChange={(v) =>
            setFormData({ ...formData, points_expiration_days: v })
          }
          type="number"
          min="1"
          placeholder="365"
          helper="Laissez vide pour aucune expiration"
        />
        <FormField
          label="Points minimum d'utilisation"
          value={formData.minimum_redemption_points}
          onChange={(v) =>
            setFormData({ ...formData, minimum_redemption_points: v })
          }
          type="number"
          min="0"
        />
        <FormField
          label="Valeur d'un point (XOF)"
          value={formData.point_value_in_xof}
          onChange={(v) => setFormData({ ...formData, point_value_in_xof: v })}
          type="number"
          step="0.01"
          min="0"
        />
      </div>

      <div className="border-2 border-[#D9D9D9]/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-[#595959]">
          Seuils des Niveaux de Fidélité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Standard"
            value={formData.standard_threshold}
            onChange={(v) =>
              setFormData({ ...formData, standard_threshold: v })
            }
            type="number"
          />
          <FormField
            label="Premium"
            value={formData.premium_threshold}
            onChange={(v) => setFormData({ ...formData, premium_threshold: v })}
            type="number"
          />
          <FormField
            label="Gold"
            value={formData.gold_threshold}
            onChange={(v) => setFormData({ ...formData, gold_threshold: v })}
            type="number"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) =>
            setFormData({ ...formData, is_active: e.target.checked })
          }
          className="w-5 h-5 text-[#F17922] rounded focus:ring-[#F17922]"
        />
        <label
          htmlFor="is_active"
          className="text-sm font-medium text-gray-700"
        >
          Activer le système de fidélité
        </label>
      </div>

      <div className="flex items-center justify-center gap-4 pt-6">
        <motion.button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 rounded-xl bg-[#ECECEC] text-[#9796A1] min-w-[160px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isPending}
        >
          Annuler
        </motion.button>
        <motion.button
          type="submit"
          className="px-8 py-3 rounded-xl bg-[#F17922] text-white min-w-[170px] disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isPending}
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </motion.button>
      </div>
    </motion.form>
  );
};
