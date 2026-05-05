/**
 * Types — Module Schedule (P7).
 *
 * Miroir TypeScript des entités Prisma + DTOs API.
 */

export type SchedulePlanStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'ARCHIVED';
export type ShiftType = 'MORNING' | 'EVENING';
export type ShiftAssignmentStatus = 'ASSIGNED' | 'CONFIRMED' | 'REFUSED';
export type RestDaySource = 'AUTO' | 'MANUAL_DELIVERER' | 'MANUAL_ADMIN';
export type PresenceCheckResponse = 'PRESENT' | 'ABSENT' | 'NO_RESPONSE';

export interface ISchedulePlan {
  id: string;
  restaurant_id: string;
  period_start: string; // ISO date
  period_end: string;
  status: SchedulePlanStatus;
  confirmed_count: number;
  sent_at: string | null;
  confirmed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IShiftAssignment {
  id: string;
  status: ShiftAssignmentStatus;
  confirmed_at: string | null;
  refused_at: string | null;
  refusal_reason: string | null;
  deliverer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string;
    image: string | null;
    type_vehicule: string | null;
  };
}

export interface IShift {
  id: string;
  date: string; // ISO date
  type: ShiftType;
  start_time: string;
  end_time: string;
  max_slots: number;
  assignments: IShiftAssignment[];
}

export interface ISchedulePlanDetail extends ISchedulePlan {
  shifts: IShift[];
  restaurant: { id: string; name: string; address: string | null };
}

export interface ISchedulePlanStats {
  confirmed: number;
  refused: number;
  pending: number;
}

export interface IGeneratePlanPayload {
  restaurantId: string;
  periodStart: string; // ISO date YYYY-MM-DD
  periodEnd?: string;
}
