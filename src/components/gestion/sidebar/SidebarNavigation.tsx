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
          const isParentActive = item.items!.some((sub) =>
            sub.id.includes(activeTab)
          );

          return (
            <div key={item.id}>
              <button
                onClick={(e) => toggleSection(item.id, e)}
                className={`w-full flex justify-between items-center gap-2 px-4 py-[10px] rounded-[14px]
                  ${
                    isParentActive
                      ? "bg-linear-to-r from-[#F17922] to-[#FA6345]"
                      : "hover:bg-gray-100"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-5 w-5 ${
                      isParentActive ? "text-white" : "text-gray-500"
                    }`}
                  />
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
                  const isActive = sub.id.includes(activeTab);

                  return (
                    <button
                      key={sub.id}
                      onClick={() => onNavigationChange(sub.id)}
                      className={`ml-[10%] w-[90%] flex items-center gap-2 px-4 py-[10px] rounded-[14px]
                        ${isActive ? "bg-orange-50" : "hover:bg-gray-50"}`}
                    >
                      <SubIcon
                        className={`h-4 w-4 ${
                          isActive ? "text-[#F17922]" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isActive ? "text-[#F17922]" : "text-gray-600"
                        }`}
                      >
                        {sub.label}
                      </span>
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
