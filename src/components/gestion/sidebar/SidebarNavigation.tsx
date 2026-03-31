"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { NavigationItem } from "@/hooks/useMenuConfig";

interface SidebarNavigationProps {
  isClient: boolean;
  navigationItems: NavigationItem[];
  activeTab: string;
  onNavigationChange: (id: string) => void;
}

export default function SidebarNavigation({
  isClient,
  navigationItems,
  activeTab,
  onNavigationChange,
}: SidebarNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSections((p) => ({ ...p, [id]: !p[id] }));
  };

  if (!isClient) return null;

  return (
    <div className="space-y-1">
      {navigationItems.map((item) => {
        if (item.canAccess && !item.canAccess()) return null;

        const Icon = item.icon;
        const hasItems = item.items && item.items.length > 0;

        // ---------- PARENT WITH CHILDREN ----------
        if (hasItems) {
          const isParentActive = item.items!.some((sub) => {
            const subKey = sub.id.includes('-') ? sub.id.split('-').slice(1).join('-') : sub.id;
            return subKey === activeTab;
          });

          return (
            <div key={item.id}>
              <button
                onClick={(e) => toggleSection(item.id, e)}
                className={`relative w-full flex justify-between items-center gap-2 px-4 py-[10px] rounded-[14px]
                  ${
                    isParentActive
                      ? "bg-linear-to-r from-[#F17922] to-[#FA6345]"
                      : "hover:bg-gray-100"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Icon
                      className={`h-5 w-5 ${
                        isParentActive ? "text-white" : "text-gray-500"
                      }`}
                    />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isParentActive ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {expandedSections[item.id] ? (
                  <ChevronDown
                    className={`h-4 w-4 ${
                      isParentActive ? "text-white" : "text-gray-400"
                    }`}
                  />
                ) : (
                  <ChevronRight
                    className={`h-4 w-4 ${
                      isParentActive ? "text-white" : "text-gray-400"
                    }`}
                  />
                )}
              </button>

              {expandedSections[item.id] &&
                item.items!.map((sub) => {
                  const SubIcon = sub.icon;
                  const subKey = sub.id.includes('-') ? sub.id.split('-').slice(1).join('-') : sub.id;
                  const isActive = subKey === activeTab;

                  return (
                    <button
                      key={sub.id}
                      onClick={() => onNavigationChange(sub.id)}
                      className={`ml-[10%] w-[90%] flex items-center gap-2 px-4 py-[10px] rounded-[14px]
                        ${isActive ? "bg-orange-50" : "hover:bg-gray-50"}`}
                    >
                      <div className="relative">
                        <SubIcon
                          className={`h-4 w-4 ${
                            isActive ? "text-[#F17922]" : "text-gray-500"
                          }`}
                        />
                        {sub.badge !== undefined && sub.badge > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isActive ? "text-[#F17922]" : "text-gray-600"
                        }`}
                      >
                        {sub.label}
                      </span>
                      {sub.badge !== undefined && sub.badge > 0 && (
                        <span className="ml-auto text-[10px] font-semibold text-red-500">
                          {sub.badge > 99 ? "99+" : sub.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          );
        }

        // ---------- SIMPLE ITEM ----------
        return (
          <SidebarItem
            key={item.id}
            icon={
              <Icon
                className={`h-5 w-5 ${
                  activeTab === item.id ? "text-white" : "text-gray-500"
                }`}
              />
            }
            label={item.label}
            active={activeTab === item.id}
            onClick={() => onNavigationChange(item.id)}
          />
        );
      })}
    </div>
  );
}
