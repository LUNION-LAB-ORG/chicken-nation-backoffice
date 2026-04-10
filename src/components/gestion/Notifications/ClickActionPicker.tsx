"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllCategories, Category } from "@/services/categoryService";
import { searchMenus } from "@/services/menuService";
import { MousePointerClick, Search } from "lucide-react";

const CLICK_ACTIONS = [
  { id: "none", label: "Accueil" },
  { id: "menu", label: "Fiche produit" },
  { id: "category", label: "Catégorie" },
  { id: "promotions", label: "Promotions" },
  { id: "vouchers", label: "Bons de réduction" },
  { id: "loyalty", label: "Fidélité / Profil" },
  { id: "nation_card", label: "Carte Nation" },
  { id: "url", label: "Lien externe" },
];

export interface ClickActionData {
  action: string;
  value: string;
}

interface ClickActionPickerProps {
  action: string;
  value: string;
  onChange: (data: ClickActionData) => void;
}

/**
 * Construit le payload `data` pour la notification push à partir de l'action sélectionnée.
 */
export function buildClickData(action: string, value: string): Record<string, unknown> | undefined {
  switch (action) {
    case "menu":
      return value ? { menu_id: value } : undefined;
    case "category":
      return value ? { category_id: value } : undefined;
    case "url":
      return value ? { url: value } : undefined;
    case "promotions":
      return { type: "PROMOTION" };
    case "vouchers":
      return { type: "VOUCHER" };
    case "loyalty":
      return { type: "LOYALTY" };
    case "nation_card":
      return { type: "NATION_CARD" };
    default:
      return undefined;
  }
}

/**
 * Restaure l'action au clic depuis les données d'une notification existante.
 */
export function restoreClickAction(data?: Record<string, unknown>): ClickActionData {
  if (!data) return { action: "none", value: "" };

  if (data.menu_id) return { action: "menu", value: data.menu_id as string };
  if (data.category_id) return { action: "category", value: data.category_id as string };
  if (data.url) return { action: "url", value: data.url as string };
  if (data.type === "PROMOTION" || data.type === "promo") return { action: "promotions", value: "" };
  if (data.type === "VOUCHER" || data.type === "voucher") return { action: "vouchers", value: "" };
  if (data.type === "LOYALTY" || data.type === "loyalty") return { action: "loyalty", value: "" };
  if (data.type === "NATION_CARD" || data.type === "nation_card") return { action: "nation_card", value: "" };

  return { action: "none", value: "" };
}

export default function ClickActionPicker({ action, value, onChange }: ClickActionPickerProps) {
  const [menuSearch, setMenuSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // Charger les catégories
  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: getAllCategories,
    staleTime: 5 * 60 * 1000,
    enabled: action === "category",
  });

  // Charger les menus avec recherche
  const { data: menusData } = useQuery({
    queryKey: ["menus-search", menuSearch],
    queryFn: () => searchMenus({ search: menuSearch, limit: 20 }),
    staleTime: 30 * 1000,
    enabled: action === "menu",
  });

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [categories, categorySearch]);

  const menus = menusData?.data ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <MousePointerClick size={16} className="text-gray-500" />
        <label className="text-sm font-medium text-gray-700">
          Action au clic (optionnel)
        </label>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Que se passe-t-il quand le client clique sur la notification ?
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {CLICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange({ action: a.id, value: "" })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              action === a.id
                ? "bg-[#F17922] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Sélecteur de produit */}
      {action === "menu" && (
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Rechercher un produit..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {menus.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {menuSearch ? "Aucun produit trouvé" : "Tapez pour rechercher un produit"}
              </p>
            ) : (
              menus.map((menu) => (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => onChange({ action: "menu", value: menu.id })}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-orange-50 transition-colors cursor-pointer ${
                    value === menu.id ? "bg-[#FFF3E8]" : ""
                  }`}
                >
                  {menu.image && (
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{menu.name}</p>
                    <p className="text-xs text-gray-400">{menu.price?.toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  {value === menu.id && (
                    <span className="text-xs text-[#F17922] font-medium flex-shrink-0">Sélectionné</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sélecteur de catégorie */}
      {action === "category" && (
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Rechercher une catégorie..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {filteredCategories.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Aucune catégorie trouvée</p>
            ) : (
              filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChange({ action: "category", value: cat.id })}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-orange-50 transition-colors cursor-pointer ${
                    value === cat.id ? "bg-[#FFF3E8]" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-gray-400 truncate">{cat.description}</p>
                    )}
                  </div>
                  {value === cat.id && (
                    <span className="text-xs text-[#F17922] font-medium flex-shrink-0">Sélectionné</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* URL externe */}
      {action === "url" && (
        <input
          type="url"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="https://chicken-nation.com/..."
          value={value}
          onChange={(e) => onChange({ action: "url", value: e.target.value })}
        />
      )}
    </div>
  );
}
