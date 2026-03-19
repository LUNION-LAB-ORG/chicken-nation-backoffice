"use client";

import React, { useState } from "react";
import {
  useOnesignalUserDetailQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
} from "@/hooks/useOnesignalQuery";
import type { OnesignalUser, OnesignalSubscription } from "@/types/onesignal";
import {
  X,
  Loader2,
  Smartphone,
  Monitor,
  Mail,
  MessageSquare,
  Tag,
  Shield,
  Trash2,
  Save,
  Plus,
  ChevronDown,
  ChevronUp,
  Crown,
  ShoppingBag,
  MapPin,
  Phone,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: OnesignalUser;
}

const SUBSCRIPTION_ICONS: Record<string, React.ReactNode> = {
  iOSPush: <Smartphone size={16} className="text-gray-500" />,
  AndroidPush: <Smartphone size={16} className="text-green-500" />,
  ChromePush: <Monitor size={16} className="text-blue-500" />,
  SafariPush: <Monitor size={16} className="text-gray-500" />,
  FireOSPush: <Smartphone size={16} className="text-orange-500" />,
  Email: <Mail size={16} className="text-purple-500" />,
  SMS: <MessageSquare size={16} className="text-teal-500" />,
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  iOSPush: "iOS Push",
  AndroidPush: "Android Push",
  ChromePush: "Chrome Web Push",
  SafariPush: "Safari Web Push",
  FireOSPush: "FireOS Push",
  Email: "Email",
  SMS: "SMS",
};

export default function UserDetailModal({ isOpen, onClose, user }: Props) {
  const { data: detail, isLoading, error } = useOnesignalUserDetailQuery(user.id);
  const updateUser = useUpdateUserMutation();
  const deleteUser = useDeleteUserMutation();
  const updateSubscription = useUpdateSubscriptionMutation();
  const deleteSubscription = useDeleteSubscriptionMutation();

  const [activeSection, setActiveSection] = useState<"subscriptions" | "tags" | "aliases">("subscriptions");
  const [editingTags, setEditingTags] = useState<Record<string, string>>({});
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Sans nom";
  const tags = detail?.properties?.tags ?? {};
  const subscriptions = detail?.subscriptions ?? [];
  const identity = detail?.identity ?? {};

  const handleSaveTags = () => {
    const tagsToUpdate: Record<string, string | number | boolean> = { ...editingTags };
    // Add new tag if provided
    if (newTagKey.trim() && newTagValue.trim()) {
      tagsToUpdate[newTagKey.trim()] = newTagValue.trim();
    }
    if (Object.keys(tagsToUpdate).length === 0) return;

    updateUser.mutate(
      { externalId: user.id, payload: { tags: tagsToUpdate } },
      {
        onSuccess: () => {
          setEditingTags({});
          setNewTagKey("");
          setNewTagValue("");
          setIsEditing(false);
        },
      }
    );
  };

  const handleDeleteTag = (key: string) => {
    // Setting to "" removes the tag in OneSignal
    updateUser.mutate({
      externalId: user.id,
      payload: { tags: { [key]: "" } },
    });
  };

  const handleToggleSubscription = (sub: OnesignalSubscription) => {
    updateSubscription.mutate({
      subscriptionId: sub.id,
      payload: { enabled: !sub.enabled },
      externalId: user.id,
    });
  };

  const handleDeleteSubscription = (sub: OnesignalSubscription) => {
    if (!confirm("Supprimer cette subscription ?")) return;
    deleteSubscription.mutate({
      subscriptionId: sub.id,
      externalId: user.id,
    });
  };

  const handleDeleteUser = () => {
    if (!confirm(`Supprimer ${name} de OneSignal ? Cette action est irréversible.`)) return;
    deleteUser.mutate(user.id, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFF3E8] rounded-full flex items-center justify-center text-[#F17922] font-bold">
              {(user.first_name?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{name}</h2>
              <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* User Info Cards */}
        <div className="px-6 py-3 bg-gray-50 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span className="text-xs text-gray-600">{user.phone ?? "\u2014"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <span className="text-xs text-gray-600">{user.city ?? "\u2014"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-gray-400" />
            <span className="text-xs text-gray-600">{user.loyalty_level ?? "STANDARD"}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag size={14} className="text-gray-400" />
            <span className="text-xs text-gray-600">{user.orders_count} commandes</span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-2">
          {(
            [
              { id: "subscriptions" as const, label: "Subscriptions", icon: <Smartphone size={14} /> },
              { id: "tags" as const, label: "Tags", icon: <Tag size={14} /> },
              { id: "aliases" as const, label: "Aliases", icon: <Shield size={14} /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeSection === tab.id
                  ? "bg-[#FFF3E8] text-[#F17922]"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === "subscriptions" && subscriptions.length > 0 && (
                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                  {subscriptions.length}
                </span>
              )}
              {tab.id === "tags" && Object.keys(tags).length > 0 && (
                <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                  {Object.keys(tags).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#F17922]" size={24} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle size={24} className="text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Impossible de charger les détails OneSignal
              </p>
              <p className="text-xs text-gray-400 mt-1">
                L&apos;utilisateur n&apos;est peut-être pas encore enregistré sur OneSignal
              </p>
            </div>
          ) : (
            <>
              {/* Subscriptions */}
              {activeSection === "subscriptions" && (
                <div className="space-y-3 mt-2">
                  {subscriptions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">
                      Aucune subscription
                    </p>
                  ) : (
                    subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="border border-gray-100 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {SUBSCRIPTION_ICONS[sub.type] ?? (
                            <Smartphone size={16} className="text-gray-400" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {SUBSCRIPTION_LABELS[sub.type] ?? sub.type}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {sub.device_model && (
                                <span className="text-[10px] text-gray-400">
                                  {sub.device_model}
                                </span>
                              )}
                              {sub.device_os && (
                                <span className="text-[10px] text-gray-400">
                                  {sub.device_os}
                                </span>
                              )}
                              {sub.app_version && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                  v{sub.app_version}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-300 mt-0.5 font-mono">
                              {sub.id.slice(0, 20)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleSubscription(sub)}
                            className="cursor-pointer"
                            title={sub.enabled ? "Désactiver" : "Activer"}
                          >
                            {sub.enabled ? (
                              <ToggleRight size={24} className="text-green-500" />
                            ) : (
                              <ToggleLeft size={24} className="text-gray-300" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteSubscription(sub)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tags */}
              {activeSection === "tags" && (
                <div className="space-y-3 mt-2">
                  {Object.keys(tags).length === 0 && !isEditing ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-400">Aucun tag</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-2 text-xs text-[#F17922] hover:underline cursor-pointer"
                      >
                        Ajouter un tag
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {Object.entries(tags).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2"
                          >
                            <Tag size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs font-mono font-medium text-gray-700 min-w-[120px]">
                              {key}
                            </span>
                            {isEditing ? (
                              <input
                                type="text"
                                defaultValue={String(value)}
                                onChange={(e) =>
                                  setEditingTags((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#F17922]"
                              />
                            ) : (
                              <span className="flex-1 text-xs text-gray-600">
                                {String(value)}
                              </span>
                            )}
                            {isEditing && (
                              <button
                                onClick={() => handleDeleteTag(key)}
                                className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add new tag */}
                      {isEditing && (
                        <div className="flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                          <Plus size={12} className="text-gray-400" />
                          <input
                            type="text"
                            placeholder="Clé"
                            value={newTagKey}
                            onChange={(e) => setNewTagKey(e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1 w-[120px] focus:outline-none focus:border-[#F17922]"
                          />
                          <input
                            type="text"
                            placeholder="Valeur"
                            value={newTagValue}
                            onChange={(e) => setNewTagValue(e.target.value)}
                            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-[#F17922]"
                          />
                        </div>
                      )}

                      {/* Edit / Save buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                          >
                            <Tag size={12} />
                            Modifier les tags
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleSaveTags}
                              disabled={updateUser.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F17922] hover:bg-[#e06a15] text-white rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
                            >
                              {updateUser.isPending ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Save size={12} />
                              )}
                              Enregistrer
                            </button>
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setEditingTags({});
                                setNewTagKey("");
                                setNewTagValue("");
                              }}
                              className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Aliases */}
              {activeSection === "aliases" && (
                <div className="space-y-3 mt-2">
                  {Object.keys(identity).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">
                      Aucun alias
                    </p>
                  ) : (
                    Object.entries(identity).map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={12} className="text-gray-400" />
                          <span className="text-xs font-mono font-medium text-gray-700">
                            {label}
                          </span>
                          <span className="text-xs text-gray-500">{value}</span>
                        </div>
                        {label !== "external_id" && (
                          <span className="text-[10px] text-gray-400 italic">
                            Alias
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleDeleteUser}
            disabled={deleteUser.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
          >
            {deleteUser.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            Supprimer de OneSignal
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
