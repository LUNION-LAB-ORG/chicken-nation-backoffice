"use client";

import React from "react";
import {
  useTemplatesQuery,
  useDeleteTemplateMutation,
} from "@/hooks/useOnesignalQuery";
import type { OnesignalTemplate } from "@/types/onesignal";
import {
  FileText,
  Edit2,
  Trash2,
  Loader2,
  Bell,
  Mail,
  MessageSquare,
} from "lucide-react";

interface Props {
  searchQuery: string;
  onEdit: (template: OnesignalTemplate) => void;
  onCreate: () => void;
}

function getChannelInfo(t: OnesignalTemplate) {
  if (t.isEmail) return { icon: <Mail size={14} className="text-blue-500" />, label: "Email" };
  if (t.isSMS) return { icon: <MessageSquare size={14} className="text-green-500" />, label: "SMS" };
  return { icon: <Bell size={14} className="text-[#F17922]" />, label: "Push" };
}

export default function TemplateList({ searchQuery, onEdit, onCreate }: Props) {
  const { data, isLoading, error } = useTemplatesQuery({ limit: 50 });
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplateMutation();

  const templates = data?.templates ?? [];

  const filtered = searchQuery
    ? templates.filter((t) =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : templates;

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
        <p className="text-red-500 text-sm">Erreur : {error.message}</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Aucun template</p>
        <p className="text-gray-400 text-xs mt-1">
          Créez votre premier template de notification
        </p>
        <button
          onClick={onCreate}
          className="mt-4 px-5 py-2 bg-[#F17922] text-white text-sm font-semibold rounded-xl hover:bg-[#e06816] cursor-pointer"
        >
          Créer un template
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="pb-3 font-medium">Nom</th>
            <th className="pb-3 font-medium">Canal</th>
            <th className="pb-3 font-medium">Contenu</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtered.map((template) => {
            const ch = getChannelInfo(template);
            return (
              <tr key={template.id} className="hover:bg-gray-50/50">
                <td className="py-3">
                  <span className="font-medium text-gray-900">
                    {template.name}
                  </span>
                </td>
                <td className="py-3">
                  <span className="flex items-center gap-1.5">
                    {ch.icon}
                    <span className="text-xs text-gray-600">{ch.label}</span>
                  </span>
                </td>
                <td className="py-3 max-w-[250px]">
                  <p className="text-xs text-gray-500 truncate">
                    {template.contents?.en ||
                      template.contents?.fr ||
                      template.email_subject ||
                      "—"}
                  </p>
                </td>
                <td className="py-3 text-xs text-gray-500">
                  {template.created_at
                    ? new Date(template.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(template)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#F17922] cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Supprimer ce template ?")) {
                          deleteTemplate(template.id);
                        }
                      }}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
