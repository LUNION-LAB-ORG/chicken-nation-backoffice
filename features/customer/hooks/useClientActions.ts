import { useDashboardStore } from "@/store/dashboardStore";
import { useCallback, useState } from "react";
import { Customer } from "../types/customer.types";

export const useClientActions = () => {
    const { setSelectedItem, setSectionView, toggleModal } = useDashboardStore();
    const [isLoading, setIsLoading] = useState(false);

    // Handle pour voir le profil du client
    const handleViewClientProfile = useCallback(
        (client: Customer) => {
            setSelectedItem("clients", client.id);
            setSectionView("clients", "view");
        },
        [setSelectedItem, setSectionView]
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