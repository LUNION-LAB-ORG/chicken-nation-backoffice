"use client";

import React, { useState } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import SettingsTabs from "./SettingsTabs";
import GeneralSettings from "./tabs/GeneralSettings";
import EmailSettings from "./tabs/EmailSettings";
import OrderSettings from "./tabs/OrderSettings";
import MobileAppSettings from "./tabs/MobileAppSettings";
import TwilioSettings from "./tabs/TwilioSettings";
import PaymentSettings from "./tabs/PaymentSettings";
import MarketingReportSettings from "./tabs/MarketingReportSettings";
import NotificationSettings from "./tabs/NotificationSettings";
import HubRiseSettings from "./tabs/HubRiseSettings";

const TABS = [
  { key: "general", label: "Général" },
  { key: "email", label: "Email" },
  { key: "orders", label: "Commandes" },
  { key: "mobile", label: "App Mobile" },
  { key: "sms", label: "SMS / WhatsApp" },
  { key: "payment", label: "Paiements" },
  { key: "marketing_report", label: "Rapport Marketing" },
  { key: "notifications", label: "Notifications" },
  { key: "hubrise", label: "HubRise" },
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Paramètres"
          subtitle="Configurez les paramètres de l'application"
        />
      </div>

      <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden p-4">
        <SettingsTabs tabs={TABS} selected={activeTab} onSelect={setActiveTab} />

        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "email" && <EmailSettings />}
        {activeTab === "orders" && <OrderSettings />}
        {activeTab === "mobile" && <MobileAppSettings />}
        {activeTab === "sms" && <TwilioSettings />}
        {activeTab === "payment" && <PaymentSettings />}
        {activeTab === "marketing_report" && <MarketingReportSettings />}
        {activeTab === "notifications" && <NotificationSettings />}
        {activeTab === "hubrise" && <HubRiseSettings />}
      </div>
    </div>
  );
};

export default Settings;
