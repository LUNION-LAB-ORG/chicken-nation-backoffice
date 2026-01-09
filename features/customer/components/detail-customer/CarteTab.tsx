import { formatImageUrl } from "@/utils/imageHelpers";
import { Calendar, CreditCard, Eye, QrCode, XCircle } from "lucide-react";
import Image from "next/image";
import { dateToLocalString } from "../../../../utils/date/format-date";
import { CustomerMapperData } from "../../types/customer-mapper.types";
import { getStatusBadgeCard } from "../../carte-nation/utils/getStatusBadgeCard";
import { QRCode } from "@/components/kibo-ui/qr-code";
import { useState } from "react";
import { CardRequest } from "../../carte-nation/types/carte-nation.types";

interface CarteTabProps {
  customerData: CustomerMapperData;
}

export function CarteTab({ customerData }: CarteTabProps) {
  const nationCards =
    customerData?.nationCards && customerData?.nationCards.length
      ? customerData?.nationCards[0]
      : null;
  const cardRequests = customerData?.cardRequests || [];
  const [showImage, setShowImage] = useState<{
    request: CardRequest | null;
    status: boolean;
  }>({
    request: null,
    status: false,
  });
  return (
    <>
      <div className="space-y-6">
        {/* Nation Card if exists */}
        {nationCards && (
          <div className="bg-linear-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-orange-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-linear-to-br from-[#F17922] to-[#ff9f5a] rounded-xl shadow-lg">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Carte Nation Active
                </h3>
                <p className="text-sm text-gray-600">
                  Carte étudiante vérifiée
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Card Image */}
              <div className="bg-white flex flex-col justify-center items-center rounded-xl p-4 shadow-md">
                <Image
                  src={formatImageUrl(nationCards.card_image_url)}
                  alt="Nation Card"
                  width={500}
                  height={300}
                  unoptimized={true}
                  className="w-full h-auto object-center rounded-lg"
                />
              </div>

              {/* Card Details */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Statut</span>
                    {getStatusBadgeCard(nationCards.status)}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">
                        Numéro de carte
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {nationCards.card_number}
                      </span>
                    </div>
                    {nationCards.nickname && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">
                          Surnom
                        </span>
                        <span className="text-sm font-medium text-[#ff9f5a] bg-orange-100 px-3 py-1 rounded-full inline-block">
                          {nationCards.nickname}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">
                        Date d&apos;activation
                      </span>
                      <span className="text-sm text-gray-900">
                        {dateToLocalString(new Date(nationCards.created_at))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-5 h-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-900">
                      QR Code de vérification
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center gap-4 justify-center">
                    <QRCode
                      className="size-38"
                      data={nationCards.qr_code_value}
                    />
                    <p className="text-xs text-gray-500 text-center mt-2 break-all">
                      {nationCards.qr_code_value}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card Requests History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#F17922]" />
            Historique des demandes
          </h3>

          <div className="space-y-4">
            {cardRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadgeCard(request.status)}
                      <span className="text-xs text-gray-500">
                        {dateToLocalString(new Date(request.created_at))}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">Institution :</span>{" "}
                        {request.institution}
                      </div>
                      {request.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <span className="font-semibold">
                              Raison du rejet :
                            </span>{" "}
                            {request.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={() => setShowImage({ request, status: true })}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Voir le document
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showImage.request && showImage.status && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowImage({ request: null, status: false })}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImage({ request: null, status: false })}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <Image
              src={formatImageUrl(
                (showImage.request as CardRequest)?.student_card_file_url
              )}
              alt="Carte étudiante"
              width={1200}
              height={800}
              unoptimized={true}
              className="w-full h-auto rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
