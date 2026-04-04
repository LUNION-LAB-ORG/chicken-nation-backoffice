"use client";

import React, { useState } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import MessageList from "./messages/MessageList";
import CreateMessageModal from "./messages/CreateMessageModal";
import TemplateList from "./templates/TemplateList";
import CreateTemplateModal from "./templates/CreateTemplateModal";
import EditTemplateModal from "./templates/EditTemplateModal";
import SegmentList from "./segments/SegmentList";
import CreateSegmentModal from "./segments/CreateSegmentModal";
import ScheduledList from "./scheduled/ScheduledList";
import ScheduledDetailView from "./scheduled/ScheduledDetailView";
import CreateScheduledModal from "./scheduled/CreateScheduledModal";
import UserList from "./users/UserList";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard";
import type { PushTemplate, ScheduledNotification } from "@/types/push-campaign";
import { Bell, FileText, Users, CalendarClock, Smartphone, BarChart3 } from "lucide-react";

type NotificationTab = "messages" | "scheduled" | "templates" | "segments" | "users" | "analytics";

const TABS: { id: NotificationTab; label: string; icon: React.ReactNode }[] = [
  { id: "messages", label: "Messages", icon: <Bell size={16} /> },
  { id: "scheduled", label: "Planifiées", icon: <CalendarClock size={16} /> },
  { id: "templates", label: "Templates", icon: <FileText size={16} /> },
  { id: "segments", label: "Segments", icon: <Users size={16} /> },
  { id: "users", label: "Utilisateurs", icon: <Smartphone size={16} /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
];

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("messages");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showCreateMessage, setShowCreateMessage] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateScheduled, setShowCreateScheduled] = useState(false);
  const [showCreateSegment, setShowCreateSegment] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<PushTemplate | null>(null);
  const [scheduledToEdit, setScheduledToEdit] = useState<ScheduledNotification | null>(null);
  const [scheduledToView, setScheduledToView] = useState<ScheduledNotification | null>(null);

  const getActions = () => {
    switch (activeTab) {
      case "messages":
        return [
          {
            label: "Envoyer une notification",
            onClick: () => setShowCreateMessage(true),
            variant: "primary" as const,
          },
        ];
      case "scheduled":
        return [
          {
            label: "Nouvelle planification",
            onClick: () => setShowCreateScheduled(true),
            variant: "primary" as const,
          },
        ];
      case "templates":
        return [
          {
            label: "Créer un template",
            onClick: () => setShowCreateTemplate(true),
            variant: "primary" as const,
          },
        ];
      case "segments":
        return [
          {
            label: "Créer un segment",
            onClick: () => setShowCreateSegment(true),
            variant: "primary" as const,
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <DashboardPageHeader
        mode="list"
        title="Notifications"
        searchConfig={{
          placeholder: "Rechercher...",
          buttonText: "Chercher",
          onSearch: setSearchQuery,
          realTimeSearch: true,
        }}
        actions={getActions()}
      />

      {/* Tabs */}
      <div className="bg-white rounded-[20px] p-4 mt-4 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#FFF3E8] text-[#F17922]"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "messages" && <MessageList searchQuery={searchQuery} />}
        {activeTab === "scheduled" && (
          scheduledToView ? (
            <ScheduledDetailView
              item={scheduledToView}
              onBack={() => setScheduledToView(null)}
              onEdit={(item) => {
                setScheduledToView(null);
                setScheduledToEdit(item);
              }}
            />
          ) : (
            <ScheduledList
              searchQuery={searchQuery}
              onEdit={(item) => setScheduledToView(item)}
              onCreate={() => setShowCreateScheduled(true)}
            />
          )
        )}
        {activeTab === "templates" && (
          <TemplateList
            searchQuery={searchQuery}
            onEdit={(t) => setTemplateToEdit(t)}
            onCreate={() => setShowCreateTemplate(true)}
          />
        )}
        {activeTab === "segments" && (
          <SegmentList
            searchQuery={searchQuery}
            onCreate={() => setShowCreateSegment(true)}
          />
        )}
        {activeTab === "users" && <UserList searchQuery={searchQuery} />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
      </div>

      {/* Modals */}
      <CreateMessageModal
        isOpen={showCreateMessage}
        onClose={() => setShowCreateMessage(false)}
      />
      <CreateScheduledModal
        isOpen={showCreateScheduled || !!scheduledToEdit}
        onClose={() => {
          setShowCreateScheduled(false);
          setScheduledToEdit(null);
        }}
        editItem={scheduledToEdit}
      />
      <CreateTemplateModal
        isOpen={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
      />
      <CreateSegmentModal
        isOpen={showCreateSegment}
        onClose={() => setShowCreateSegment(false)}
      />
      {templateToEdit && (
        <EditTemplateModal
          isOpen={!!templateToEdit}
          onClose={() => setTemplateToEdit(null)}
          template={templateToEdit}
        />
      )}
    </div>
  );
}
