"use client";

import React, { useState } from "react";
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
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configurez les paramètres de l&apos;application — accessible uniquement aux administrateurs
        </p>
      </div>

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
  );
};

export default Settings;
