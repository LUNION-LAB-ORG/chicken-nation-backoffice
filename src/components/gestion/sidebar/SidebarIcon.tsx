"use client";

import Image from "next/image";
import React from "react";

interface SidebarIconProps {
  defaultIcon: string;
  whiteIcon: string;
  alt: string;
  active: boolean;
}

interface SidebarProps {
  isMobile: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const SidebarIcon: React.FC<SidebarIconProps> = ({
  defaultIcon,
  whiteIcon,
  alt,
  active,
}) => (
  <div className="relative w-5 h-5">
    <Image
      src={active ? whiteIcon : defaultIcon}
      alt={alt}
      width={20}
      height={20}
      className="absolute inset-0"
    />
  </div>
);
