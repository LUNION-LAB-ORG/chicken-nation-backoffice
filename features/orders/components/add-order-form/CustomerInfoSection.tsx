"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { OrderFormData } from "../../types/order-form.types";
import { Customer } from "../../../customer/types/customer.types";
import { useCustomerListQuery } from "../../../customer/queries/customer-list.query";
import { useCustomerAddMutation } from "../../../customer/queries/customer-add.mutation";
import {
  prepareCustomerData,
  validateCustomerForm,
} from "../../../customer/utils/customerFormValidation";

interface CustomerInfoSectionProps {
  formData: OrderFormData;
  onFormDataChange: (data: Partial<OrderFormData>) => void;
  onCustomerChange?: (customerId: string | null, needsSave: boolean) => void;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  formData,
  onFormDataChange,
  onCustomerChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [needsSave, setNeedsSave] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Query pour récupérer les clients
  const { data: customersData, isLoading } = useCustomerListQuery({
    page: currentPage,
    limit: 50,
    search: debouncedSearch || undefined,
  });

  // Mutation pour ajouter un client
  const { mutateAsync: addCustomer, isPending } = useCustomerAddMutation();

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Afficher les résultats si recherche active
  useEffect(() => {
    if (
      debouncedSearch &&
      customersData?.data &&
      customersData.data.length > 0
    ) {
      setShowResults(true);
    }
  }, [debouncedSearch, customersData]);

  // Sélectionner un client existant
  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setSearchTerm("");
      setShowResults(false);
      setNeedsSave(false);

      // Remplir le formulaire avec les données du client
      const fullname = [customer.first_name, customer.last_name]
        .filter(Boolean)
        .join(" ");

      onFormDataChange({
        fullname: fullname || undefined,
        phone: customer.phone || undefined,
        email: customer.email || undefined,
        customer_id: customer.id,
      });

      onCustomerChange?.(customer.id, false);
    },
    [onFormDataChange, onCustomerChange]
  );

  // Détecter si les données ont changé (nouveau client)
  useEffect(() => {
    if (selectedCustomer) {
      const currentFullname = [
        selectedCustomer.first_name,
        selectedCustomer.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      const hasChanged =
        formData.fullname !== currentFullname ||
        formData.phone !== selectedCustomer.phone ||
        formData.email !== selectedCustomer.email;

      if (hasChanged) {
        setNeedsSave(true);
        setSelectedCustomer(null);
        onCustomerChange?.(null, true);
      }
    } else if (formData.fullname || formData.phone || formData.email) {
      setNeedsSave(true);
      onCustomerChange?.(null, true);
    } else {
      setNeedsSave(false);
      onCustomerChange?.(null, false);
    }
  }, [formData.fullname, formData.phone, formData.email]);

  // Enregistrer un nouveau client
  const handleSaveNewCustomer = async () => {
    const validate = validateCustomerForm({
      phone: formData.phone,
      first_name: formData.fullname?.split(" ")[0] || "",
      last_name: formData.fullname?.split(" ").slice(1).join(" ") || "",
      email: formData.email || "",
    });

    if (!validate) {
      return;
    }

    try {
      const result = await addCustomer(
        prepareCustomerData({
          phone: formData.phone,
          first_name: formData.fullname?.split(" ")[0] || "",
          last_name: formData.fullname?.split(" ").slice(1).join(" ") || "",
          email: formData.email || "",
        })
      );

      if (result?.id) {
        setSelectedCustomer(result);
        setNeedsSave(false);
        onFormDataChange({ customer_id: result.id });
        onCustomerChange?.(result.id, false);
        toast.success("Client enregistré avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du client:", error);
    }
  };

  // Fonction publique pour sauvegarder le client (appelée depuis le formulaire principal)
  const saveCustomerIfNeeded = useCallback(async (): Promise<string | null> => {
    if (!needsSave) {
      return formData.customer_id || null;
    }
    const validate = validateCustomerForm({
      phone: formData.phone,
      first_name: formData.fullname?.split(" ")[0] || "",
      last_name: formData.fullname?.split(" ").slice(1).join(" ") || "",
      email: formData.email || "",
    });
    if (!validate) {
      return;
    }

    try {
      const result = await addCustomer(
        prepareCustomerData({
          phone: formData.phone,
          first_name: formData.fullname?.split(" ")[0] || "",
          last_name: formData.fullname?.split(" ").slice(1).join(" ") || "",
          email: formData.email || "",
        })
      );

      if (result?.id) {
        setSelectedCustomer(result);
        setNeedsSave(false);
        onFormDataChange({ customer_id: result.id });
        onCustomerChange?.(result.id, false);
        return result.id;
      }

      return null;
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du client:", error);
      throw error;
    }
  }, [needsSave, formData, addCustomer, onFormDataChange, onCustomerChange]);

  // Exposer la fonction via un ref callback
  useEffect(() => {
    if (onCustomerChange) {
      // Stocker la fonction dans le composant parent via un callback spécial
      (window as any).__saveCustomerIfNeeded = saveCustomerIfNeeded;
    }
  }, [saveCustomerIfNeeded, onCustomerChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#595959]">
          Informations client
        </h3>
        {selectedCustomer && (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
            ✓ Client existant
          </span>
        )}
        {needsSave && !selectedCustomer && (
          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">
            ⚠ Nouveau client
          </span>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <motion.div
          className="w-full px-3 py-2 border-2 border-[#F17922]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[#F17922]">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value) {
                  setShowResults(false);
                }
              }}
              onFocus={() => {
                if (debouncedSearch && customersData?.data) {
                  setShowResults(true);
                }
              }}
              className="w-full py-2 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
              placeholder="Rechercher un client (nom, téléphone, email)..."
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F17922]" />
            )}
          </div>
        </motion.div>

        {/* Résultats de recherche */}
        <AnimatePresence>
          {showResults &&
            customersData?.data &&
            customersData.data.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 bg-white border-2 border-[#D9D9D9] rounded-2xl shadow-lg max-h-[300px] overflow-y-auto"
              >
                {customersData.data.map((customer: Customer) => (
                  <motion.button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-[#F5F5F5] border-b border-[#D9D9D9]/30 last:border-b-0 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#595959] text-sm">
                          {[customer.first_name, customer.last_name]
                            .filter(Boolean)
                            .join(" ") || "Sans nom"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.phone}
                        </p>
                        {customer.email && (
                          <p className="text-xs text-gray-400">
                            {customer.email}
                          </p>
                        )}
                      </div>
                      <span className="text-[#F17922]">→</span>
                    </div>
                  </motion.button>
                ))}

                {/* Pagination */}
                {customersData.meta && customersData.meta.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-2 bg-[#F5F5F5] border-t border-[#D9D9D9]">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs font-semibold text-[#595959] disabled:opacity-50"
                    >
                      ← Précédent
                    </button>
                    <span className="text-xs text-gray-500">
                      Page {currentPage} / {customersData.meta.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) =>
                          Math.min(customersData.meta.totalPages, p + 1)
                        )
                      }
                      disabled={currentPage === customersData.meta.totalPages}
                      className="text-xs font-semibold text-[#595959] disabled:opacity-50"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
        </AnimatePresence>

        {/* Message si aucun résultat */}
        {showResults &&
          debouncedSearch &&
          customersData?.data &&
          customersData.data.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-50 w-full mt-2 bg-white border-2 border-[#D9D9D9] rounded-2xl shadow-lg p-4"
            >
              <p className="text-sm text-gray-500 text-center">
                Aucun client trouvé. Saisissez les informations ci-dessous.
              </p>
            </motion.div>
          )}
      </div>

      {/* Nom complet */}
      <motion.div
        className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="text"
          id="fullname"
          value={formData.fullname || ""}
          onChange={(e) => onFormDataChange({ fullname: e.target.value })}
          className="w-full py-2 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
          placeholder="Nom complet du client"
        />
      </motion.div>

      {/* Téléphone */}
      <motion.div
        className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="tel"
          id="phone"
          value={formData.phone || ""}
          onChange={(e) => onFormDataChange({ phone: e.target.value })}
          className="w-full py-2 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
          placeholder="+225 07 07 07 07 07"
        />
      </motion.div>

      {/* Email */}
      <motion.div
        className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="email"
          id="email"
          value={formData.email || ""}
          onChange={(e) => onFormDataChange({ email: e.target.value })}
          className="w-full py-2 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
          placeholder="Email du client"
        />
      </motion.div>

      {/* Bouton d'enregistrement pour nouveau client */}
      {needsSave && !selectedCustomer && (
        <motion.button
          type="button"
          onClick={handleSaveNewCustomer}
          disabled={isPending}
          className="w-full px-4 py-3 bg-[#F17922] text-white rounded-xl text-sm font-semibold hover:bg-[#F17922]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Enregistrement...
            </>
          ) : (
            <>✓ Enregistrer ce nouveau client</>
          )}
        </motion.button>
      )}
    </div>
  );
};

export default CustomerInfoSection;
