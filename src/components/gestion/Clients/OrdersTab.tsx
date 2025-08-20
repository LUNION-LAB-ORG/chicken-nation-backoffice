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
  orderHistory: Array<{
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

}

interface OrdersTabProps {
  client: Client;
  formatDate: (date: string) => string;
}

export function OrdersTab({ client, formatDate }: OrdersTabProps) {
  // Fonction pour traduire le statut en français
  const translateStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PICKED_UP':
        return 'Récupérée';
      case 'DELIVERED':
        return 'Livrée';
      case 'PENDING':
        return 'En attente';
      case 'CANCELLED':
        return 'Annulée';
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return 'En préparation';
      case 'READY':
        return 'Prête';
      case 'COLLECTED':
        return 'Collectée';
      case 'COMPLETED':
        return 'Terminée';
      case 'NEW':
      case 'NOUVELLE':
        return 'Nouvelle';
      case 'ACCEPTED':
        return 'Acceptée';
      default:
        return status || 'Inconnu';
    }
  };

  // Fonction pour déterminer le mode de paiement réel
  const getPaymentMethod = (order: Client['orderHistory'][0]) => {
    // Vérifier d'abord dans les paiements
    if (order.paiements && order.paiements.length > 0) {
      const payment = order.paiements[0];
      switch (payment.mode?.toUpperCase()) {
        case 'MOBILE_MONEY':
          return 'Mobile Money';
        case 'CARD':
          return 'Carte';
        case 'CASH':
          return 'Espèces';
        default:
          return payment.mode || 'Espèces';
      }
    }

    // Fallback sur paymentMethod
    switch (order.paymentMethod?.toLowerCase()) {
      case 'mobile_money':
        return 'Mobile Money';
      case 'card':
        return 'Carte';
      case 'cash':
        return 'Espèces';
      default:
        return 'Espèces';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
        <h3 className="text-sm font-medium text-gray-700">
          Total des commandes : <span className="text-orange-500">{client.orderHistory?.length || 0}</span>
        </h3>
      </div>

      {/* Vue bureau - Tableau (caché sur mobile) */}
      <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-xl">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                <th className="px-3 py-3 sm:px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(client?.orderHistory) && client.orderHistory.length > 0 ? (
                client.orderHistory.map((order) => (
                  <tr key={order.reference} className="hover:bg-gray-50">
                    <td className="px-3 py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">#{order.reference}</td>
                    <td className="px-3 py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-gray-500">{formatDate(order.date)}</td>
                    <td className="px-3 py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {(order.amount || order.total || 0).toLocaleString('fr-FR')} F
                    </td>
                    <td className="px-3 py-4 sm:px-6 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {getPaymentMethod(order)}
                    </td>
                    <td className="px-3 py-4 sm:px-6 whitespace-nowrap">
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 inline-flex text-xs leading-5 font-semibold rounded-xl ${
                        order.status?.toUpperCase() === 'DELIVERED' || order.status?.toUpperCase() === 'PICKED_UP' ? 'bg-[#4FCBBA] text-white' :
                        order.status?.toUpperCase() === 'COLLECTED' || order.status?.toUpperCase() === 'COLLECTED' ? 'bg-[#5bcb4f] text-white' :
                        order.status?.toUpperCase() === 'PENDING' || order.status?.toUpperCase() === 'NEW' ? 'bg-[#FBD2B5] text-slate-600' :
                        order.status?.toUpperCase() === 'CANCELLED' ? 'bg-black text-[#FDE9DA]' :
                        order.status?.toUpperCase() === 'IN_PROGRESS' || order.status?.toUpperCase() === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        order.status?.toUpperCase() === 'COMPLETED' || order.status?.toUpperCase() === 'READY' ? 'bg-orange-500 text-white' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-4 sm:px-6 whitespace-nowrap text-sm text-gray-500 text-center">
                    Aucune commande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vue mobile - Cards (visible uniquement sur mobile) */}
      <div className="sm:hidden">
        {Array.isArray(client?.orderHistory) && client.orderHistory.length > 0 ? (
          <div className="space-y-4">
            {client.orderHistory.map((order) => (
              <div key={order.reference} className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm font-semibold text-gray-900">#{order.reference}</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.status?.toUpperCase() === 'DELIVERED' || order.status?.toUpperCase() === 'PICKED_UP' ? 'bg-[#4FCBBA] text-white' :
                    order.status?.toUpperCase() === 'PENDING' || order.status?.toUpperCase() === 'NEW' ? 'bg-[#FBD2B5] text-slate-600' :
                    order.status?.toUpperCase() === 'CANCELLED' ? 'bg-black text-[#FDE9DA]' :
                    order.status?.toUpperCase() === 'IN_PROGRESS' || order.status?.toUpperCase() === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                    order.status?.toUpperCase() === 'COMPLETED' || order.status?.toUpperCase() === 'READY' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {translateStatus(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 mb-1">Date</p>
                    <p className="font-medium">{formatDate(order.date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Montant</p>
                    <p className="font-medium">
                      {(order.amount || order.total || 0).toLocaleString('fr-FR')} F
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Paiement</p>
                    <p className="font-medium">
                      {getPaymentMethod(order)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 text-center bg-gray-50 p-4 rounded-xl">
            Aucune commande trouvée
          </div>
        )}
      </div>
    </div>
  )
}
