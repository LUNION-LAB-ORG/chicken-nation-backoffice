import React from 'react';
import {GenericStatCard} from "@/components/gestion/Dashboard/GenericStatCard";
import AppClickListTable from "@/components/gestion/Marketing/app-click-list-table";
import {useAnalyticsStats} from "../../../../features/analytics/hooks/useAnalyticsStats";

function MarketingModule(props) {

	const {
		data
	} = useAnalyticsStats();

	return (
		<div className="flex-1 overflow-auto p-6">
			<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
				<GenericStatCard
					title="Nombre de clics"
					value={data?.totalClicks || 0}
					badgeText={"Clics totaux"}
					badgeColor="#EA4335"
				/>
				<GenericStatCard
					title="Clics (24h)"
					value={data?.clicksLast24h || 0}
					badgeText={"24h"}
					badgeColor="#4285F4"
				/>
				<GenericStatCard
					title="Clics Apple"
					value={data?.clicksApple || 0}
					badgeText={"iOS"}
					badgeColor="#FF6D01"
				/>
				<GenericStatCard
					title="Clics Android"
					value={data?.clicksAndroid || 0}
					badgeText={"Android"}
					badgeColor="#34A853"
				/>
				<AppClickListTable/>
			</div>
		</div>
	);
}

export default MarketingModule;