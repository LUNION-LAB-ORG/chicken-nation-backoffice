"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Search,
  AlertCircle,
} from "lucide-react";
import { CardRequest, CardRequestStatus } from "../../types/carte-nation.types";
import { ApproveCardModal } from "./ApproveCardModal";
import { RejectCardModal } from "./RejectCardModal";
import { DeleteCardRequestModal } from "./DeleteCardRequestModal";

// Mock data for demonstration
const mockCardRequests: CardRequest[] = [
  {
    id: "1",
    customer_id: "c1",
    nickname: "JP",
    institution: "Université Félix Houphouët-Boigny",
    student_card_file_url: "https://images.bfmtv.com/w-ERrWRBeOaeZl2UpMSPzuHAHN8=/4x3:1252x705/1248x0/images/La-nouvelle-carte-didentite-biometrique-988102.jpg",
    status: "PENDING",
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: "2025-01-15T10:30:00",
    updated_at: "2025-01-15T10:30:00",
    customer: {
      id: "c1",
      firstname: "Jean-Paul",
      lastname: "Kouassi",
      email: "jean.paul@example.ci",
      phone: "+225 07 12 34 56 78",
      image: "/african-professional-portrait.jpg",
    },
  },
  {
    id: "2",
    customer_id: "c2",
    nickname: "Ama",
    institution: "Institut National Polytechnique Houphouët-Boigny",
    student_card_file_url: "https://images.bfmtv.com/w-ERrWRBeOaeZl2UpMSPzuHAHN8=/4x3:1252x705/1248x0/images/La-nouvelle-carte-didentite-biometrique-988102.jpg",
    status: "IN_REVIEW",
    rejection_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: "2025-01-14T15:20:00",
    updated_at: "2025-01-14T16:00:00",
    customer: {
      id: "c2",
      firstname: "Ama",
      lastname: "Koffi",
      email: "ama.koffi@example.ci",
      phone: "+225 05 23 45 67 89",
      image: null,
    },
  },
  {
    id: "3",
    customer_id: "c3",
    nickname: null,
    institution: "Université d'Abobo-Adjamé",
    student_card_file_url: "https://images.bfmtv.com/w-ERrWRBeOaeZl2UpMSPzuHAHN8=/4x3:1252x705/1248x0/images/La-nouvelle-carte-didentite-biometrique-988102.jpg",
    status: "APPROVED",
    rejection_reason: null,
    reviewed_by: "admin1",
    reviewed_at: "2025-01-13T14:00:00",
    created_at: "2025-01-12T09:15:00",
    updated_at: "2025-01-13T14:00:00",
    customer: {
      id: "c3",
      firstname: "Yao",
      lastname: "N'Guessan",
      email: "yao.nguessan@example.ci",
      phone: "+225 07 98 76 54 32",
      image: null,
    },
  },
  {
    id: "4",
    customer_id: "c4",
    nickname: "Fati",
    institution: "Université Alassane Ouattara",
    student_card_file_url: "https://images.bfmtv.com/w-ERrWRBeOaeZl2UpMSPzuHAHN8=/4x3:1252x705/1248x0/images/La-nouvelle-carte-didentite-biometrique-988102.jpg",
    status: "REJECTED",
    rejection_reason:
      "La carte étudiante n'est pas lisible. Veuillez soumettre une photo plus claire.",
    reviewed_by: "admin1",
    reviewed_at: "2025-01-10T11:30:00",
    created_at: "2025-01-09T13:45:00",
    updated_at: "2025-01-10T11:30:00",
    customer: {
      id: "c4",
      firstname: "Fatima",
      lastname: "Traoré",
      email: "fatima.traore@example.ci",
      phone: "+225 01 11 22 33 44",
      image: null,
    },
  },
];

export function DemandeCarteList() {
  const [requests, setRequests] = useState<CardRequest[]>(mockCardRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CardRequestStatus | "ALL">(
    "ALL"
  );
  const [selectedRequest, setSelectedRequest] = useState<CardRequest | null>(
    null
  );
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.customer?.firstname
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.customer?.lastname
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.institution.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status counts
  const statusCounts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    IN_REVIEW: requests.filter((r) => r.status === "IN_REVIEW").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  const getStatusBadge = (status: CardRequestStatus) => {
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
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            <AlertCircle className="w-3 h-3" />
            Expirée
          </span>
        );
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApprove = (request: CardRequest) => {
    setSelectedRequest(request);
    setApproveModalOpen(true);
  };

  const handleReject = (request: CardRequest) => {
    setSelectedRequest(request);
    setRejectModalOpen(true);
  };

  const handleDelete = (request: CardRequest) => {
    setSelectedRequest(request);
    setDeleteModalOpen(true);
  };

  const handleViewImage = (url: string) => {
    setViewImageUrl(url);
  };

  return (
    <div >
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`p-4 rounded-xl border-2 transition-all ${
              statusFilter === "ALL"
                ? "bg-white border-[#F17922] shadow-md"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">
              {statusCounts.ALL}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`p-4 rounded-xl border-2 transition-all ${
              statusFilter === "PENDING"
                ? "bg-white border-amber-500 shadow-md"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl font-bold text-amber-600">
              {statusCounts.PENDING}
            </div>
            <div className="text-sm text-gray-600">En attente</div>
          </button>
          <button
            onClick={() => setStatusFilter("IN_REVIEW")}
            className={`p-4 rounded-xl border-2 transition-all ${
              statusFilter === "IN_REVIEW"
                ? "bg-white border-blue-500 shadow-md"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts.IN_REVIEW}
            </div>
            <div className="text-sm text-gray-600">En révision</div>
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={`p-4 rounded-xl border-2 transition-all ${
              statusFilter === "APPROVED"
                ? "bg-white border-emerald-500 shadow-md"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl font-bold text-emerald-600">
              {statusCounts.APPROVED}
            </div>
            <div className="text-sm text-gray-600">Approuvées</div>
          </button>
          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={`p-4 rounded-xl border-2 transition-all ${
              statusFilter === "REJECTED"
                ? "bg-white border-red-500 shadow-md"
                : "bg-white border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.REJECTED}
            </div>
            <div className="text-sm text-gray-600">Rejetées</div>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou institution..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Client
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Institution
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Surnom
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Statut
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Aucune demande trouvée
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {request.customer?.image ? (
                            <Image
                              src={request.customer.image || "/placeholder.svg"}
                              alt={`${request.customer.firstname} ${request.customer.lastname}`}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F17922] to-[#ff9f5a] flex items-center justify-center text-white font-bold text-sm">
                              {request.customer?.firstname.charAt(0)}
                              {request.customer?.lastname.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {request.customer?.firstname}{" "}
                              {request.customer?.lastname}
                            </div>
                            <div className="text-xs text-gray-500">
                              {request.customer?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {request.institution}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {request.nickname ? (
                          <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                            {request.nickname}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Non défini
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {formatDate(request.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleViewImage(request.student_card_file_url)
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir la carte"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {request.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(request)}
                                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approuver"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Rejeter"
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(request)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedRequest && (
        <>
          <ApproveCardModal
            isOpen={approveModalOpen}
            request={selectedRequest}
            onClose={() => {
              setApproveModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={(updatedRequest) => {
              setRequests((prev) =>
                prev.map((r) =>
                  r.id === updatedRequest.id ? updatedRequest : r
                )
              );
              setApproveModalOpen(false);
              setSelectedRequest(null);
            }}
          />
          <RejectCardModal
            isOpen={rejectModalOpen}
            request={selectedRequest}
            onClose={() => {
              setRejectModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={(updatedRequest) => {
              setRequests((prev) =>
                prev.map((r) =>
                  r.id === updatedRequest.id ? updatedRequest : r
                )
              );
              setRejectModalOpen(false);
              setSelectedRequest(null);
            }}
          />
          <DeleteCardRequestModal
            isOpen={deleteModalOpen}
            request={selectedRequest}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedRequest(null);
            }}
            onSuccess={(deletedId) => {
              setRequests((prev) => prev.filter((r) => r.id !== deletedId));
              setDeleteModalOpen(false);
              setSelectedRequest(null);
            }}
          />
        </>
      )}

      {/* Image Viewer Modal */}
      {viewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setViewImageUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewImageUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <Image
              src={viewImageUrl || "/placeholder.svg"}
              alt="Carte étudiante"
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
