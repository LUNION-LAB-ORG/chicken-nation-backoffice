import { useDashboardStore } from "@/store/dashboardStore";
import { useNavigationStore } from "@/store/navigationStore";
import { useEffect } from "react";

export function useInboxNavigation() {
  const { setActiveTab } = useDashboardStore();
  const { setActiveSubModule, setInitialConversationId } = useNavigationStore();

  useEffect(() => {
    const handleOpenInbox = (e: CustomEvent) => {
      const conversationId = e?.detail?.conversationId || null;
      setActiveTab("messages-tickets");
      setActiveSubModule("inbox");
      setInitialConversationId(conversationId);
    };

    window.addEventListener("openInboxFromHeader", handleOpenInbox as EventListener);
    return () => {
      window.removeEventListener("openInboxFromHeader", handleOpenInbox as EventListener);
    };
  }, [setActiveTab, setActiveSubModule, setInitialConversationId]);
}