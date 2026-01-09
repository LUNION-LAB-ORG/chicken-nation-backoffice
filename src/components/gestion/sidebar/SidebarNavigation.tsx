"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SidebarIcon } from "./SidebarIcon";
import { SidebarItem } from "./SidebarItem";

interface SidebarNavigationProps {
  isClient: boolean;
  navigationItems: any[];
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
        if (!item.canAccess()) return null;

        const hasItems = item.items?.length > 0;
        if (hasItems) {
          const isParentActive = item.items.some((sub: any) =>
            sub.id.includes(activeTab)
          );
          return (
            <div key={item.id}>
              <button
                onClick={(e) => toggleSection(item.id, e)}
                className={`w-full flex justify-between gap-2 items-center px-4 py-[10px] rounded-[14px]
                  ${
                    isParentActive
                      ? "bg-linear-to-r from-[#F17922] to-[#FA6345]"
                      : "hover:bg-gray-100"
                  }`}
              >
                <div className="flex-1 flex items-center gap-2">
                  <SidebarIcon
                    defaultIcon={item.defaultIcon}
                    whiteIcon={item.whiteIcon}
                    alt={item.label}
                    active={isParentActive}
                  />
                  <span
                    className={`text-sm ${isParentActive ? "text-white" : ""}`}
                  >
                    {item.label}
                  </span>
                </div>
                {expandedSections[item.id] ? (
                  <ChevronDown
                    className={`text-sm ${
                      isParentActive ? "text-white" : "text-gray-400"
                    }`}
                  />
                ) : (
                  <ChevronRight
                    className={`text-sm ${
                      isParentActive ? "text-white" : "text-gray-400"
                    }`}
                  />
                )}
              </button>

              {expandedSections[item.id] &&
                item.items.map((sub: any) => (
                  <button
                    key={sub.id}
                    onClick={() => onNavigationChange(sub.id)}
                    className={`ml-[10%] w-[90%] flex gap-2 px-4 py-[10px] rounded-[14px] ${
                      sub.id.includes(activeTab) ? "" : "hover:bg-gray-50"
                    }`}
                  >
                    <SidebarIcon
                      defaultIcon={sub.defaultIcon}
                      whiteIcon={sub.whiteIcon}
                      alt={sub.label}
                      active={sub.id.includes(activeTab)}
                      className="size-4"
                    />
                    <span
                      className={`text-sm ${
                        sub.id.includes(activeTab)
                          ? "text-[#F17922]"
                          : "text-gray-500"
                      }`}
                    >
                      {sub.label}
                    </span>
                  </button>
                ))}
            </div>
          );
        }

        return (
          <SidebarItem
            key={item.id}
            icon={
              <SidebarIcon
                defaultIcon={item.defaultIcon}
                whiteIcon={item.whiteIcon}
                alt={item.label}
                active={activeTab === item.id}
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
