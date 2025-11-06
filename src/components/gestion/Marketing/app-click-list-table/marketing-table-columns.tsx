import {ColumnDef} from "@tanstack/react-table";
import {IAppClick} from "../../../../../features/analytics/types/analytics.type";

export type MarketingTableColumn = ColumnDef<IAppClick>;

export const marketingTableColumns: MarketingTableColumn[] = [
	{
		accessorKey: 'referer',
		header: 'Referer',
		cell: info => info.getValue(),
	},
	{
		accessorKey: 'platform',
		header: 'Platform',
		cell: info => info.getValue(),
	},
	{
		accessorKey: 'ip',
		header: 'Adresse IP',
		cell: info => info.getValue(),
	},
	{
		accessorKey: 'createdAt',
		header: 'Date',
		cell: info => new Date(info.getValue() as string).toLocaleString(),
	},
	{
		accessorKey: 'userAgent',
		header: 'User Agent',
		cell: info => info.getValue(),
	}
];