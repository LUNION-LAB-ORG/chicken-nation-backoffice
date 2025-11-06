import { IAppClickSearchParams } from "../types/analytics.type";
import { getAllAppClick, getAppClickStats } from "@/services/analytics-service";
import { handleServerActionError } from "../../../utils/handleServerActionError";

export async function getAllAnalyticsAction(params: IAppClickSearchParams) {
	try {
		const analytics = await getAllAppClick(params)
		return {
			data: analytics,
			success: true,
			message: 'Analytics fetched successfully',
		}
	} catch (error) {
		return handleServerActionError(error, 'Erreur lors de la récupération des analytics')
	}
}

export async function getAnalyticsStatsAction() {
	try {
		const stats = await getAppClickStats();
		return {
			data: stats,
			success: true,
			message: 'Analytics stats fetched successfully',
		};
	} catch (error) {
		return handleServerActionError(error, 'Erreur lors de la récupération des statistiques');
	}
}