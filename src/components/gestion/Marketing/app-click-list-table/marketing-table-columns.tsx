import { ColumnDef } from "@tanstack/react-table";
import { IAppClick } from "../../../../../features/analytics/types/analytics.type";
import { deeplinkTypeMeta } from "@/components/gestion/Marketing/deeplink-types";

export type MarketingTableColumn = ColumnDef<IAppClick>;

export const marketingTableColumns: MarketingTableColumn[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: (info) => {
      const meta = deeplinkTypeMeta(info.row.original.type);
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
          style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: meta.color }}
          />
          {meta.label}
        </span>
      );
    },
  },
  {
    accessorKey: "targetLabel",
    header: "Cible",
    cell: (info) =>
      info.row.original.targetLabel ? (
        <span className="text-slate-700">{info.row.original.targetLabel}</span>
      ) : (
        <span className="text-slate-300">—</span>
      ),
  },
  {
    accessorKey: "platform",
    header: "Plateforme",
    cell: (info) => info.getValue() ?? "—",
  },
  {
    accessorKey: "ip",
    header: "Adresse IP",
    cell: (info) => (info.row.original.ip ?? "").replace("::ffff:", "") || "—",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: (info) => new Date(info.getValue() as string).toLocaleString(),
  },
  {
    accessorKey: "userAgent",
    header: "User Agent",
    cell: (info) => (
      <span className="block max-w-[22rem] truncate text-xs text-slate-400">
        {String(info.getValue() ?? "")}
      </span>
    ),
  },
];
