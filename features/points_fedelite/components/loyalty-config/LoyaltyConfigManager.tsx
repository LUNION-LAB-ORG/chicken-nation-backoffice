"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfigQuery } from "../../queries/loyalty.queries";
import { useAddOrUpdateLoyaltyConfigMutation } from "../../queries/loyalty.mutations";
import { LoyaltyConfigDetails } from "./LoyaltyConfigDetails";
import { LoyaltyConfigForm } from "./LoyaltyConfigForm";
import { useAuthStore } from "../../../users/hook/authStore";
import { UserRole } from "../../../users/types/user.types";

const LoyaltyConfigManager = () => {
  const [showForm, setShowForm] = useState(false);
  const { data: config, isLoading, refetch } = useConfigQuery();
  const { user } = useAuthStore();
  const mutation = useAddOrUpdateLoyaltyConfigMutation();

  const defaultFormData = {
    points_per_xof: config?.points_per_xof?.toString() || "0.002",
    points_expiration_days: config?.points_expiration_days?.toString() || "365",
    minimum_redemption_points:
      config?.minimum_redemption_points?.toString() || "100",
    point_value_in_xof: config?.point_value_in_xof?.toString() || "20",
    standard_threshold: config?.standard_threshold?.toString() || "300",
    premium_threshold: config?.premium_threshold?.toString() || "700",
    gold_threshold: config?.gold_threshold?.toString() || "1000",
    is_active: config?.is_active ?? true,
  };

  const handleFormSubmit = (payload: any) => {
    mutation.mutate(payload, {
      onSuccess: () => {
        setShowForm(false);
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-[#F17922] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#595959]">
            Configuration de Fidélité
          </h1>
          {user && user.role == UserRole.ADMIN && !showForm && (
            <motion.button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-[#F17922] text-white rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {config ? "Modifier" : "Créer"}
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!showForm && config ? (
            <LoyaltyConfigDetails config={config} />
          ) : !showForm && !config ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-semibold text-gray-700">
                Aucune configuration
              </h3>
              <p className="text-gray-500 mb-6">
                Créez votre première configuration.
              </p>
            </div>
          ) : (
            <LoyaltyConfigForm
              initialData={defaultFormData}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
              isPending={mutation.isPending}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoyaltyConfigManager;
