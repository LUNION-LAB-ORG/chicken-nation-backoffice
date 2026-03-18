"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Unlink,
  Download,
  Upload,
  Users,
  GitCompareArrows,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Store,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
  Zap,
} from "lucide-react";
import {
  getConnectUrl,
  getConnectionStatus,
  disconnectRestaurant,
  pullCatalog,
  pushCatalog,
  pullCustomers,
  previewAutoMatch,
  applyAutoMatch,
  type HubriseConnectionStatus,
  type AutoMatchPreview,
  type MatchProposal,
  type DishMatchProposal,
  type MatchConfirmation,
} from "@/services/hubRiseService";
import { getAllRestaurants, type Restaurant } from "@/services/restaurantService";

// ─── Types locaux ──────────────────────────────────────────────────

interface RestaurantHubriseState {
  restaurant: Restaurant;
  status: HubriseConnectionStatus | null;
  loading: boolean;
  expanded: boolean;
  syncing: { pull: boolean; push: boolean; customers: boolean };
  matchPreview: AutoMatchPreview | null;
  matchLoading: boolean;
  showMatching: boolean;
}

// ─── Composant principal ───────────────────────────────────────────

export default function HubRise() {
  const [restaurants, setRestaurants] = useState<RestaurantHubriseState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les restaurants et leurs statuts HubRise
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const allRestaurants = await getAllRestaurants();
      const states: RestaurantHubriseState[] = await Promise.all(
        allRestaurants.map(async (r: Restaurant) => {
          let status: HubriseConnectionStatus | null = null;
          try {
            status = await getConnectionStatus(r.id || "");
          } catch {
            // Restaurant pas encore connecté
          }
          return {
            restaurant: r,
            status,
            loading: false,
            expanded: false,
            syncing: { pull: false, push: false, customers: false },
            matchPreview: null,
            matchLoading: false,
            showMatching: false,
          };
        })
      );
      setRestaurants(states);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Impossible de charger les restaurants";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Mise à jour d'un restaurant dans le state
  const updateRestaurant = (id: string, updater: (state: RestaurantHubriseState) => RestaurantHubriseState) => {
    setRestaurants((prev) => prev.map((r) => (r.restaurant.id === id ? updater(r) : r)));
  };

  // ─── Actions ──────────────────────────────────────────────────────

  const handleConnect = (restaurantId: string) => {
    const url = getConnectUrl(restaurantId);
    window.open(url, "_blank");
  };

  const handleDisconnect = async (restaurantId: string) => {
    updateRestaurant(restaurantId, (r) => ({ ...r, loading: true }));
    try {
      await disconnectRestaurant(restaurantId);
      updateRestaurant(restaurantId, (r) => ({
        ...r,
        status: { connected: false, locationId: null, catalogId: null, customerListId: null },
        loading: false,
        showMatching: false,
        matchPreview: null,
      }));
      toast.success("Restaurant déconnecté de HubRise");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur lors de la déconnexion";
      toast.error(msg);
      updateRestaurant(restaurantId, (r) => ({ ...r, loading: false }));
    }
  };

  const handleRefreshStatus = async (restaurantId: string) => {
    updateRestaurant(restaurantId, (r) => ({ ...r, loading: true }));
    try {
      const status = await getConnectionStatus(restaurantId);
      updateRestaurant(restaurantId, (r) => ({ ...r, status, loading: false }));
      toast.success("Statut mis à jour");
    } catch {
      updateRestaurant(restaurantId, (r) => ({ ...r, loading: false }));
      toast.error("Impossible de récupérer le statut");
    }
  };

  const handleSync = async (restaurantId: string, type: "pull" | "push" | "customers") => {
    updateRestaurant(restaurantId, (r) => ({
      ...r,
      syncing: { ...r.syncing, [type]: true },
    }));

    try {
      let result;
      switch (type) {
        case "pull":
          result = await pullCatalog(restaurantId);
          break;
        case "push":
          result = await pushCatalog(restaurantId);
          break;
        case "customers":
          result = await pullCustomers(restaurantId);
          break;
      }
      toast.success(result.message || "Synchronisation réussie");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur lors de la synchronisation";
      toast.error(msg);
    } finally {
      updateRestaurant(restaurantId, (r) => ({
        ...r,
        syncing: { ...r.syncing, [type]: false },
      }));
    }
  };

  const handlePreviewMatch = async (restaurantId: string) => {
    updateRestaurant(restaurantId, (r) => ({ ...r, matchLoading: true, showMatching: true }));
    try {
      const preview = await previewAutoMatch(restaurantId);
      updateRestaurant(restaurantId, (r) => ({ ...r, matchPreview: preview, matchLoading: false }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur lors de l'analyse";
      toast.error(msg);
      updateRestaurant(restaurantId, (r) => ({ ...r, matchLoading: false, showMatching: false }));
    }
  };

  const handleApplyMatch = async (restaurantId: string, matches: MatchConfirmation[]) => {
    if (matches.length === 0) {
      toast.error("Aucune correspondance à appliquer");
      return;
    }
    updateRestaurant(restaurantId, (r) => ({ ...r, matchLoading: true }));
    try {
      const result = await applyAutoMatch(restaurantId, matches);
      toast.success(result.message || "Correspondances appliquées");
      updateRestaurant(restaurantId, (r) => ({
        ...r,
        matchLoading: false,
        showMatching: false,
        matchPreview: null,
      }));
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur lors de l'application";
      toast.error(msg);
      updateRestaurant(restaurantId, (r) => ({ ...r, matchLoading: false }));
    }
  };

  const toggleExpand = (restaurantId: string) => {
    updateRestaurant(restaurantId, (r) => ({ ...r, expanded: !r.expanded }));
  };

  const handleCloseMatching = (restaurantId: string) => {
    updateRestaurant(restaurantId, (r) => ({ ...r, showMatching: false, matchPreview: null }));
  };

  // ─── Rendu ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#F17922] animate-spin" />
            <p className="text-gray-500 text-sm">Chargement des restaurants…</p>
          </div>
        </div>
      </div>
    );
  }

  const connectedCount = restaurants.filter((r) => r.status?.connected).length;

  return (
    <div className="flex flex-col h-full w-full p-4">
      {/* Résumé global + bouton actualiser */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-cente gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
            <Store className="w-5 h-5 text-[#F17922]" />
            <div>
              <p className="text-xs text-gray-500">Restaurants</p>
              <p className="text-lg font-semibold text-gray-800">{restaurants.length}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
            <Link2 className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Connectés</p>
              <p className="text-lg font-semibold text-green-600">{connectedCount}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
            <Unlink className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Non connectés</p>
              <p className="text-lg font-semibold text-gray-500">{restaurants.length - connectedCount}</p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser tout
        </button>
      </div>

      {/* Liste des restaurants */}
      <div className="flex-1 bg-white border border-[#ECECEC] rounded-[15px] p-6 flex flex-col gap-4">
        {restaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Store className="w-12 h-12 mb-3" />
            <p className="text-sm">Aucun restaurant trouvé</p>
          </div>
        )}

        {restaurants.map((state) => (
          <RestaurantCard
            key={state.restaurant.id}
            state={state}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRefresh={handleRefreshStatus}
            onSync={handleSync}
            onPreviewMatch={handlePreviewMatch}
            onApplyMatch={handleApplyMatch}
            onToggleExpand={toggleExpand}
            onCloseMatching={handleCloseMatching}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Carte Restaurant ──────────────────────────────────────────────

interface RestaurantCardProps {
  state: RestaurantHubriseState;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onRefresh: (id: string) => void;
  onSync: (id: string, type: "pull" | "push" | "customers") => void;
  onPreviewMatch: (id: string) => void;
  onApplyMatch: (id: string, matches: MatchConfirmation[]) => void;
  onToggleExpand: (id: string) => void;
  onCloseMatching: (id: string) => void;
}

function RestaurantCard({
  state,
  onConnect,
  onDisconnect,
  onRefresh,
  onSync,
  onPreviewMatch,
  onApplyMatch,
  onToggleExpand,
  onCloseMatching,
}: RestaurantCardProps) {
  const { restaurant, status, loading, expanded, syncing, matchPreview, matchLoading, showMatching } = state;
  const id = restaurant.id || "";
  const isConnected = status?.connected === true;

  return (
    <div className="border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* En-tête du restaurant */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => onToggleExpand(id)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F17922]/10 to-[#FA6345]/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-[#F17922]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">{restaurant.name}</h3>
            <p className="text-xs text-gray-400">{restaurant.address || "Adresse non renseignée"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge statut */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isConnected
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-500 border border-gray-200"
              }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            {isConnected ? "Connecté" : "Non connecté"}
          </span>

          {/* Chevron */}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Détails (expandable) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              {/* Infos connexion */}
              {isConnected && status && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Location ID</span>
                      <p className="font-mono text-gray-600 mt-0.5">{status.locationId || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Catalog ID</span>
                      <p className="font-mono text-gray-600 mt-0.5">{status.catalogId || "—"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Customer List ID</span>
                      <p className="font-mono text-gray-600 mt-0.5">{status.customerListId || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {!isConnected ? (
                  // Non connecté → Bouton connecter
                  <ActionButton
                    icon={ExternalLink}
                    label="Connecter à HubRise"
                    onClick={() => onConnect(id)}
                    variant="primary"
                    disabled={loading}
                  />
                ) : (
                  // Connecté → Actions de synchronisation
                  <>
                    <ActionButton
                      icon={Download}
                      label="Importer catalogue"
                      onClick={() => onSync(id, "pull")}
                      variant="secondary"
                      loading={syncing.pull}
                      disabled={syncing.pull || syncing.push}
                    />
                    <ActionButton
                      icon={Upload}
                      label="Envoyer catalogue"
                      onClick={() => onSync(id, "push")}
                      variant="secondary"
                      loading={syncing.push}
                      disabled={syncing.pull || syncing.push}
                    />
                    <ActionButton
                      icon={Users}
                      label="Importer clients"
                      onClick={() => onSync(id, "customers")}
                      variant="secondary"
                      loading={syncing.customers}
                      disabled={syncing.customers}
                    />
                    <ActionButton
                      icon={GitCompareArrows}
                      label="Auto-matching"
                      onClick={() => onPreviewMatch(id)}
                      variant="accent"
                      loading={matchLoading && !showMatching}
                    />

                    <div className="flex-1" />

                    <ActionButton
                      icon={RefreshCw}
                      label="Actualiser"
                      onClick={() => onRefresh(id)}
                      variant="ghost"
                      loading={loading}
                    />
                    <ActionButton
                      icon={Unlink}
                      label="Déconnecter"
                      onClick={() => onDisconnect(id)}
                      variant="danger"
                      loading={loading}
                    />
                  </>
                )}
              </div>

              {/* Section Auto-Matching */}
              <AnimatePresence>
                {showMatching && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <AutoMatchingSection
                      restaurantId={id}
                      preview={matchPreview}
                      loading={matchLoading}
                      onApply={(matches) => onApplyMatch(id, matches)}
                      onClose={() => onCloseMatching(id)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bouton d'action ────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary" | "accent" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, variant, loading, disabled }: ActionButtonProps) {
  const variantStyles: Record<string, string> = {
    primary: "bg-[#F17922] text-white hover:bg-[#e06816] shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    accent: "bg-gradient-to-r from-[#F17922] to-[#FA6345] text-white hover:opacity-90 shadow-sm",
    danger: "bg-white text-red-500 border border-red-200 hover:bg-red-50",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
        transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
      `}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      {label}
    </motion.button>
  );
}

// ─── Section Auto-Matching ──────────────────────────────────────────

interface AutoMatchingSectionProps {
  restaurantId: string;
  preview: AutoMatchPreview | null;
  loading: boolean;
  onApply: (matches: MatchConfirmation[]) => void;
  onClose: () => void;
}

function AutoMatchingSection({ restaurantId, preview, loading, onApply, onClose }: AutoMatchingSectionProps) {
  const [selectedMatches, setSelectedMatches] = useState<MatchConfirmation[]>([]);

  // Initialiser les sélections avec les correspondances proposées
  useEffect(() => {
    if (!preview) return;
    const initial: MatchConfirmation[] = [];

    preview.categoryMatches
      .filter((m) => m.status === "proposed" && m.cnId)
      .forEach((m) => {
        initial.push({ type: "category", cnId: m.cnId!, hubriseRef: m.hubriseRef });
      });

    preview.dishMatches
      .filter((m) => m.status === "proposed" && m.cnId)
      .forEach((m) => {
        initial.push({ type: "dish", cnId: m.cnId!, hubriseRef: m.hubriseRef });
      });

    setSelectedMatches(initial);
  }, [preview]);

  const toggleMatch = (type: "category" | "dish", cnId: string, hubriseRef: string) => {
    setSelectedMatches((prev) => {
      const exists = prev.find((m) => m.type === type && m.hubriseRef === hubriseRef);
      if (exists) {
        return prev.filter((m) => !(m.type === type && m.hubriseRef === hubriseRef));
      }
      return [...prev, { type, cnId, hubriseRef }];
    });
  };

  const isSelected = (type: "category" | "dish", hubriseRef: string) => {
    return selectedMatches.some((m) => m.type === type && m.hubriseRef === hubriseRef);
  };

  if (loading) {
    return (
      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-6 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 text-[#F17922] animate-spin" />
        <p className="text-sm text-gray-600">Analyse des correspondances en cours…</p>
      </div>
    );
  }

  if (!preview) return null;

  const { summary, categoryMatches, dishMatches } = preview;

  return (
    <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-4">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#F17922]" />
          <h4 className="font-semibold text-gray-800">Auto-Matching du catalogue</h4>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <SummaryBadge label="Catégories" total={summary.categories.total} linked={summary.categories.alreadyLinked} proposed={summary.categories.proposed} noMatch={summary.categories.noMatch} />
        <SummaryBadge label="Plats" total={summary.dishes.total} linked={summary.dishes.alreadyLinked} proposed={summary.dishes.proposed} noMatch={summary.dishes.noMatch} />
      </div>

      {/* Tableau Catégories */}
      {categoryMatches.length > 0 && (
        <MatchTable
          title="Catégories"
          matches={categoryMatches}
          type="category"
          isSelected={isSelected}
          onToggle={toggleMatch}
        />
      )}

      {/* Tableau Plats */}
      {dishMatches.length > 0 && (
        <MatchTable
          title="Plats"
          matches={dishMatches}
          type="dish"
          isSelected={isSelected}
          onToggle={toggleMatch}
          isDish
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-orange-100">
        <p className="text-xs text-gray-500">
          {selectedMatches.length} correspondance{selectedMatches.length > 1 ? "s" : ""} sélectionnée{selectedMatches.length > 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <ActionButton icon={X} label="Annuler" onClick={onClose} variant="ghost" />
          <ActionButton
            icon={Check}
            label="Appliquer les correspondances"
            onClick={() => onApply(selectedMatches)}
            variant="primary"
            disabled={selectedMatches.length === 0}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Badge résumé ───────────────────────────────────────────────────

function SummaryBadge({
  label,
  total,
  linked,
  proposed,
  noMatch,
}: {
  label: string;
  total: number;
  linked: number;
  proposed: number;
  noMatch: number;
}) {
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-800">{total}</p>
      <div className="flex gap-2 mt-1 text-[10px]">
        <span className="text-green-600">{linked} liés</span>
        <span className="text-[#F17922]">{proposed} proposés</span>
        <span className="text-gray-400">{noMatch} ∅</span>
      </div>
    </div>
  );
}

// ─── Tableau de correspondances ─────────────────────────────────────

interface MatchTableProps {
  title: string;
  matches: (MatchProposal | DishMatchProposal)[];
  type: "category" | "dish";
  isSelected: (type: "category" | "dish", ref: string) => boolean;
  onToggle: (type: "category" | "dish", cnId: string, ref: string) => void;
  isDish?: boolean;
}

function MatchTable({ title, matches, type, isSelected, onToggle, isDish }: MatchTableProps) {
  return (
    <div className="mb-4">
      <h5 className="text-sm font-medium text-gray-700 mb-2">{title}</h5>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-left">
              <th className="px-3 py-2 w-8" />
              <th className="px-3 py-2">Réf. HubRise</th>
              <th className="px-3 py-2">Nom HubRise</th>
              <th className="px-3 py-2">→</th>
              <th className="px-3 py-2">Nom CN</th>
              {isDish && <th className="px-3 py-2">Prix HR</th>}
              {isDish && <th className="px-3 py-2">Prix CN</th>}
              <th className="px-3 py-2">Confiance</th>
              <th className="px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const isLinked = match.status === "already_linked";
              const hasMatch = match.status === "proposed" && match.cnId;
              const isChecked = isSelected(type, match.hubriseRef);
              const dishMatch = isDish ? (match as DishMatchProposal) : null;

              return (
                <tr
                  key={match.hubriseRef}
                  className={`border-t border-gray-50 ${isLinked ? "bg-green-50/30" : hasMatch ? "hover:bg-orange-50/30" : "bg-gray-50/50 opacity-60"
                    }`}
                >
                  <td className="px-3 py-2">
                    {hasMatch && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggle(type, match.cnId!, match.hubriseRef)}
                        className="rounded border-gray-300 text-[#F17922] focus:ring-[#F17922]"
                      />
                    )}
                    {isLinked && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-600">{match.hubriseRef}</td>
                  <td className="px-3 py-2 text-gray-800">{match.hubriseName}</td>
                  <td className="px-3 py-2 text-gray-300">→</td>
                  <td className="px-3 py-2 text-gray-800">{match.cnName || <span className="text-gray-400 italic">Aucune correspondance</span>}</td>
                  {isDish && (
                    <td className="px-3 py-2 text-gray-600">{dishMatch?.hubrisePrice != null ? `${dishMatch.hubrisePrice} XOF` : "—"}</td>
                  )}
                  {isDish && (
                    <td className="px-3 py-2 text-gray-600">{dishMatch?.cnPrice != null ? `${dishMatch.cnPrice} XOF` : "—"}</td>
                  )}
                  <td className="px-3 py-2">
                    <ConfidenceBadge score={match.confidence} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={match.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Badge confiance ────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  let color = "text-gray-400 bg-gray-100";
  if (score >= 90) color = "text-green-700 bg-green-100";
  else if (score >= 70) color = "text-[#F17922] bg-orange-100";
  else if (score >= 50) color = "text-yellow-700 bg-yellow-100";

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
      {score}%
    </span>
  );
}

// ─── Badge statut ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "already_linked":
      return (
        <span className="inline-flex items-center gap-1 text-green-600 text-[10px]">
          <CheckCircle2 className="w-3 h-3" /> Lié
        </span>
      );
    case "proposed":
      return (
        <span className="inline-flex items-center gap-1 text-[#F17922] text-[10px]">
          <AlertCircle className="w-3 h-3" /> Proposé
        </span>
      );
    case "no_match":
      return (
        <span className="inline-flex items-center gap-1 text-gray-400 text-[10px]">
          <XCircle className="w-3 h-3" /> Aucun
        </span>
      );
    default:
      return null;
  }
}
