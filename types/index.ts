export interface BaseEntity {
	id: string;
	createdAt: Date;
	updatedAt: Date;
}

export enum SortOrder {
	ASC = 'asc',
	DESC = 'desc'
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	}
}

export interface ActionResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}

export type EntityStatus = 'NEW' | 'ACTIVE' | 'INACTIVE' | 'DELETED';