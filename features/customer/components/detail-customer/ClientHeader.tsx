import {
  Award,
  Calendar,
  Heart,
  Mail,
  Phone,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { StatCard } from "./StatCard";
import { CustomerMapperData } from "../../types/customer-mapper.types";

interface ClientHeaderProps {
  customerData: CustomerMapperData;
}

export function ClientHeader({ customerData }: ClientHeaderProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-700";
      case "Nouveau":
        return "bg-blue-100 text-blue-700";
      case "Supprimé":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
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
                  {customerData.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
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
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                      customerData.status
                    )}`}
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
          <StatCard
            icon={<ShoppingBag className="w-5 h-5 text-white" />}
            value={customerData.stats.totalOrders}
            label="Commandes"
            gradient="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            value={`${customerData.stats.totalSpent.toLocaleString()} F`}
            label="Total dépensé"
            gradient="emerald"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-white" />}
            value={customerData.stats.loyaltyPoints}
            label="Points fidélité"
            gradient="amber"
          />
          <StatCard
            icon={<Heart className="w-5 h-5 text-white" />}
            value={customerData.stats.favorites}
            label="Favoris"
            gradient="rose"
          />
        </div>
      </div>
    </div>
  );
}
