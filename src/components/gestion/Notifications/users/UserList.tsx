"use client";

import React, { useState } from "react";
import { usePushUsersQuery } from "@/hooks/usePushCampaignQuery";
import type { PushUser } from "@/types/push-campaign";
import {
  Smartphone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
} from "lucide-react";
import UserDetailModal from "./UserDetailModal";

interface Props {
  searchQuery: string;
}

const LOYALTY_COLORS: Record<string, { bg: string; text: string }> = {
  GOLD: { bg: "bg-yellow-100", text: "text-yellow-700" },
  PREMIUM: { bg: "bg-purple-100", text: "text-purple-700" },
  STANDARD: { bg: "bg-gray-100", text: "text-gray-600" },
};

export default function UserList({ searchQuery }: Props) {
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<PushUser | null>(null);

  const { data, isLoading, error } = usePushUsersQuery({
    page,
    search: searchQuery || undefined,
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#F17922]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Erreur : {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{total}</span> abonné{total > 1 ? "s" : ""} push
        </p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            {searchQuery ? "Aucun utilisateur trouvé" : "Aucun abonné push"}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Les utilisateurs apparaissent ici quand ils installent l&apos;app mobile
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Utilisateur</th>
                  <th className="pb-3 font-medium">Téléphone</th>
                  <th className="pb-3 font-medium">Fidélité</th>
                  <th className="pb-3 font-medium">Push</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => {
                  const name = [user.customer.first_name, user.customer.last_name]
                    .filter(Boolean)
                    .join(" ") || "Sans nom";
                  const loyalty = user.customer.loyalty_level ?? "STANDARD";
                  const colors = LOYALTY_COLORS[loyalty] ?? LOYALTY_COLORS.STANDARD;

                  return (
                    <tr
                      key={user.customer_id}
                      className="hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#FFF3E8] rounded-full flex items-center justify-center text-[#F17922] font-semibold text-xs">
                            {(user.customer.first_name?.[0] ?? "?").toUpperCase()}
                          </div>
                          <p className="font-medium text-gray-900 text-sm">{name}</p>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600 text-xs">
                        {user.customer.phone}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}
                        >
                          <Crown size={10} />
                          {loyalty}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            user.push ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#F17922] cursor-pointer"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                Page {page} sur {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={16} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <UserDetailModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}
    </div>
  );
}
