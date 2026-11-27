"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeftRight, Loader2, Search, UserRound } from "lucide-react";
import { toast } from "react-hot-toast";
import { OrderFormData } from "../../types/order-form.types";
import EnTeteSection from "./EnTeteSection";
import { Customer } from "../../../customer/types/customer.types";
import { useCustomerListQuery } from "../../../customer/queries/customer-list.query";
import { useCustomerAddMutation } from "../../../customer/queries/customer-add.mutation";
import { useClientParTelephoneQuery } from "../../../customer/queries/client-par-telephone.query";
import { trouverClientParTelephone } from "../../../customer/services/customer.service";
import {
  prepareCustomerData,
  validateCustomerForm,
} from "../../../customer/utils/customerFormValidation";
import {
  changeDeClient,
  ClientRattache,
  etatClientCommande,
  ficheClient,
  memeNumero,
  prenomEtNom,
} from "../../utils/client-commande";

interface CustomerInfoSectionProps {
  formData: OrderFormData;
  onFormDataChange: (data: Partial<OrderFormData>) => void;
  onCustomerChange?: (customerId: string | null, needsSave: boolean) => void;
  isEditMode?: boolean;
}

/**
 * Client de la commande. Le NUMÉRO désigne le client (règles :
 * utils/client-commande.ts) : même numéro, même client ; autre numéro, la
 * commande passe au client qui le porte, ou à un nouveau client enregistré à
 * la validation. Vaut à la création comme en modification (27/11) : avant, en
 * modification, le client de la commande restait rattaché quoi qu'on saisisse.
 */
const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  formData,
  onFormDataChange,
  onCustomerChange,
  isEditMode = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  // Client auquel la saisie est rattachée. En modification : celui de la commande.
  const [rattache, setRattache] = useState<ClientRattache | null>(() =>
    isEditMode && formData.customer_id
      ? {
          id: formData.customer_id,
          fullname: formData.fullname || "",
          phone: formData.phone || "",
          email: formData.email || "",
        }
      : null
  );
  // Client de la commande à l'ouverture : sert à dire qu'on en change.
  const [clientDepart] = useState<ClientRattache | null>(rattache);
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

  // Rattacher la saisie à un client connu (choisi dans la recherche, ou
  // reconnu à son numéro). Un profil sans nom ne vide pas le nom déjà saisi.
  const rattacher = useCallback(
    (customer: Customer, nomSaisi?: string) => {
      const fiche = ficheClient(customer);
      setRattache(fiche);
      setSearchTerm("");
      setShowResults(false);
      setNeedsSave(false);

      onFormDataChange({
        fullname: fiche.fullname || nomSaisi || undefined,
        phone: fiche.phone || undefined,
        email: fiche.email || undefined,
        customer_id: fiche.id,
      });

      onCustomerChange?.(fiche.id, false);
    },
    [onFormDataChange, onCustomerChange]
  );

  // Sélectionner un client existant dans la recherche
  const handleSelectCustomer = useCallback(
    (customer: Customer) => rattacher(customer),
    [rattacher]
  );

  // La saisie désigne-t-elle encore le client rattaché ?
  const etat = etatClientCommande(formData, rattache);
  useEffect(() => {
    if (etat.etat === "rattache") {
      setNeedsSave(false);
      onCustomerChange?.(etat.client.id, false);
      return;
    }
    // Autre numéro (ou fiche vidée) : ce n'est plus ce client.
    if (rattache) setRattache(null);
    if (etat.etat === "vide") {
      setNeedsSave(false);
      onCustomerChange?.(null, false);
      return;
    }
    setNeedsSave(true);
    onCustomerChange?.(null, true);
  }, [formData.fullname, formData.phone, formData.email]);

  // Autre numéro, complet : appartient-il déjà à un client ? Cherché un
  // instant après la dernière frappe.
  const numeroAChercher = etat.etat === "autre" ? etat.telephone : null;
  const [numeroCherche, setNumeroCherche] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setNumeroCherche(numeroAChercher), 400);
    return () => clearTimeout(timer);
  }, [numeroAChercher]);
  const { data: clientDuNumero, isFetching: verification } = useClientParTelephoneQuery(numeroCherche);
  useEffect(() => {
    if (!clientDuNumero || rattache) return;
    // La saisie a pu changer pendant la recherche.
    if (!memeNumero(clientDuNumero.phone, formData.phone)) return;
    rattacher(clientDuNumero, formData.fullname);
  }, [clientDuNumero, numeroCherche]);
  const enVerification =
    needsSave && !!numeroAChercher && (verification || numeroCherche !== numeroAChercher);

  /**
   * Donne un identifiant au client saisi : celui du client qui porte déjà ce
   * numéro, sinon celui du client créé. `null` : fiche invalide (message
   * déjà affiché).
   */
  const enregistrerClient = useCallback(async (): Promise<string | null> => {
    const { first_name, last_name } = prenomEtNom(formData.fullname);
    const fiche = {
      phone: formData.phone,
      first_name,
      last_name,
      email: formData.email || "",
    };
    if (!validateCustomerForm(fiche)) {
      return null;
    }

    // Le numéro est peut-être déjà celui d'un client (recherche pas encore
    // revenue) : la commande lui revient, sans tenter de le créer en double.
    const existant = await trouverClientParTelephone(formData.phone);
    const client = existant ?? (await addCustomer(prepareCustomerData(fiche)));
    if (!client?.id) return null;

    // Le nom saisi reste : il est inscrit sur la commande.
    setRattache({ ...ficheClient(client), phone: client.phone || formData.phone });
    setNeedsSave(false);
    onFormDataChange({ customer_id: client.id, phone: client.phone || formData.phone });
    onCustomerChange?.(client.id, false);
    return client.id;
  }, [formData, addCustomer, onFormDataChange, onCustomerChange]);

  // Bouton « Enregistrer ce nouveau client »
  const [enregistrement, setEnregistrement] = useState(false);
  const handleSaveNewCustomer = async () => {
    setEnregistrement(true);
    try {
      const id = await enregistrerClient();
      if (id) toast.success("Client enregistré avec succès");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du client:", error);
    } finally {
      setEnregistrement(false);
    }
  };

  // Fonction publique pour sauvegarder le client (appelée depuis le formulaire principal)
  const saveCustomerIfNeeded = useCallback(async (): Promise<string | null> => {
    if (!needsSave) {
      return formData.customer_id || null;
    }
    try {
      return await enregistrerClient();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du client:", error);
      throw error;
    }
  }, [needsSave, formData.customer_id, enregistrerClient]);

  // Exposer la fonction via un ref callback
  useEffect(() => {
    if (onCustomerChange) {
      // Stocker la fonction dans le composant parent via un callback spécial
      (window as any).__saveCustomerIfNeeded = saveCustomerIfNeeded;
    }
  }, [saveCustomerIfNeeded, onCustomerChange]);

  // Modification : la commande change de client, on le dit avant la validation.
  const changement = changeDeClient(clientDepart, rattache, needsSave);
  const nomDepart = clientDepart?.fullname || clientDepart?.phone || "son client actuel";

  return (
    <div className="space-y-4">
      <EnTeteSection
        Icone={UserRound}
        titre="Client"
        sousTitre="Recherchez un client existant ou saisissez-en un nouveau."
        droite={
          rattache ? (
            <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
              Client existant
            </span>
          ) : enVerification ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Vérification du numéro
            </span>
          ) : needsSave ? (
            <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#F17922]">
              Nouveau client
            </span>
          ) : undefined
        }
      />

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
            className="w-full bg-transparent py-2.5 text-[13px] font-semibold text-hex-595959 placeholder:font-normal placeholder:text-gray-400 focus:outline-none"
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
                className="absolute z-50 w-full mt-2 bg-white border-2 border-hex-d9d9d9 rounded-2xl shadow-lg max-h-[300px] overflow-y-auto"
              >
                {customersData.data.map((customer: Customer) => (
                  <motion.button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full px-4 py-3 text-left hover:bg-hex-f5f5f5 border-b border-hex-d9d9d9/30 last:border-b-0 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-hex-595959 text-sm">
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
                  <div className="flex items-center justify-between px-4 py-2 bg-hex-f5f5f5 border-t border-hex-d9d9d9">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs font-semibold text-hex-595959 disabled:opacity-50"
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
                      className="text-xs font-semibold text-hex-595959 disabled:opacity-50"
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
              className="absolute z-50 w-full mt-2 bg-white border-2 border-hex-d9d9d9 rounded-2xl shadow-lg p-4"
            >
              <p className="text-sm text-gray-500 text-center">
                Aucun client trouvé. Saisissez les informations ci-dessous.
              </p>
            </motion.div>
          )}
      </div>

      {/* Nom, téléphone, email : côte à côte quand la carte est large.
          ⚠️ La recherche reste hors de ce conteneur : sa liste de résultats
          doit passer au-dessus des blocs suivants. */}
      <div className="@container">
      <div className="grid grid-cols-1 gap-4 @[26rem]:grid-cols-2 @[38rem]:grid-cols-3">
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
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-hex-595959 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition"
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
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-hex-595959 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition"
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
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-hex-595959 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition"
          placeholder="Email du client"
        />
      </div>
      </div>
      </div>

      {/* Modification : la commande passe à un autre client */}
      {changement && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-800">
            {rattache
              ? `La commande ne sera plus au nom de ${nomDepart} : elle passera à ce client.`
              : `La commande ne sera plus au nom de ${nomDepart} : elle passera à ce nouveau client, enregistré à la validation.`}
          </p>
        </div>
      )}

      {/* Bouton d'enregistrement pour nouveau client */}
      {needsSave && !rattache && !enVerification && (
        <motion.button
          type="button"
          onClick={handleSaveNewCustomer}
          disabled={isPending || enregistrement}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F17922] px-4 py-2.5 text-[13px] font-semibold text-blanc transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isPending || enregistrement ? (
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
