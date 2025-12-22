"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useGetMenuConfig } from "@/hooks/useMenuConfig";
import { SidebarIcon } from "./SidebarIcon";
import { SidebarItem } from "./SidebarItem";

interface SidebarNavigationProps {
  isClient: boolean;
  navigationItems: any[];
  activeTab: string;
  activeSubModule: string;
  onNavigationChange: (itemId: string, subModuleId?: string) => void;
}

export default function SidebarNavigation({
  isClient,
  navigationItems,
  activeTab,
  activeSubModule,
  onNavigationChange,
}: SidebarNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { messageSubModules } = useGetMenuConfig();

  const handleSectionToggle = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    onNavigationChange(sectionId);
  };

  const handleSubModuleClick = (sectionId: string, subModuleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onNavigationChange(sectionId, subModuleId);
  };

  const renderSkeleton = () => (
    <div className="space-y-1">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="w-full flex items-center space-x-3 px-4 py-[10px] rounded-[14px] opacity-0"
        >
          <div className="relative w-5 h-5 bg-gray-200 rounded" />
          <span className="text-sm bg-gray-200 rounded h-4 w-20" />
        </div>
      ))}
    </div>
  );

  const renderExpandableSection = (item: any) => {
    const isActive = activeTab === item.id;
    const isExpanded = expandedSections[item.id];
    const isSubActive = (subModuleId: string) => activeTab === item.id && activeSubModule === subModuleId;

    return (
      <div key={item.id}>
        <button
          onClick={(e) => handleSectionToggle(item.id, e)}
          className={`
            w-full flex items-center cursor-pointer space-x-3 px-4 py-[10px] rounded-[14px]
            ${
              isActive
                ? "bg-gradient-to-r from-[#F17922] to-[#FA6345]"
                : "text-gray-600 hover:bg-gray-100"
            }
            transition-all duration-200
          `}
        >
          <SidebarIcon
            defaultIcon={item.defaultIcon}
            whiteIcon={item.whiteIcon}
            alt={item.label}
            active={isActive}
          />
          <span
            className={`text-sm -ml-6 font-normal cursor-pointer flex-1 ${
              isActive ? "text-white" : "text-gray-600"
            }`}
          >
            {item.label}
          </span>
          {isExpanded ? (
            <ChevronDown
              size={16}
              className={`transition-transform ${
                isActive ? "text-white" : "text-gray-400"
              }`}
            />
          ) : (
            <ChevronRight
              size={16}
              className={`transition-transform ${
                isActive ? "text-white" : "text-gray-400"
              }`}
            />
          )}
        </button>

        {isExpanded && messageSubModules && (
          <div className="ml-6 mt-1 space-y-1">
            {messageSubModules.map((subModule) => {
              const subActive = isSubActive(subModule.id);

              return (
                <button
                  key={subModule.id}
                  onClick={(e) => handleSubModuleClick(item.id, subModule.id, e)}
                  className={`
                    w-full flex items-center cursor-pointer space-x-3 px-4 py-2 rounded-[10px]
                    ${
                      subActive
                        ? "text-primary-500"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }
                    transition-all duration-200
                  `}
                >
                  <SidebarIcon
                    defaultIcon={subModule.defaultIcon}
                    whiteIcon={subModule.whiteIcon}
                    alt={subModule.label}
                    active={subActive}
                  />
                  <span
                    className={`text-sm ${
                      subActive ? "text-primary-500 font-medium" : ""
                    }`}
                  >
                    {subModule.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!isClient) return renderSkeleton();

  return (
    <div className="space-y-1">
      {navigationItems.map((item) => {
        if (!item.canAccess()) return null;

        if (item.hasSubModules) {
          return renderExpandableSection(item);
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