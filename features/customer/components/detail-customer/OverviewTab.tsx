import {
  Award,
  Heart,
  MessageSquare,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { OrderStatusBadge } from "../../../orders/components/OrderStatusBadge";
import { CustomerMapperData } from "../../types/customer-mapper.types";

interface OverviewTabProps {
  customerData: CustomerMapperData;
}

export function OverviewTab({ customerData }: OverviewTabProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#F17922]" />
          Commandes récentes
        </h3>
        <div className="space-y-3">
          {customerData.recentOrders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  #{order.reference}
                </div>
                <div className="text-xs text-gray-500">{order.date}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm text-gray-900">
                  {order.amount.toLocaleString()} F
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loyalty Points History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#F17922]" />
          Historique des points
        </h3>
        <div className="space-y-3">
          {customerData.loyaltyHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    item.type === "Gagné" || item.type === "Bonus"
                      ? "bg-emerald-100"
                      : item.type === "Utilisé"
                      ? "bg-rose-100"
                      : "bg-gray-100"
                  }`}
                >
                  {item.type === "Gagné" || item.type === "Bonus" ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Star className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.reason}
                  </div>
                  <div className="text-xs text-gray-500">{item.date}</div>
                </div>
              </div>
              <div
                className={`font-semibold text-sm ${
                  item.type === "Gagné" || item.type === "Bonus"
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {item.type === "Gagné" || item.type === "Bonus" ? "+" : "-"}
                {item.points} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite Dishes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#F17922]" />
          Plats favoris
        </h3>
        <div className="space-y-3">
          {customerData.favoriteDishes.slice(0, 4).map((dish) => (
            <div
              key={dish.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                <Image
                  src={dish.image || "/placeholder.svg"}
                  alt={dish.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {dish.name}
                </div>
                <div className="text-xs text-gray-500">{dish.category}</div>
              </div>
              <div className="text-sm font-semibold text-[#F17922]">
                {dish.price.toLocaleString()} F
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#F17922]" />
          Derniers avis
        </h3>
        <div className="space-y-4">
          {customerData.reviews.slice(0, 3).map((review) => (
            <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{review.date}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {review.comment}
              </p>
              {review.dishName && (
                <div className="mt-2 text-xs text-gray-500">
                  Plat: <span className="font-medium">{review.dishName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
