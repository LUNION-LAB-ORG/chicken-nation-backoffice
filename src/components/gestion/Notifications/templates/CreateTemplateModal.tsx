"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useCreateTemplateMutation } from "@/hooks/useOnesignalQuery";
import type { CreateTemplatePayload } from "@/types/onesignal";
import { Bell, Mail, MessageSquare, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TemplateChannel = "push" | "email" | "sms";

export default function CreateTemplateModal({ isOpen, onClose }: Props) {
  const { mutate: createTemplate, isPending } = useCreateTemplateMutation();

  const [channel, setChannel] = useState<TemplateChannel>("push");
  const [name, setName] = useState("");

  // Push
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pushUrl, setPushUrl] = useState("");

  // Email
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // SMS
  const [smsMessage, setSmsMessage] = useState("");

  const resetForm = () => {
    setName("");
    setChannel("push");
    setTitle("");
    setMessage("");
    setPushUrl("");
    setEmailSubject("");
    setEmailBody("");
    setSmsMessage("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateTemplatePayload = { name };

    if (channel === "push") {
      payload.headings = { en: title, fr: title };
      payload.contents = { en: message, fr: message };
      if (pushUrl) payload.url = pushUrl;
    } else if (channel === "email") {
      payload.isEmail = true;
      payload.email_subject = emailSubject;
      payload.email_body = emailBody;
    } else {
      payload.isSMS = true;
      payload.contents = { en: smsMessage, fr: smsMessage };
    }

    createTemplate(payload, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
  };

  const channels = [
    { id: "push" as const, label: "Push", icon: <Bell size={16} /> },
    { id: "email" as const, label: "Email", icon: <Mail size={16} /> },
    { id: "sms" as const, label: "SMS", icon: <MessageSquare size={16} /> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un template">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom du template
          </label>
          <input
            type="text"
            required
            maxLength={128}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: Promo weekend"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canal
          </label>
          <div className="flex gap-3">
            {channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannel(ch.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  channel === ch.id
                    ? "border-[#F17922] bg-[#FFF3E8] text-[#F17922]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {ch.icon}
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Push fields */}
        {channel === "push" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Titre
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Titre de la notification"
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
                placeholder="Corps du message"
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
                placeholder="https://..."
                value={pushUrl}
                onChange={(e) => setPushUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Email fields */}
        {channel === "email" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sujet
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Sujet de l'email"
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
                placeholder="<html>...</html>"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* SMS fields */}
        {channel === "sms" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message
            </label>
            <textarea
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Contenu du SMS"
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
            Créer
          </button>
        </div>
      </form>
    </Modal>
  );
}
