"use client";

import { ChevronLeft, MoreVertical, Search, LucideIcon } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { ViewType } from "@/store/dashboardStore";

interface SearchConfig {
  placeholder?: string;
  buttonText?: string;
  value?: string;
  onSearch?: (value: string) => void;
  realTimeSearch?: boolean;
}

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
  className?: string;
  customComponent?: React.ReactNode;
  /** Masquer cette action sur mobile (ex. déjà couverte par la barre d'onglets). */
  hideOnMobile?: boolean;
}

interface DashboardPageHeaderProps {
  // Mode et navigation
  mode?: ViewType;
  onBack?: () => void;

  // Contenu
  title: string;
  subtitle?: string;

  searchConfig?: SearchConfig;

  // Actions
  actions?: ActionButton[];

  // Style
  gradient?: boolean;
  className?: string;
}

const DashboardPageHeader = ({
  mode = "list",
  onBack,
  title,
  subtitle,
  searchConfig,
  actions = [],
  gradient = true,
  className = "",
}: DashboardPageHeaderProps) => {
  const [searchValue, setSearchValue] = React.useState(searchConfig?.value);
  const [actionsMenuOpen, setActionsMenuOpen] = React.useState(false);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleSearch = () => {
    searchConfig?.onSearch?.(searchValue);
  };

  // ✅ Gestion de la recherche en temps réel
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Si la recherche en temps réel est activée, déclencher la recherche immédiatement
    if (searchConfig?.realTimeSearch) {
      setTimeout(() => {
        searchConfig?.onSearch?.(value);
      }, 1000);
    }
  };

  // ✅ Gestion de la touche Entrée
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const renderSearchBar = () => {
    if (!searchConfig) return null;

    return (
      <div className="flex w-full -mt-2 sm:mt-0 sm:w-auto sm:flex-1 max-w-full sm:max-w-[280px] md:max-w-md py-1.5 rounded-xl sm:rounded-2xl bg-[#F5F5F5] pr-2">
        <div className="flex items-center w-full">
          <Search className="text-[#9E9E9E] ml-3 sm:ml-4" size={18} />
          <input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={searchConfig.placeholder || "Rechercher..."}
            className="w-full px-2 sm:px-3  font-light  py-1 text-sm text-gray-700 focus:outline-none bg-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-2 sm:px-3 py-1 text-xs cursor-pointer hover:opacity-90 text-white bg-[#F17922] rounded-lg sm:rounded-xl whitespace-nowrap"
        >
          {searchConfig.buttonText || "Chercher"}
        </button>
      </div>
    );
  };

  // Bouton « plein » desktop — comportement inchangé (≥ sm)
  const renderDesktopButton = (action: ActionButton, index: number) => {
    if (action.customComponent) {
      return (
        <div key={index} className={mode === "list" ? "w-full sm:w-auto" : ""}>
          {action.customComponent}
        </div>
      );
    }
    const Icon = action.icon;
    return (
      <motion.button
        key={index}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={action.onClick}
        className={`
          px-3 py-1 sm:py-1 cursor-pointer text-sm  font-light rounded-xl transition-colors flex items-center justify-center gap-2
          ${
            action.className ||
            (action.variant === "secondary"
              ? "text-gray-700 bg-gray-100 hover:bg-gray-200"
              : "text-white bg-[#F17922] hover:bg-[#e06816]")
          }
          ${mode === "list" ? "w-full sm:w-auto" : ""}
        `}
      >
        {Icon && <Icon size={18} />}
        {action.label}
      </motion.button>
    );
  };

  const renderActions = () => {
    if (actions.length === 0) return null;

    // Sur mobile, on épure : actions couvertes ailleurs masquées, le reste replié
    const mobileActions = actions.filter((a) => !a.hideOnMobile);
    const primary = mobileActions[0];
    const rest = mobileActions.slice(1);
    const PrimaryIcon = primary?.icon;

    return (
      <>
        {/* Desktop (≥ sm) : rangée complète, inchangée */}
        <div className="hidden sm:flex mt-4 flex-row gap-2 w-auto">
          {actions.map(renderDesktopButton)}
        </div>

        {/* Mobile (< sm) : action principale + menu déroulant « ⋯ » */}
        {mobileActions.length > 0 && (
          <div className="flex sm:hidden mt-3 w-full items-center gap-2">
            {primary &&
              (primary.customComponent ? (
                <div className="flex-1 min-w-0">{primary.customComponent}</div>
              ) : (
                <button
                  type="button"
                  onClick={primary.onClick}
                  className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#F17922] active:bg-[#e06816]"
                >
                  {PrimaryIcon && <PrimaryIcon size={18} className="shrink-0" />}
                  <span className="truncate">{primary.label}</span>
                </button>
              ))}

            {rest.length > 0 && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setActionsMenuOpen((o) => !o)}
                  aria-label="Plus d'actions"
                  className="p-2.5 rounded-xl border border-gray-200 text-gray-600 active:bg-gray-100"
                >
                  <MoreVertical size={20} />
                </button>

                {actionsMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActionsMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 max-w-[80vw] bg-white rounded-xl shadow-lg border border-gray-200 z-20 p-1.5">
                      {rest.map((a, i) => {
                        if (a.customComponent) {
                          return (
                            <div
                              key={i}
                              className="px-1 py-1"
                              onClick={() => setActionsMenuOpen(false)}
                            >
                              {a.customComponent}
                            </div>
                          );
                        }
                        const Icon = a.icon;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              a.onClick();
                              setActionsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 active:bg-orange-50"
                          >
                            {Icon && (
                              <Icon size={18} className="text-gray-500 shrink-0" />
                            )}
                            <span className="truncate">{a.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <motion.nav
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`
        flex flex-col sm:flex-row items-start sm:items-center justify-between
        w-full px-3 sm:px-4 py-2 sm:py-3 bg-white mb-4 sm:mb-6
         sm:-mt-6 border border-slate-200
        rounded-b-2xl sm:rounded-3xl ${className}
      `}
    >
      <div className="flex flex-col sm:flex-row pt-5 items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
        {/* Bouton retour et titre de la section*/}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-2 hover:bg-gray-100 cursor-pointer rounded-full transition-colors"
            >
              <ChevronLeft size={30} className="text-[#F17922]" />
            </motion.button>
          )}

          <div className="flex flex-col">
            <span
              className={`
              text-xl sm:text-xl lg:mt-0  font-urbanist  lg:text-3xl font-bold
              ${
                gradient
                  ? "bg-gradient-to-l from-[#FA6345] to-[#F17922] bg-clip-text text-transparent"
                  : "text-[#F17922]"
              }
            `}
            >
              {title}
            </span>
            {subtitle && (
              <span className="text-sm text-gray-500">{subtitle}</span>
            )}
          </div>
        </div>

        {/* Barre de recherche*/}
        {renderSearchBar()}
      </div>

      {/* Boutons d'actions */}
      {renderActions()}
    </motion.nav>
  );
};

export default DashboardPageHeader;
