import { CreditCard } from "lucide-react";
import { OrderStatusBadge } from "../../../orders/components/OrderStatusBadge";
import { CustomerMapperData } from "../../types/customer-mapper.types";

interface OrdersTabProps {
  customerData: CustomerMapperData;
}

export function OrdersTab({ customerData }: OrdersTabProps) {
 
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Toutes les commandes ({customerData.recentOrders.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Référence
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Date
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Montant
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Paiement
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {customerData.recentOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-sm text-gray-900">
                    #{order.reference}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-600">{order.date}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-semibold text-sm text-gray-900">
                    {order.amount.toLocaleString()} F
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <CreditCard className="w-3.5 h-3.5" />
                    {order.paymentMode}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
