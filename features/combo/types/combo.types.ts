// Types du jeu "Combo Mystère" (Phase 6) — miroir du contrat backend
// base: /api/v1/fidelity/combo
//
// Décisions métier :
// - Attribution du lot = TIRAGE AU SORT de N gagnants (winners_count) parmi
//   TOUTES les bonnes réponses (coût borné).
// - Essais = plafond strict par compte et par partie (max_attempts, défaut 3, RG-10).
// - Le lot = récompense existante (Reward GIFT = plat offert au panier à 0 fr,
//   EXCLUSIF app, RG-03). On réutilise le système Reward, on ne réinvente rien.
// - La combinaison-solution est CONFIGURABLE : un ensemble d'items du MENU RÉEL
//   (plats / suppléments).

/** Type d'item du menu réel composant la solution. */
export type ComboItemType = "DISH" | "SUPPLEMENT";

/** Un item de la combinaison-solution (plat ou supplément du menu réel). */
export interface ComboSolutionItem {
  item_type: ComboItemType;
  item_id: string;
  /** Nom figé au moment de la config (affichage). */
  name?: string;
  quantity?: number;
}

/** Le lot mis en jeu = un plat OU un supplément offert (Reward GIFT),
 *  récupérable au panier à 0 fr. */
export interface ComboGift {
  /** Nature du cadeau (snapshot serveur). */
  item_type?: ComboItemType;
  /** Renseigné si le cadeau est un plat. */
  dish_id?: string;
  /** Renseigné si le cadeau est un supplément. */
  supplement_id?: string;
  label?: string;
  /** Nom figé au moment de la config (affichage). */
  name?: string;
  /** Prix d'origine figé (affichage). */
  price?: number;
  image?: string | null;
  quantity?: number;
}

/** Statut calculé côté serveur (dérivé de la fenêtre + tirage). */
export type ComboStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "DRAWN";

export interface ComboGameStats {
  /** Nombre de joueurs distincts ayant tenté. */
  participants_count: number;
  /** Nombre de bonnes réponses (pool du tirage). */
  correct_count: number;
  /** Nombre de gagnants effectivement tirés. */
  winners_count: number;
}

export interface ComboGame {
  id: string;
  title: string;
  description: string | null;
  /** Indices affichés au joueur. */
  hints: string[];
  /** Combinaison-solution (items du menu réel). */
  solution_items: ComboSolutionItem[];
  starts_at: string;
  ends_at: string;
  /** Essais autorisés par compte et par partie (RG-10). */
  max_attempts: number;
  /** Nombre de gagnants tirés au sort parmi les bonnes réponses. */
  winners_count: number;
  /** Lot mis en jeu (plat offert GIFT). */
  gift: ComboGift;
  active: boolean;
  /** Le tirage au sort a-t-il déjà eu lieu ? */
  winners_drawn: boolean;
  /** Statut calculé (dérivé de la fenêtre + tirage). */
  status?: ComboStatus;
  /** Statistiques de suivi (optionnelles selon l'endpoint). */
  stats?: ComboGameStats;
  created_at: string;
  updated_at: string;
}

// --- DTO create / update ---

export interface CreateComboGameDto {
  title: string;
  description?: string | null;
  hints: string[];
  solution_items: ComboSolutionItem[];
  starts_at: string;
  ends_at: string;
  /** Défaut serveur = 3. */
  max_attempts?: number;
  winners_count: number;
  gift: ComboGift;
  active?: boolean;
}

export type UpdateComboGameDto = Partial<CreateComboGameDto>;

// --- Suivi : participations, bonnes réponses, gagnants ---

export interface ComboParticipation {
  id: string;
  game_id: string;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  /** Essais consommés (borné à max_attempts, RG-10). */
  attempts_used: number;
  /** A trouvé la bonne combinaison. */
  is_correct: boolean;
  /** Horodatage de la bonne réponse (RG-10), null si pas encore trouvé. */
  answered_at: string | null;
  /** Horodatage du dernier essai. */
  last_attempt_at: string | null;
}

export interface ComboWinner {
  id: string;
  game_id: string;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  /** Reward GIFT attribué (récupérable au panier à 0 fr). */
  reward_id: string | null;
  /** Horodatage du tirage. */
  drawn_at: string;
}

/** Résultat du tirage au sort déclenché par l'admin. */
export interface ComboDrawResult {
  winners: ComboWinner[];
  drawn_count: number;
}
