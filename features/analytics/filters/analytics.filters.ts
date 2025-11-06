import {IAppClickSearchParams} from "../types/analytics.type";
import {parseAsInteger, parseAsIsoDate, parseAsString, SingleParserBuilder} from "nuqs";

export const analyticsFiltersClient: Record<keyof IAppClickSearchParams, SingleParserBuilder<any>> = {
	page: parseAsInteger.withDefault(1),
	limit: parseAsInteger.withDefault(25),
	search: parseAsString.withDefault(""),
	platform: parseAsString.withDefault(""),
	ip: parseAsString.withDefault(""),
	dateFrom: parseAsIsoDate,
	dateTo: parseAsIsoDate,
}