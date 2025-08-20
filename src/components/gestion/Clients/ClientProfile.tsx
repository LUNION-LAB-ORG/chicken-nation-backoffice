"use client"

import { useState, useEffect } from "react"
import { TabButton } from "./TabButton"
import { IdentificationTab } from "./IdentificationTab"
import { OrdersTab } from "./OrdersTab"
import { ReviewsTab } from "./ReviewsTab" 
import { useCustomerStore } from "@/store/customerStore"
import { getCustomerReviews, getCustomerOrders, PaginatedResponse, Customer, deleteCustomer } from "@/services/customerService"
import { useRBAC } from '@/hooks/useRBAC'
import Image from "next/image" 

const API_URL = process.env.NEXT_PUBLIC_API_URL
interface Client {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string;
  addresses?: Array<{
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  }>;
  image?: string | null;
  created_at: string;
  updated_at: string;
  entity_status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'NEW';
  birth_day?: string | null;
  orderHistory?: Array<{
    id: string;
    date: string;
    total: number;
    amount?: number;
    paymentMethod: string;
    status: string;
    reference: string;
    paiements?: Array<{
      mode: string;
      amount: number;
      status: string;
    }>;
  }>;
  [key: string]: unknown;
}

interface ClientProfileProps {
  clientId: string;
  onClose: () => void;
}

// Interfaces pour les données de reviews et orders
interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  date: string;
  [key: string]: unknown;
}

interface Order {
  id: string;
  total: string | number;
  date: string;
  status: string;
  paymentMethod: string;
  [key: string]: unknown;
}

export function ClientProfile({ clientId, onClose }: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState("identification")
  const [isLoading, setIsLoading] = useState(true)
  const [clientReviews, setClientReviews] = useState<Review[]>([])
  const [clientOrders, setClientOrders] = useState<Order[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { fetchCustomerById } = useCustomerStore()
  const { canDeleteClient } = useRBAC()

  // Charger les données du client au montage du composant
  useEffect(() => {
    const loadClientData = async () => {
      setIsLoading(true)
      try {
        // ✅ Utiliser fetchCustomerById qui fait un appel API au lieu de getCustomerById qui cherche dans le cache
        const fetchedCustomer = await fetchCustomerById(clientId)
        if (!fetchedCustomer) {
          console.error("Client non trouvé via l'API")
          setCustomer(null)
          return
        }

        // ✅ Mettre à jour l'état local avec le client récupéré
        setCustomer(fetchedCustomer)

        // Charger les avis du client
        try {
          const reviewsData = await getCustomerReviews(clientId) as unknown as PaginatedResponse<Review>;
          setClientReviews(reviewsData.data || [])
        } catch (error) {
          console.error("Erreur lors du chargement des avis:", error)
          setClientReviews([])
        }

        // Charger les commandes du client
        try {
          const ordersData = await getCustomerOrders(clientId) as unknown as PaginatedResponse<Order>;
          const processedOrders = (ordersData.data || []).map(order => ({
            ...order,
            paymentMethod: order.paymentMethod || 'cash'
          }));
          setClientOrders(processedOrders)
        } catch (error) {
          console.error("Erreur lors du chargement des commandes:", error)
          setClientOrders([])
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données client:", error)
        setCustomer(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadClientData()
  }, [clientId, fetchCustomerById])

  if (isLoading) {
    return (
      <div className="bg-white p-4 sm:p-6 lg:px-8 xl:px-24 2xl:px-64 rounded-xl shadow-sm flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="bg-white p-4 sm:p-6 lg:px-8 xl:px-24 2xl:px-64 rounded-xl shadow-sm text-center py-8">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Client introuvable</h3>
        <p className="text-gray-500 mb-6">
          Ce client n&apos;existe plus, a été supprimé ou vous n&apos;avez pas les permissions pour le consulter.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-[#F17922] text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  // Formatage de la date d'inscription
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date inconnue"
    if (dateString.includes(",")) return dateString

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(':', 'h')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return dateString
    }
  }

  // Construction du nom complet
  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || ''

 

  // Préparer l'historique des commandes avec les vraies données
  const orderHistory = clientOrders.map(order => ({
    id: order.id,
    reference: String(order.reference || order.id),
    date: String(order.created_at || order.date || ''),
    total: Number(order.amount || (typeof order.total === 'string' ? parseFloat(order.total) : order.total) || 0),
    paymentMethod: String(order.paymentMethod || 'cash'),
    status: String(order.status || 'pending'), 
    amount: Number(order.amount || 0),
    paiements: Array.isArray(order.paiements) ? order.paiements.map((p: unknown) => ({
      mode: String((p as Record<string, unknown>)?.mode || 'cash'),
      amount: Number((p as Record<string, unknown>)?.amount || 0),
      status: String((p as Record<string, unknown>)?.status || 'completed')
    })) : undefined
  }));
 
  const adaptedClient = {
    ...customer,
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    phone: customer.phone || '',
    image: customer.image,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
    entity_status: customer.entity_status,
    birth_day: customer.birth_day,
    addresses: (customer.addresses || []).map(addr => ({
      id: addr.id || '',
      street: addr.address || addr.street || '',
      city: addr.name || addr.city || '',
      postalCode: addr.postal_code || '',
      country: addr.country || 'Côte d\'Ivoire'
    })),
    orderHistory
  } satisfies Client;

  return (
    <>
      <div className="bg-white p-4 sm:p-6 lg:px-8 xl:px-24 2xl:px-64 rounded-xl shadow-sm">
    

        <div className="flex flex-col items-center">
          <div>
          {
            customer.image? (
              <Image
                src={customer.image.startsWith('http') || customer.image.startsWith('/') ? customer.image : `${API_URL}/${customer.image}`}
                alt="Client"
                width={170}
                height={170}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-42.5 h-42.5 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="gray" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg> 
              </div>
            )}
          </div>

          <h2 className="text-base sm:text-lg mt-4 font-medium font-sofia-pro text-gray-900">{fullName}</h2>
        </div>

      <div className="mt-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-center items-center sm:space-x-8 space-y-2 sm:space-y-0">
          <TabButton
            label="Identification"
            isActive={activeTab === "identification"}
            onClick={() => setActiveTab("identification")}
          />
          <TabButton
            label="Commandes"
            isActive={activeTab === "commandes"}
            onClick={() => setActiveTab("commandes")}
          />
          <TabButton
            label="Commentaires"
            isActive={activeTab === "commentaires"}
            onClick={() => setActiveTab("commentaires")}
          />
        </div>
      </div>

      <div className="mt-6 w-full max-w-[1400px] mx-auto">
        {activeTab === "identification" && (
          <IdentificationTab
            client={adaptedClient}
            fullName={fullName}
            formatDate={formatDate}
          />
        )}

        {activeTab === "commandes" && (
          <OrdersTab
            client={adaptedClient}
            formatDate={formatDate}
          />
        )}

        {activeTab === "commentaires" && (
          <ReviewsTab
            clientReviews={clientReviews}
            client={{
              firstName: adaptedClient.first_name || '',
              id: clientId, 
              ...adaptedClient as unknown as { [key: string]: unknown }
            }}
            fullName={fullName}
            formatDate={formatDate}
          />
        )} 
        </div>
      </div>

     
    </>
  )
}
