"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Gift, MessageSquare, Settings as IconeReglages, ShoppingBag, Smartphone, Truck } from "lucide-react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import SettingsTabs, { type GroupeParametres } from "./SettingsTabs";
import type { VoletLivraison } from "./tabs/DeliverySettings";
import { useIsAdmin } from "../../../../features/users/hook/useIsAdmin";

/** Affiché pendant le chargement du code d'un onglet. */
const Chargement = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
  </div>
);

// Chaque onglet n'est chargé que lorsqu'il est ouvert : la page des
// paramètres ne télécharge plus les treize écrans d'un coup. Next exige que
// les options de `dynamic` soient écrites en ligne, à chaque appel.
const GeneralSettings = dynamic(() => import("./tabs/GeneralSettings"), { loading: Chargement });
const EmailSettings = dynamic(() => import("./tabs/EmailSettings"), { loading: Chargement });
const OrderSettings = dynamic(() => import("./tabs/OrderSettings"), { loading: Chargement });
const DeliverySettings = dynamic(() => import("./tabs/DeliverySettings"), { loading: Chargement });
const MobileAppSettings = dynamic(() => import("./tabs/MobileAppSettings"), { loading: Chargement });
const PaymentSettings = dynamic(() => import("./tabs/PaymentSettings"), { loading: Chargement });
const MarketingReportSettings = dynamic(() => import("./tabs/MarketingReportSettings"), { loading: Chargement });
const NotificationSettings = dynamic(() => import("./tabs/NotificationSettings"), { loading: Chargement });
const HubRiseSettings = dynamic(() => import("./tabs/HubRiseSettings"), { loading: Chargement });
const PrinterSettings = dynamic(() => import("./tabs/PrinterSettings"), { loading: Chargement });
const CardNationSettings = dynamic(() => import("./tabs/CardNationSettings"), { loading: Chargement });
const ReferralSettings = dynamic(() => import("./tabs/ReferralSettings"), { loading: Chargement });
const BaseDonneesSettings = dynamic(
  () => import("../../../../features/base-donnees/components/ParametresView").then((m) => m.ParametresView),
  { loading: Chargement },
);
const CallSettings = dynamic(() => import("../../../../features/calls/components/CallSettings"), { loading: Chargement });

/** Volets de la livraison : un seul écran, découpé en quatre (26/11). */
const VOLETS_LIVRAISON: Record<string, VoletLivraison> = {
  delivery: "frais",
  delivery_courses: "courses",
  delivery_livreurs: "livreurs",
  delivery_planning: "planning",
};

/** Paramétrage des commandes : un onglet par canal, le même écran (26/11). */
const CANAUX_DES_COMMANDES: Record<string, "APP" | "WEB"> = {
  orders: "APP",
  orders_site: "WEB",
};

/**
 * RANGEMENT DES PARAMÈTRES (26/11) : par groupe, puis par onglet. Chaque
 * réglage n'a qu'un seul endroit : les frais de service et de paiement dans
 * Vente > Paiements, les frais de livraison et la coupure temporaire de la
 * livraison dans Livraison > Frais et disponibilité, les types de commande
 * dans Vente > Commandes de l'appli et Commandes du site (un paramétrage par
 * canal).
 */
const GROUPES: GroupeParametres[] = [
  {
    key: "vente",
    label: "Vente",
    Icon: ShoppingBag,
    description:
      "Ce que les clients peuvent commander et comment ils paient : un paramétrage pour l'application, un pour le site. Puis les frais et le paiement en ligne.",
    onglets: [
      { key: "orders", label: "Commandes de l'appli" },
      { key: "orders_site", label: "Commandes du site" },
      { key: "payment", label: "Paiements" },
    ],
  },
  {
    key: "livraison",
    label: "Livraison",
    Icon: Truck,
    description: "Frais de livraison, attribution des courses, règles des livreurs et planning.",
    onglets: [
      { key: "delivery", label: "Frais et disponibilité" },
      { key: "delivery_courses", label: "Courses" },
      { key: "delivery_livreurs", label: "Livreurs" },
      { key: "delivery_planning", label: "Planning" },
    ],
  },
  {
    key: "fidelite",
    label: "Fidélité",
    Icon: Gift,
    description: "Carte Nation et parrainage.",
    onglets: [
      { key: "card_nation", label: "Carte Nation" },
      { key: "referral", label: "Parrainage" },
    ],
  },
  {
    key: "communication",
    label: "Communication",
    Icon: MessageSquare,
    description: "Messages envoyés aux clients et à l'équipe : notifications, e-mails, appels, rapport marketing.",
    onglets: [
      { key: "notifications", label: "Notifications" },
      { key: "email", label: "Email" },
      { key: "calls", label: "Appels" },
      { key: "marketing_report", label: "Marketing" },
    ],
  },
  {
    key: "applications",
    label: "Applications",
    Icon: Smartphone,
    description: "Application mobile, imprimante de tickets et connexion HubRise.",
    onglets: [
      { key: "mobile", label: "App Mobile" },
      { key: "printer", label: "Imprimante" },
      { key: "hubrise", label: "HubRise" },
    ],
  },
  {
    key: "general",
    label: "Général",
    Icon: IconeReglages,
    description: "Identité et informations publiques de Chicken Nation.",
    onglets: [{ key: "general", label: "Général" }],
  },
];

/** Dernier onglet ouvert, retrouvé à la prochaine visite (par navigateur). */
const CLE_ONGLET = "cn-parametres-onglet";

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const isAdmin = useIsAdmin();

  // Onglet Appels réservé à l'admin (écriture de la config = permission SETTINGS.UPDATE).
  const groupes = useMemo(
    () =>
      isAdmin
        ? GROUPES
        : GROUPES.map((g) => ({ ...g, onglets: g.onglets.filter((o) => o.key !== "calls") })),
    [isAdmin],
  );
  const cles = useMemo(() => groupes.flatMap((g) => g.onglets.map((o) => o.key)), [groupes]);

  // Retour sur le dernier onglet ouvert (lu après le premier rendu : le
  // stockage du navigateur n'existe pas côté serveur).
  useEffect(() => {
    try {
      const garde = window.localStorage.getItem(CLE_ONGLET);
      if (garde && cles.includes(garde)) setActiveTab(garde);
    } catch {
      /* stockage indisponible : l'onglet par défaut reste */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ouvrir = (key: string) => {
    setActiveTab(key);
    try {
      window.localStorage.setItem(CLE_ONGLET, key);
    } catch {
      /* stockage indisponible */
    }
  };

  // Onglet retiré pour ce compte (Appels) : le premier onglet à la place.
  const onglet = cles.includes(activeTab) ? activeTab : cles[0];
  const voletLivraison = VOLETS_LIVRAISON[onglet];
  const canalDesCommandes = CANAUX_DES_COMMANDES[onglet];

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Paramètres"
          subtitle="Configurez les paramètres de l'application"
        />
      </div>

      <div className="space-y-4 min-w-0">
        <SettingsTabs groupes={groupes} selected={onglet} onSelect={ouvrir} />

        <div className="min-w-0">
          {/* Un seul écran pour les deux canaux : il reste monté quand on
              passe de l'un à l'autre, les saisies ne sont pas perdues. */}
          {canalDesCommandes && <OrderSettings canal={canalDesCommandes} />}
          {onglet === "payment" && <PaymentSettings />}
          {/* Un seul écran pour les trois volets : il reste monté quand on
              change de volet, les saisies non enregistrées ne sont pas perdues. */}
          {voletLivraison && <DeliverySettings volet={voletLivraison} />}
          {onglet === "card_nation" && <CardNationSettings />}
          {onglet === "referral" && <ReferralSettings />}
          {onglet === "notifications" && <NotificationSettings />}
          {onglet === "email" && <EmailSettings />}
          {onglet === "calls" && isAdmin && <CallSettings />}
          {onglet === "marketing_report" && (
            <div className="space-y-6">
              <MarketingReportSettings />
              <BaseDonneesSettings />
            </div>
          )}
          {onglet === "mobile" && <MobileAppSettings />}
          {onglet === "printer" && <PrinterSettings />}
          {onglet === "hubrise" && <HubRiseSettings />}
          {onglet === "general" && <GeneralSettings />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
