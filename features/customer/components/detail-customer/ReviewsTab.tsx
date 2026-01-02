import { Star } from "lucide-react";
import { CustomerMapperData } from "../../types/customer-mapper.types";

interface ReviewsTabProps {
  customerData: CustomerMapperData;
}

export function ReviewsTab({ customerData }: ReviewsTabProps) {
  const averageRating =
    customerData.reviews.length > 0
      ? (
          customerData.reviews.reduce((acc, r) => acc + r.rating, 0) /
          customerData.reviews.length
        ).toFixed(1)
      : "0";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Tous les avis ({customerData.reviews.length})
        </h3>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-gray-900">{averageRating}</span>
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
                {customerData.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {customerData.fullName}
                    </div>
                    <div className="text-xs text-gray-500">{review.date}</div>
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
                <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                <div className="flex flex-wrap gap-2">
                  {review.dishName && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                      <span className="font-medium">Plat:</span>{" "}
                      {review.dishName}
                    </div>
                  )}
                  {review.orderRef && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                      <span className="font-medium">Commande:</span> #
                      {review.orderRef}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
