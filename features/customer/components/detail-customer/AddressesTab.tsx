import { MapPin } from "lucide-react";
import { CustomerMapperData } from "../../types/customer-mapper.types";

interface AddressesTabProps {
  customerData: CustomerMapperData;
}

export function AddressesTab({ customerData }: AddressesTabProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {customerData.addresses.map((address) => (
        <div
          key={address.id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="bg-linear-to-br from-[#F17922] to-[#ff9f5a] rounded-lg shrink-0">
              <MapPin className="w-6 h-6 text-white" />
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
                <span className="inline-flex items-center px-2 py-1 bg-orange-100 rounded-md text-xs text-orange-700">
                  📍 {address.latitude.toFixed(4)},{" "}
                  {address.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
