import { Heart } from "lucide-react";
import Image from "next/image";
import { CustomerMapperData } from "../../types/customer-mapper.types";

interface FavoritesTabProps {
  customerData: CustomerMapperData;
}

export function FavoritesTab({ customerData }: FavoritesTabProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {customerData.favoriteDishes.map((dish) => (
        <div
          key={dish.id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="aspect-video w-full bg-gray-200 overflow-hidden">
            <Image
              src={dish.image}
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
  );
}
