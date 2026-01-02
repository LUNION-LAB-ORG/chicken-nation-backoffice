"use client";

import {
  Award,
  Calendar,
  CreditCard,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { OrderStatusBadge } from "../../../orders/components/OrderStatusBadge";
import { useCustomerDetailQuery } from "../../queries/customer-detail.query";
import { mapCustomerData } from "../../utils/customer-mapper";
import { ErrorState, LoadingState } from "@/components/TableStates";

interface ClientDetailPageProps {
  clientId: string;
}

export function ClientDetail({ clientId }: ClientDetailPageProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "favorites" | "reviews" | "addresses"
  >("overview");

  const { data, isLoading, error } = useCustomerDetailQuery(clientId);

  const customerData = isLoading ? null : mapCustomerData(data);

  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return (
      <ErrorState error={error} title="Erreur lors du chargement du client" />
    );
  }
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Card with Customer Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner Background */}
        <div className="h-36 bg-gradient-to-r from-[#F17922] to-[#ff9f5a]" />

        <div className="px-6 md:px-8 pb-6">
          {/* Profile Section */}
          <div className="flex flex-col md:flex-row gap-6 -mt-16 mb-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                {customerData.image ? (
                  <Image
                    src={customerData.image || "/placeholder.svg"}
                    alt={customerData.fullName}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#F17922] to-[#ff9f5a] flex items-center justify-center text-white text-3xl font-bold">
                    {customerData.fullName}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 mt-16 md:mt-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {customerData.fullName}
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        customerData.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : customerData.status === "Nouveau"
                          ? "bg-blue-100 text-blue-700"
                          : customerData.status === "Supprimé"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {customerData.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {customerData.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span>{customerData.email}</span>
                      </div>
                    )}
                    {customerData.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4" />
                        <span>{customerData.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Membre depuis {customerData.memberSince}</span>
                    </div>
                  </div>
                </div>

                {/* Loyalty Badge */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                  <Award className="w-5 h-5 text-[#F17922]" />
                  <div>
                    <div className="text-xs font-medium text-gray-600">
                      Niveau de fidélité
                    </div>
                    <div className="text-sm font-bold text-[#F17922] uppercase">
                      {customerData.loyaltyLevel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {customerData.stats.totalOrders}
                  </div>
                  <div className="text-xs text-gray-600">Commandes</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {customerData.stats.totalSpent.toLocaleString()} F
                  </div>
                  <div className="text-xs text-gray-600">Total dépensé</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {customerData.stats.loyaltyPoints}
                  </div>
                  <div className="text-xs text-gray-600">Points fidélité</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500 rounded-lg">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {customerData.stats.favorites}
                  </div>
                  <div className="text-xs text-gray-600">Favoris</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "overview"
                ? "bg-[#F17922] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "orders"
                ? "bg-[#F17922] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Commandes
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "favorites"
                ? "bg-[#F17922] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Favoris
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "reviews"
                ? "bg-[#F17922] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Avis
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "addresses"
                ? "bg-[#F17922] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Adresses
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
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
                      {item.type === "Gagné" || item.type === "Bonus"
                        ? "+"
                        : "-"}
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
                      <div className="text-xs text-gray-500">
                        {dish.category}
                      </div>
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
                      <span className="text-xs text-gray-500">
                        {review.date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {review.comment}
                    </p>
                    {review.dishName && (
                      <div className="mt-2 text-xs text-gray-500">
                        Plat:{" "}
                        <span className="font-medium">{review.dishName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
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
                      Type
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
                        <div className="text-sm text-gray-600">
                          {order.date}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-sm text-gray-900">
                          {order.amount.toLocaleString()} F
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <CreditCard className="w-3.5 h-3.5" />
                          {order.paymentMethod === "MOBILE_MONEY"
                            ? "Mobile Money"
                            : order.paymentMethod === "CARD"
                            ? "Carte"
                            : "Espèces"}
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
        )}

        {activeTab === "favorites" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customerData.favoriteDishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video w-full bg-gray-200 overflow-hidden">
                  <Image
                    src={dish.image || "/placeholder.svg"}
                    alt={dish.name}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{dish.name}</h4>
                    <Heart className="w-5 h-5 fill-rose-500 text-rose-500 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{dish.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#F17922]">
                      {dish.price.toLocaleString()} F
                    </span>
                    <span className="text-xs text-gray-500">
                      Ajouté le {dish.addedDate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Tous les avis ({customerData.reviews.length})
              </h3>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-900">
                  {(
                    customerData.reviews.reduce((acc, r) => acc + r.rating, 0) /
                    customerData.reviews.length
                  ).toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">/ 5</span>
              </div>
            </div>

            <div className="space-y-4">
              {customerData.reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F17922] to-[#ff9f5a] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {customerData.fullName}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {customerData.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {review.date}
                          </div>
                        </div>
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
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {review.comment}
                      </p>
                      {review.dishName && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                          <span className="font-medium">Plat:</span>{" "}
                          {review.dishName}
                        </div>
                      )}
                      {review.orderRef && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600 ml-2">
                          <span className="font-medium">Commande:</span> #
                          {review.orderRef}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "addresses" && (
          <div className="grid md:grid-cols-2 gap-6">
            {customerData.addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {address.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {address.fullAddress}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {address.city && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                          {address.city}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 bg-blue-100 rounded-md text-xs text-blue-700">
                        📍 {address.latitude.toFixed(4)},{" "}
                        {address.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
