"use client";

import React, { useState } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import SettingsTabs from "./SettingsTabs";
import GeneralSettings from "./tabs/GeneralSettings";
import EmailSettings from "./tabs/EmailSettings";
import OrderSettings from "./tabs/OrderSettings";
import DeliverySettings from "./tabs/DeliverySettings";
import MobileAppSettings from "./tabs/MobileAppSettings";
import PaymentSettings from "./tabs/PaymentSettings";
import MarketingReportSettings from "./tabs/MarketingReportSettings";
import NotificationSettings from "./tabs/NotificationSettings";
import HubRiseSettings from "./tabs/HubRiseSettings";
import PrinterSettings from "./tabs/PrinterSettings";
import { ParametresView as BaseDonneesSettings } from "../../../../features/base-donnees/components/ParametresView";

const TABS = [
  { key: "general", label: "Général" },
  { key: "email", label: "Email" },
  { key: "orders", label: "Commandes" },
  { key: "delivery", label: "Livraison" },
  { key: "mobile", label: "App Mobile" },
  { key: "payment", label: "Paiements" },
  { key: "marketing_report", label: "Rapport Marketing" },
  { key: "base_donnees", label: "Base de Données" },
  { key: "notifications", label: "Notifications" },
  { key: "hubrise", label: "HubRise" },
  { key: "printer", label: "Imprimante" },
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

      <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden p-4 min-w-0">
        <SettingsTabs tabs={TABS} selected={activeTab} onSelect={setActiveTab} />

        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "email" && <EmailSettings />}
        {activeTab === "orders" && <OrderSettings />}
        {activeTab === "delivery" && <DeliverySettings />}
        {activeTab === "mobile" && <MobileAppSettings />}
        {activeTab === "payment" && <PaymentSettings />}
        {activeTab === "marketing_report" && <MarketingReportSettings />}
        {activeTab === "base_donnees" && <BaseDonneesSettings />}
        {activeTab === "notifications" && <NotificationSettings />}
        {activeTab === "hubrise" && <HubRiseSettings />}
        {activeTab === "printer" && <PrinterSettings />}
      </div>
    </div>
  );
};

export default Settings;
