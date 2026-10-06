import { useDashboardStore } from "@/store/dashboardStore";
import { useCallback, useState } from "react";
import { Customer } from "../types/customer.types";

export const useClientActions = () => {
    const { setActiveTab, setSelectedItem, setSectionView, toggleModal, openCrmRecherche } = useDashboardStore();
    const [isLoading, setIsLoading] = useState(false);

    // Handle pour voir le profil du client
    const handleViewClientProfile = useCallback(
        (client: Customer) => {
            /**
             * La page Clients a fusionné dans le CRM : ce lien y renvoyait et
             * ne menait donc plus nulle part. On ouvre maintenant la liste des
             * contacts filtrée sur la personne, par son numéro — c'est ce qui
             * l'identifie partout, y compris pour un contact Glovo ou Yango
             * sans compte. Son dossier complet s'ouvre depuis sa fiche.
             */
            const recherche = client?.phone?.trim() || [client?.first_name, client?.last_name].filter(Boolean).join(" ").trim();
            if (!recherche) return;
            openCrmRecherche(recherche);
        },
        [openCrmRecherche]
    );


    // Handle pour supprimer le client
    const handleDeleteClient = useCallback(
        async (clientId: string) => {
            try {
                setIsLoading(true);

                // Afficher une modal de confirmation
                toggleModal("clients", "delete");

                console.log("Suppression du client:", clientId);
            } catch (error) {
                console.error("Erreur lors de la suppression du client:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [toggleModal]
    );

    // Handle pour créer un nouveau client
    const handleCreateClient = useCallback(() => {
        setSelectedItem("clients", null);
        setSectionView("clients", "create");
    }, [setSelectedItem, setSectionView]);

    // Handle pour ouvrir/fermer une modal
    const handleToggleClientModal = useCallback(
        (client: Customer | null, modalName: string) => {
            if (client) {
                setSelectedItem("clients", client.id);
            }
            toggleModal("clients", modalName);
        },
        [toggleModal, setSelectedItem]
    );

    return {
        handleViewClientProfile,
        handleDeleteClient,
        handleCreateClient,
        handleToggleClientModal,
        isLoading,
    };
};