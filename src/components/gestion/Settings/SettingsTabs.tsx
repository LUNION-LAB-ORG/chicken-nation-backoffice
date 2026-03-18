"use client";

import React from "react";

interface SettingsTabsProps {
  tabs: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({ tabs, selected, onSelect }) => {
  return (
    <div
      className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 mb-6 w-fit
      overflow-x-auto scrollbar-thin scrollbar-thumb-[#E4E4E7]
      scrollbar-track-transparent"
      style={{ minHeight: 40 }}
    >
      {tabs.map((tab, idx) => (
        <button
          key={tab.key}
          className={`transition-colors font-bold cursor-pointer text-[11px] lg:text-[14px]
             px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap
            ${
              selected === tab.key
                ? "bg-[#F17922] text-white font-bold shadow-none"
                : "bg-transparent text-[#71717A] font-normal"
            }
            ${idx === 0 ? "" : "ml-1"}
          `}
          style={{ minWidth: 75, height: 30 }}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SettingsTabs;
