import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  QrCode,
  XCircle,
} from "lucide-react";
import { CustomerMapperData } from "../../types/customer-mapper.types";
import Image from "next/image";
import { formatImageUrl } from "@/utils/imageHelpers";
import { dateToLocalString } from "../../../../utils/date/format-date";

interface CarteTabProps {
  customerData: CustomerMapperData;
}

interface MockNationCard {
  id: string;
  cardNumber: string;
  nickname: string | null;
  qrCodeValue: string;
  cardImageUrl: string;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  createdAt: string;
}

interface MockCardRequest {
  id: string;
  institution: string;
  studentCardUrl: string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
  rejectionReason?: string;
}

const mockNationCard: MockNationCard = {
  id: "nc-1",
  cardNumber: "NC-2025-001234",
  nickname: "JP",
  qrCodeValue: "https://upload.wikimedia.org/wikipedia/commons/6/6a/QRcode_Wikipedia_FRA.png",
  cardImageUrl: "https://images.bfmtv.com/w-ERrWRBeOaeZl2UpMSPzuHAHN8=/4x3:1252x705/1248x0/images/La-nouvelle-carte-didentite-biometrique-988102.jpg",
  status: "ACTIVE",
  createdAt: "2025-01-13T14:00:00",
};

const mockCardRequests: MockCardRequest[] = [
  {
    id: "cr-1",
    institution: "Université Félix Houphouët-Boigny",
    studentCardUrl: "https://images.bfmtv.com/w-ERrWRBeOaeZl2UpMSPzuHAHN8=/4x3:1252x705/1248x0/images/La-nouvelle-carte-didentite-biometrique-988102.jpg",
    status: "APPROVED",
    createdAt: "2025-01-12T09:15:00",
  },
  {
    id: "cr-2",
    institution: "Institut National Polytechnique",
    studentCardUrl: "https://images.bfmtv.com/w-ERrWRBeOaeZl2UpMSPzuHAHN8=/4x3:1252x705/1248x0/images/La-nouvelle-carte-didentite-biometrique-988102.jpg",
    status: "REJECTED",
    createdAt: "2024-12-20T10:30:00",
    rejectionReason:
      "La carte étudiante n'est pas lisible. Veuillez soumettre une photo plus claire.",
  },
];
export function CarteTab({ customerData }: CarteTabProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <Eye className="w-3 h-3" />
            En révision
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Approuvée
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Rejetée
          </span>
        );
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Suspendue
          </span>
        );
      case "REVOKED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            <XCircle className="w-3 h-3" />
            Révoquée
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Nation Card if exists */}
      {mockNationCard && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#F17922] to-[#ff9f5a] rounded-xl shadow-lg">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Carte Nation Active
              </h3>
              <p className="text-sm text-gray-600">Carte étudiante vérifiée</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card Image */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              <Image
                src={formatImageUrl(mockNationCard.cardImageUrl)}
                alt="Nation Card"
                width={500}
                height={300}
                className="w-full h-auto object-center rounded-lg"
              />
            </div>

            {/* Card Details */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Statut</span>
                  {getStatusBadge(mockNationCard.status)}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">
                      Numéro de carte
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {mockNationCard.cardNumber}
                    </span>
                  </div>
                  {mockNationCard.nickname && (
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">
                        Surnom
                      </span>
                      <span className="text-sm font-medium text-[#ff9f5a] bg-orange-100 px-3 py-1 rounded-full inline-block">
                        {mockNationCard.nickname}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">
                      Date d&apos;activation
                    </span>
                    <span className="text-sm text-gray-900">
                      {dateToLocalString(new Date(mockNationCard.createdAt))}
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
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Image
                    src={formatImageUrl(mockNationCard.qrCodeValue)}
                    alt="QR Code"
                    width={150}
                    height={150}
                    className="mx-auto"
                  />
                  <p className="text-xs text-gray-500 text-center mt-2 break-all">
                    {mockNationCard.qrCodeValue}
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
          {mockCardRequests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(request.status)}
                    <span className="text-xs text-gray-500">
                      {dateToLocalString(new Date(request.createdAt))}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">Institution :</span>{" "}
                      {request.institution}
                    </div>
                    {request.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">
                            Raison du rejet :
                          </span>{" "}
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Voir la carte
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
