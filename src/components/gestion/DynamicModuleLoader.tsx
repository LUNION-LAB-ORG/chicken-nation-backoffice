"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useGetMenuConfig } from "@/hooks/useMenuConfig";
import { TabKey, useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "../../../features/users/hook/authStore";
import { Action, Modules } from "../../../features/users/types/auth.type";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
  </div>
);

const modulesMap: Record<string, any> = {
  dashboard: dynamic(() => import("@/components/gestion/Dashboard"), {
    loading: () => <LoadingSpinner />,
  }),
  menus: dynamic(() => import("@/components/gestion/Menus"), {
    loading: () => <LoadingSpinner />,
  }),
  operations: dynamic(() => import("@/components/gestion/Operations"), {
    loading: () => <LoadingSpinner />,
  }),
  // Alias rétro-compat : les anciens activeTab "orders" et "historique" persistés
  // en localStorage redirigent vers la page unifiée.
  orders: dynamic(() => import("@/components/gestion/Operations"), {
    loading: () => <LoadingSpinner />,
  }),
  historique: dynamic(() => import("@/components/gestion/Operations"), {
    loading: () => <LoadingSpinner />,
  }),
  courses: dynamic(() => import("@/components/gestion/Courses"), {
    loading: () => <LoadingSpinner />,
  }),
  clients: dynamic(() => import("@/components/gestion/Clients"), {
    loading: () => <LoadingSpinner />,
  }),
  reviews: dynamic(() => import("@/components/gestion/Clients/Reviews"), {
    loading: () => <LoadingSpinner />,
  }),
  card_nation: dynamic(() => import("@/components/gestion/CarteNation"), {
    loading: () => <LoadingSpinner />,
  }),
  inventory: dynamic(() => import("@/components/gestion/Inventory"), {
    loading: () => <LoadingSpinner />,
  }),
  restaurants: dynamic(() => import("@/components/gestion/Restaurants"), {
    loading: () => <LoadingSpinner />,
  }),
  personnel: dynamic(() => import("@/components/gestion/Personnel"), {
    loading: () => <LoadingSpinner />,
  }),
  livreurs: dynamic(() => import("@/components/gestion/Livreurs"), {
    loading: () => <LoadingSpinner />,
  }),
  planning_livreurs: dynamic(() => import("@/components/gestion/PlanningLivreurs"), {
    loading: () => <LoadingSpinner />,
  }),
  promos: dynamic(() => import("@/components/gestion/Promos"), {
    loading: () => <LoadingSpinner />,
  }),
  loyalty: dynamic(() => import("@/components/gestion/PointFedelisation"), {
    loading: () => <LoadingSpinner />,
  }),
  referral: dynamic(() => import("@/components/gestion/Referral"), {
    loading: () => <LoadingSpinner />,
  }),
  gifts: dynamic(() => import("@/components/gestion/Gifts"), {
    loading: () => <LoadingSpinner />,
  }),
  games: dynamic(() => import("@/components/gestion/Games"), {
    loading: () => <LoadingSpinner />,
  }),
  voucher: dynamic(() => import("@/components/gestion/BonDeReduction"), {
    loading: () => <LoadingSpinner />,
  }),
  marketing: dynamic(() => import("@/components/gestion/Marketing"), {
    loading: () => <LoadingSpinner />,
  }),
  news: dynamic(() => import("@/components/gestion/Nouveautes"), {
    loading: () => <LoadingSpinner />,
  }),
  promo_code: dynamic(() => import("@/components/gestion/CodesPromo"), {
    loading: () => <LoadingSpinner />,
  }),

  delivery_offers: dynamic(() => import("@/components/gestion/DeliveryOffers"), {
    loading: () => <LoadingSpinner />,
  }),

  // Messages clients et tickets partagent désormais le même poste de travail :
  // une seule pile, un seul fil, une seule gestuelle. Les deux entrées de menu
  // ouvrent le même écran, avec le filtre correspondant.
  inbox: dynamic(() => import("@/components/gestion/MessagesEtTickets/Inbox"), {
    loading: () => <LoadingSpinner />,
  }),
  tickets: dynamic(() => import("@/components/gestion/MessagesEtTickets/Tickets"), {
    loading: () => <LoadingSpinner />,
  }),
  diffusions: dynamic(
    () => import("@/components/gestion/MessagesEtTickets/Diffusions"),
    { loading: () => <LoadingSpinner /> },
  ),
  appel: dynamic(() => import("../../../features/calls/components/AppelView"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- Statistiques détaillées ----
  stats_products: dynamic(
    () => import("@/components/gestion/Statistiques/StatsProducts"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_orders: dynamic(
    () => import("@/components/gestion/Statistiques/StatsOrders"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_clients: dynamic(
    () => import("@/components/gestion/Statistiques/StatsClients"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_delivery: dynamic(
    () => import("@/components/gestion/Statistiques/StatsDelivery"),
    { loading: () => <LoadingSpinner /> }
  ),
  stats_marketing: dynamic(
    () => import("@/components/gestion/Statistiques/StatsMarketing"),
    { loading: () => <LoadingSpinner /> }
  ),
  // L'ancienne « Rétention clients » vit désormais dans le CRM : un onglet
  // mémorisé ou un ancien lien y mène.
  stats_retention_callbacks: dynamic(() => import("@/components/gestion/Crm"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- Notifications ----
  notifications: dynamic(() => import("@/components/gestion/Notifications"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- Intégrations ----
  hubrise: dynamic(() => import("@/components/gestion/HubRise"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- CRM : inscrits sans commande, clients inactifs et clients Glovo/Yango ----
  crm: dynamic(() => import("@/components/gestion/Crm"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- Audits (admin) ----
  audit_actions: dynamic(() => import("@/components/gestion/Audit/Actions"), {
    loading: () => <LoadingSpinner />,
  }),
  audit_logs: dynamic(() => import("@/components/gestion/Audit/Logs"), {
    loading: () => <LoadingSpinner />,
  }),

  // ---- Paramètres ----
  settings: dynamic(() => import("@/components/gestion/Settings"), {
    loading: () => <LoadingSpinner />,
  }),
};

/**
 * Onglets sans entrée de menu propre, qui ouvrent l'écran d'une autre entrée :
 * ils en suivent le droit. Anciennes valeurs encore mémorisées chez certains
 * (« orders », « historique », « acquisition »…) ou liens internes.
 */
const ALIAS_MENU: Record<string, string> = {
  orders: "operations",
  historique: "operations",
  card_requests: "card_nation",
  // Glovo/Yango vit désormais dans le CRM.
  acquisition: "crm",
  // L'ancienne « Rétention clients » aussi.
  stats_retention_callbacks: "crm",
};

/**
 * Écrans chargés ici sans entrée de menu, avec le droit qui les ouvre.
 * ⚠️ Tout autre écran de `modulesMap` doit avoir son entrée de menu : sinon il
 * n'est jamais rendu (retour au premier écran permis). Un nouvel écran hors
 * menu se déclare ici.
 */
const HORS_MENU: Record<string, (can: (m: Modules, a: Action) => boolean) => boolean> = {
  // HubRise se règle dans Paramètres : même droit que Paramètres.
  hubrise: (can) => can(Modules.SETTINGS, Action.READ),
};

// Clé d'onglet d'une entrée de menu : la partie après le premier tiret
// (« base_donnees-reviews » → « reviews »), comme dans la barre latérale.
const cleOnglet = (id: string) => (id.includes("-") ? id.split("-").slice(1).join("-") : id);

// Propriété propre seulement : une valeur mémorisée comme « constructor » ne
// doit rien ouvrir.
const possede = (table: object, cle: string) => Object.prototype.hasOwnProperty.call(table, cle);

export default function DynamicModuleLoader() {
  const { activeTab, pendingConversationId, setActiveTab } = useDashboardStore();
  const can = useAuthStore((s) => s.can);
  // Droits connus : sans eux, tout serait refusé et l'onglet mémorisé serait
  // écrasé à tort (avant la lecture du cookie, ou juste avant la redirection
  // vers la connexion).
  const droitsConnus = useAuthStore((s) => !!(s.isAuthenticated && s.user?.permissions?.modules));
  // Le menu se redessine quand les droits sont relus (GET /auth/permissions).
  const { navigationItems } = useGetMenuConfig();

  // Le rendu serveur ne connaît ni les droits (cookie) ni l'onglet mémorisé
  // (localStorage) : on attend le montage pour décider, sans écart d'hydratation.
  const [monte, setMonte] = useState(false);
  useEffect(() => {
    setMonte(true);
  }, []);

  // Onglets que le menu montre à ce compte, dans l'ordre du menu. Un groupe
  // refusé masque tous ses sous-menus.
  const ongletsVisibles: string[] = [];
  for (const item of navigationItems) {
    if (item.canAccess && !item.canAccess()) continue;
    if (item.items && item.items.length > 0) {
      for (const sub of item.items) {
        if (!sub.canAccess || sub.canAccess()) ongletsVisibles.push(cleOnglet(sub.id));
      }
    } else {
      ongletsVisibles.push(cleOnglet(item.id));
    }
  }

  const demande = (activeTab as string | null) ?? "dashboard";
  const alias = possede(ALIAS_MENU, demande) ? ALIAS_MENU[demande] : undefined;
  const ecran = possede(modulesMap, demande) ? demande : alias;
  const entreeMenu = alias ?? demande;
  const autorise = !ecran
    ? false
    : possede(HORS_MENU, entreeMenu)
      ? HORS_MENU[entreeMenu](can)
      : ongletsVisibles.includes(entreeMenu);

  // Repli : le tableau de bord, sinon le premier écran que le menu propose.
  const repli = ongletsVisibles.includes("dashboard")
    ? "dashboard"
    : (ongletsVisibles.find((onglet) => possede(modulesMap, onglet)) ?? null);

  // Un onglet mémorisé (ou ouvert par un lien, une notification) que le compte
  // ne peut plus ouvrir : on revient sur le repli, pour que le menu suive.
  const refuse = monte && droitsConnus && !!activeTab && !!ecran && !autorise;
  useEffect(() => {
    if (refuse && repli) setActiveTab(repli as TabKey);
  }, [refuse, repli, setActiveTab]);

  if (!monte || !droitsConnus) return <LoadingSpinner />;

  const cle = autorise ? ecran : repli;
  if (!cle) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Aucun écran n&apos;est ouvert à votre compte.
      </div>
    );
  }

  // Inbox : on transmet la conversation en attente (deep-link, notification).
  if (cle === "inbox") {
    const InboxComp = modulesMap["inbox"];
    return <InboxComp initialConversationId={pendingConversationId} />;
  }

  const Component = modulesMap[cle];
  return <Component />;
}
