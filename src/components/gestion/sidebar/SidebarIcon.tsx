"use client";

import { formatImageUrl } from "@/utils/imageHelpers";
import Image from "next/image";
import React from "react";

interface SidebarIconProps {
  defaultIcon: string;
  whiteIcon: string;
  alt: string;
  active: boolean;
  className?: string;
}

export const SidebarIcon: React.FC<SidebarIconProps> = ({
  defaultIcon,
  whiteIcon,
  alt,
  active,
  className,
}) => (
  <div className={`relative ${className || "size-5"}`}>
    <Image
      src={active ? formatImageUrl(whiteIcon) : formatImageUrl(defaultIcon)}
      alt={alt}
      fill
      className={`inset-0`}
    />
  </div>
);
