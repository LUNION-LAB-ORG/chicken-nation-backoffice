import { getHumanReadableError } from '@/utils/errorMessages';
import { getAuthToken } from "@/utils/authUtils";
import {
	IAppClick,
	IAppClickSearchParams,
	IPaginatedResponse,
	IStatsResponse
} from "../../features/analytics/types/analytics.type";

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;
const ANALYTICS_URL = API_URL + '/marketing';

// Fonction utilitaire pour construire et exécuter les requêtes
const fetchAnalyticsData = async <T>(
	endpoint: string,
	query?: IAppClickSearchParams
): Promise<T> => {
	try {
		const token = getAuthToken();

		if (!token) {
			throw new Error('Authentication required');
		}

		const params = new URLSearchParams();
		if (query) {
			Object.entries(query).forEach(([key, value]) => {
				if (value === undefined || value === null) return;
				if (Array.isArray(value)) {
					value.forEach(v => params.append(key, String(v)));
				} else {
					params.append(key, String(value));
				}
			});
		}

		const url = `${ANALYTICS_URL}${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		return await response.json() as T;
	} catch (error) {
		console.error(error);
		const userMessage = getHumanReadableError(error);
		throw new Error(userMessage);
	}
};

export const getAllAppClick = (query: IAppClickSearchParams) =>
	fetchAnalyticsData<IPaginatedResponse<IAppClick>>('/app-mobile', query);

export const getAppClickStats = () =>
	fetchAnalyticsData<IStatsResponse>('/app-mobile/stats');
