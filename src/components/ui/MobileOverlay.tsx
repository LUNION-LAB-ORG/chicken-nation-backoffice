"use client";

import { useUIStore } from "@/store/uiStore";

export default function MobileOverlay() {
  const { isSidebarOpen, isMobile, setIsSidebarOpen } = useUIStore();

  if (!isSidebarOpen || !isMobile) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
      onClick={() => setIsSidebarOpen(false)}
    />
  );
}