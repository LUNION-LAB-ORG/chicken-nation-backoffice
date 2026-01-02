interface ClientTabsProps {
  activeTab: "overview" | "orders" | "favorites" | "reviews" | "addresses";
  onTabChange: (tab: "overview" | "orders" | "favorites" | "reviews" | "addresses") => void;
}

export function ClientTabs({ activeTab, onTabChange }: ClientTabsProps) {
  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "orders", label: "Commandes" },
    { id: "favorites", label: "Favoris" },
    { id: "reviews", label: "Avis" },
    { id: "addresses", label: "Adresses" },
  ] as const;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[#F17922] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}