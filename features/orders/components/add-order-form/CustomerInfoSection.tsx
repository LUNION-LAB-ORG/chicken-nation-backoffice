"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, UserRound } from "lucide-react";
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
  isEditMode?: boolean;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  formData,
  onFormDataChange,
  onCustomerChange,
  isEditMode = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  // En mode édition avec un customer_id existant, on considère le client comme connu
  const [isKnownCustomer, setIsKnownCustomer] = useState(
    isEditMode && !!formData.customer_id
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
    // En mode édition avec un client connu, ne pas déclencher needsSave
    if (isKnownCustomer) {
      setNeedsSave(false);
      onCustomerChange?.(formData.customer_id || null, false);
      return;
    }

    if (selectedCustomer) {
      const currentFullname = [
        selectedCustomer.first_name,
        selectedCustomer.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      // Normaliser les valeurs vides pour comparaison
      const normalizeValue = (val: string | null | undefined) => val || "";

      const hasChanged =
        normalizeValue(formData.fullname) !== normalizeValue(currentFullname) ||
        normalizeValue(formData.phone) !== normalizeValue(selectedCustomer.phone) ||
        normalizeValue(formData.email) !== normalizeValue(selectedCustomer.email);

      if (hasChanged) {
        setNeedsSave(true);
        setSelectedCustomer(null);
        setIsKnownCustomer(false);
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#F17922]">
            <UserRound className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-[15px] font-bold text-gray-800">Client</h3>
            <p className="text-xs text-gray-400">
              Recherchez un client existant ou saisissez-en un nouveau.
            </p>
          </div>
        </div>
        {(selectedCustomer || isKnownCustomer) && (
          <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
            Client existant
          </span>
        )}
        {needsSave && !selectedCustomer && !isKnownCustomer && (
          <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#F17922]">
            Nouveau client
          </span>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <div className="flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 transition focus-within:border-[#F17922] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F17922]/15">
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
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
            className="w-full bg-transparent py-2.5 text-[13px] font-semibold text-[#595959] placeholder:font-normal placeholder:text-gray-400 focus:outline-none"
            placeholder="Rechercher un client (nom, téléphone, email)..."
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin text-[#F17922]" />
          )}
        </div>

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
      <div>
        <label htmlFor="fullname" className="text-xs font-semibold text-gray-500 mb-1.5 block">
          Nom complet *
        </label>
        <input
          type="text"
          id="fullname"
          value={formData.fullname || ""}
          onChange={(e) => onFormDataChange({ fullname: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#595959] placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition"
          placeholder="Nom complet du client"
        />
      </div>

      {/* Téléphone */}
      <div>
        <label htmlFor="phone" className="text-xs font-semibold text-gray-500 mb-1.5 block">
          Téléphone *
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone || ""}
          onChange={(e) => onFormDataChange({ phone: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#595959] placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition"
          placeholder="+225 07 07 07 07 07"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="text-xs font-semibold text-gray-500 mb-1.5 block">
          Email <span className="font-normal text-gray-400">(facultatif)</span>
        </label>
        <input
          type="email"
          id="email"
          value={formData.email || ""}
          onChange={(e) => onFormDataChange({ email: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#595959] placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition"
          placeholder="Email du client"
        />
      </div>

      {/* Bouton d'enregistrement pour nouveau client */}
      {needsSave && !selectedCustomer && (
        <motion.button
          type="button"
          onClick={handleSaveNewCustomer}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F17922] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer ce nouveau client"
          )}
        </motion.button>
      )}
    </div>
  );
};

export default CustomerInfoSection;
