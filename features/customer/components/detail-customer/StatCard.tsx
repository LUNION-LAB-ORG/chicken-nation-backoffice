import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  gradient: "blue" | "emerald" | "amber" | "rose";
}

const gradientStyles = {
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100",
    border: "border-blue-200",
    iconBg: "bg-blue-500",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
    border: "border-emerald-200",
    iconBg: "bg-emerald-500",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-50 to-amber-100",
    border: "border-amber-200",
    iconBg: "bg-amber-500",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-50 to-rose-100",
    border: "border-rose-200",
    iconBg: "bg-rose-500",
  },
};

export function StatCard({ icon, value, label, gradient }: StatCardProps) {
  const styles = gradientStyles[gradient];

  return (
    <div className={`${styles.bg} rounded-xl p-4 border ${styles.border}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${styles.iconBg} rounded-lg`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
}
