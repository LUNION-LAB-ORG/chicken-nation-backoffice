import { Customer } from "../../customer/types/customer.types"
import { LoyaltyLevel } from "../../points_fedelite/types/loyalty.types"


export type CardRequestStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED"

export type NationCardStatus = "ACTIVE" | "SUSPENDED" | "REVOKED"

/**
 * Profil DECLARATIF choisi par le client à la demande (Phase 3).
 * Indépendant du niveau (un ETUDIANT peut être VIP/VVIP).
 */
export type CardProfileType = "STUDENT" | "PROFESSIONAL"

/** Niveau de la carte, piloté par status_points (Standard / VIP / VVIP). */
export type CardLevel = LoyaltyLevel

export interface CardRequest {
    id: string;
    customer_id: string;
    nickname: string | null;
    /** V2 (justificatif) uniquement ; null en V1 déclaratif. */
    institution: string | null;
    /** V2 (justificatif) uniquement ; null en V1 déclaratif. */
    student_card_file_url: string | null;
    /** Photo du titulaire fournie au formulaire (contrôle backoffice). Clé S3. */
    photo?: string | null;
    /** Profil déclaratif (Étudiant / Professionnel) — Phase 3. */
    profile_type?: CardProfileType | null;
    /** Marqueur ÉTUDIANT déclaratif (indépendant du niveau). */
    is_student?: boolean | null;
    /** Niveau calculé à l'émission (Standard/VIP/VVIP). */
    level?: CardLevel | null;
    status: CardRequestStatus;
    rejection_reason: string | null;
    /** Motif auto-généré d'une demande de RÉVISION (modif de carte depuis l'app). */
    revision_reason?: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
    nation_card?: NationCard | null;
    // Relations
    customer?: Customer;
}

export interface NationCard {
    id: string;
    customer_id: string;
    card_request_id: string;
    nickname: string | null;
    card_number: string;
    qr_code_value: string;
    card_image_url: string;
    status: NationCardStatus;
    /** Niveau de la carte (Standard/VIP/VVIP) — régénéré au changement de niveau / reset annuel. */
    level?: CardLevel | null;
    /** Marqueur ÉTUDIANT déclaratif (indépendant du niveau). */
    is_student?: boolean | null;
    created_at: string;
    updated_at: string;
    // Relations
    card_request?: CardRequest;
    customer?: Customer;
}

export interface CardRequestQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: CardRequestStatus;
    institution?: string;
}

export interface NationCardQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: NationCardStatus;
    institution?: string;
}

/**
 * Carte émise — DEUX AXES INDÉPENDANTS (cahier des charges §4.5) :
 *  - `level`      : la COULEUR (Standard=Orange → VIP=Or → VVIP=Rouge) ;
 *  - `is_student` : le MARQUEUR jaune, posé PAR-DESSUS le niveau.
 * Un étudiant peut donc être « Étudiant + VIP ».
 */
export interface CardVisual {
    level: CardLevel;
    is_student?: boolean;
}

/** Corps de `POST /admin/card-nation/preview-card` (galerie / testeur). */
export interface PreviewCardBody extends CardVisual {
    first_name?: string;
    last_name?: string;
    nickname?: string;
}

/** Réponse d'aperçu : `image` est un data-URL base64 (aucun fichier S3 créé). */
export interface PreviewCardResponse {
    success: boolean;
    data: {
        level: CardLevel;
        is_student: boolean;
        image: string;
    };
}