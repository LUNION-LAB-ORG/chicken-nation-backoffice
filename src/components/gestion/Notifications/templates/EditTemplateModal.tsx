"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useUpdateTemplateMutation } from "@/hooks/usePushCampaignQuery";
import type { PushTemplate } from "@/types/push-campaign";
import { Loader2 } from "lucide-react";
import VariablePicker from "../VariablePicker";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: PushTemplate;
}

export default function EditTemplateModal({ isOpen, onClose, template }: Props) {
  const { mutate: updateTemplate, isPending } = useUpdateTemplateMutation();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    setName(template.name || "");
    setTitle(template.title || "");
    setBody(template.body || "");
    setImageUrl(template.image_url || "");
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateTemplate(
      {
        id: template.id,
        payload: {
          name,
          title,
          body,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le template">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom
          </label>
          <input
            type="text"
            required
            maxLength={128}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Titre</label>
            <VariablePicker onInsert={(v) => setTitle((prev) => prev + v)} />
          </div>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <VariablePicker onInsert={(v) => setBody((prev) => prev + v)} />
          </div>
          <textarea
            required
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Image URL (optionnel)
          </label>
          <input
            type="url"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-[#F17922] text-white rounded-xl text-sm font-semibold hover:bg-[#e06816] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}
