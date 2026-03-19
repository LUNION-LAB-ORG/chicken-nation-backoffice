"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useUpdateTemplateMutation } from "@/hooks/useOnesignalQuery";
import type { OnesignalTemplate, UpdateTemplatePayload } from "@/types/onesignal";
import { Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: OnesignalTemplate;
}

export default function EditTemplateModal({ isOpen, onClose, template }: Props) {
  const { mutate: updateTemplate, isPending } = useUpdateTemplateMutation();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pushUrl, setPushUrl] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  const isEmail = template.isEmail;
  const isSMS = template.isSMS;

  useEffect(() => {
    setName(template.name || "");
    setTitle(template.headings?.en || template.headings?.fr || "");
    setMessage(template.contents?.en || template.contents?.fr || "");
    setPushUrl(template.url || "");
    setEmailSubject(template.email_subject || "");
    setEmailBody(template.email_body || "");
    setSmsMessage(template.contents?.en || template.contents?.fr || "");
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: UpdateTemplatePayload = { name };

    if (isEmail) {
      payload.email_subject = emailSubject;
      payload.email_body = emailBody;
    } else if (isSMS) {
      payload.contents = { en: smsMessage, fr: smsMessage };
    } else {
      payload.headings = { en: title, fr: title };
      payload.contents = { en: message, fr: message };
      if (pushUrl) payload.url = pushUrl;
    }

    updateTemplate(
      { id: template.id, payload },
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

        {/* Push */}
        {!isEmail && !isSMS && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Message
              </label>
              <textarea
                required
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                URL (optionnel)
              </label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={pushUrl}
                onChange={(e) => setPushUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Email */}
        {isEmail && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sujet
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Corps HTML
              </label>
              <textarea
                required
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* SMS */}
        {isSMS && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message
            </label>
            <textarea
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
            />
          </div>
        )}

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
