import { useUIStore } from "@/store/uiStore";
import { useEffect } from "react";

export function useResponsiveLayout() {
  const { setIsMobile, setIsSidebarOpen } = useUIStore();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1080;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobile, setIsSidebarOpen]);
}