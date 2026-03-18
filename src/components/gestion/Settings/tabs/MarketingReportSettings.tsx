"use client";

import React, { useState, useEffect } from "react";
import { useSettingQuery, useSettingMutation } from "@/hooks/useSettingsQuery";
import { Mail, Plus, Trash2, Send } from "lucide-react";

const MarketingReportSettings: React.FC = () => {
  const { data: emailsData, isLoading: loadingEmails } = useSettingQuery("marketing_report_emails");
  const { data: activeData, isLoading: loadingActive } = useSettingQuery("marketing_report_active");
  const { mutate: updateSetting, isPending } = useSettingMutation();

  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (emailsData?.value) {
      try {
        setEmails(JSON.parse(emailsData.value));
      } catch {
        setEmails([]);
      }
    }
  }, [emailsData]);

  useEffect(() => {
    if (activeData?.value !== undefined && activeData?.value !== null) {
      setIsActive(activeData.value !== "false");
    }
  }, [activeData]);

  const addEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    if (emails.includes(trimmed)) return;
    setEmails([...emails, trimmed]);
    setNewEmail("");
  };

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateSetting({
      key: "marketing_report_emails",
      value: JSON.stringify(emails),
      description: "Liste des emails destinataires du rapport marketing quotidien",
    });
    updateSetting({
      key: "marketing_report_active",
      value: String(isActive),
      description: "Activer/désactiver l'envoi automatique du rapport marketing",
    });
  };

  if (loadingEmails || loadingActive) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle actif/inactif */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Envoi automatique</h3>
            <p className="text-sm text-gray-500 mt-1">
              Le rapport marketing est envoyé tous les jours à 10h30 avec les données de la veille
            </p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              isActive ? "bg-[#F17922]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Liste des emails */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Destinataires</h3>
        <p className="text-sm text-gray-500 mb-5">
          Adresses email qui recevront le rapport marketing quotidien
        </p>

        {/* Champ d'ajout */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="email@exemple.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEmail()}
            />
          </div>
          <button
            onClick={addEmail}
            className="px-4 py-2.5 bg-[#F17922] text-white rounded-lg hover:bg-[#e06816] transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        {/* Liste */}
        {emails.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Mail size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun destinataire configuré</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map((email, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:border-orange-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Mail size={14} className="text-[#F17922]" />
                  </div>
                  <span className="text-sm text-gray-800">{email}</span>
                </div>
                <button
                  onClick={() => removeEmail(i)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton Sauvegarder */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#F17922] text-white font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default MarketingReportSettings;
