"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Moon,
  Send,
  Sunrise,
} from "lucide-react";

import { useSettingMutation, useSettingsQuery } from "@/hooks/useSettingsQuery";

interface ISettingField {
  key: string;
  label: string;
  placeholder: string;
  hint?: string;
  step?: string;
  min?: number;
  max?: number;
  /** `'number'` (default) ou `'text'` pour les settings string (ex: "HH:mm-HH:mm"). */
  type?: 'number' | 'text';
  /** Si fourni → rendu en `<select>` (ex: jours de la semaine). */
  options?: { value: string; label: string }[];
}

interface ISettingSection {
  title: string;
  description: string;
  /** Icône lucide-react optionnelle affichée en tête de section. */
  Icon?: React.FC<{ className?: string }>;
  fields: ISettingField[];
}

/**
 * Toutes les clés de settings livraison.
 *
 * Convention de nommage :
 *   - `course.*`     → mécanique de la course elle-même (offre, refus, annulation)
 *   - `deliverer.*`  → scoring, file d'attente, géolocalisation livreur
 *   - `schedule.*`   → planning des créneaux (P7) — période, repos, shifts, volume, workflow
 *
 * Les valeurs par défaut du backend (CourseSettingsHelper + DelivererScoringHelper)
 * sont utilisées si une clé est absente en base — les placeholders ici reflètent
 * ces defaults pour que l'admin voie ce qui s'applique même sans écriture en DB.
 */
const SECTIONS: ISettingSection[] = [
  // ── Section 1 : Offre & refus (existait déjà) ──────────────────────────
  {
    title: "Offre de course & refus",
    description:
      "Mécanique d'envoi d'une course à un livreur et conditions d'abandon automatique.",
    fields: [
      {
        key: "course.offer_duration_seconds",
        label: "Durée d'une offre de course (secondes)",
        placeholder: "90",
        step: "1",
        min: 10,
        hint: "Temps accordé au livreur pour accepter/refuser une offre avant qu'elle expire automatiquement.",
      },
      {
        key: "course.max_refusal_count",
        label: "Nombre max de refus",
        placeholder: "5",
        step: "1",
        min: 1,
        hint: "Au-delà, la course passe en EXPIRED au lieu de continuer à chercher un livreur.",
      },
      {
        key: "course.auto_cancel_accepted_after_min",
        label: "Annulation auto — Course ACCEPTED (minutes)",
        placeholder: "60",
        step: "1",
        min: 5,
        hint: "Délai entre l'acceptation du livreur et son arrivée au restaurant. Au-delà, la course est annulée automatiquement.",
      },
      {
        key: "course.auto_cancel_at_restaurant_after_min",
        label: "Annulation auto — Course AT_RESTAURANT (minutes)",
        placeholder: "30",
        step: "1",
        min: 5,
        hint: "Délai entre l'arrivée du livreur et la validation du code par la caissière.",
      },
    ],
  },

  // ── Section 2 : Regroupement intelligent ──────────────────────────────
  {
    title: "Regroupement intelligent des commandes",
    description:
      "Fenêtre d'attente pour regrouper plusieurs commandes prêtes en une seule course (mutualisation des livraisons).",
    fields: [
      {
        key: "course.batch_window_seconds",
        label: "Fenêtre MAX de regroupement (secondes)",
        placeholder: "180",
        step: "1",
        min: 30,
        max: 600,
        hint: "Délai max d'attente avant flush forcé d'un batch. 180s = 3 min.",
      },
      {
        key: "course.batch_min_wait_seconds",
        label: "Attente MIN avant flush (secondes)",
        placeholder: "120",
        step: "1",
        min: 0,
        max: 600,
        hint: "Délai minimum garanti avant qu'un batch soit flushé, même s'il atteint le plafond. Évite la précipitation et laisse le temps à d'autres commandes d'arriver. 120s = 2 min.",
      },
      {
        key: "course.max_orders_per_course",
        label: "Nombre max de commandes par course",
        placeholder: "3",
        step: "1",
        min: 1,
        max: 10,
        hint: "Plafond de livraisons qu'un livreur transporte en une seule course.",
      },
      {
        key: "course.lookahead_in_progress",
        label: "Anticipation IN_PROGRESS (0/1)",
        placeholder: "1",
        step: "1",
        min: 0,
        max: 1,
        hint: "Si activé (1), quand une commande crée un nouveau batch, on regarde s'il y a des commandes encore en préparation compatibles. S'il n'y en a aucune, le batch part avec un TTL court (= min_wait) au lieu d'attendre la fenêtre max pour rien.",
      },
      {
        key: "course.rebalance_enabled",
        label: "Re-balance des courses (0/1)",
        placeholder: "1",
        step: "1",
        min: 0,
        max: 1,
        hint: "Si activé (1), un cron parcourt périodiquement les courses non encore récupérées et tente de les fusionner ou de transférer des livraisons entre elles pour optimiser après-coup. Les livreurs déjà acceptés sont notifiés.",
      },
      {
        key: "course.rebalance_interval_seconds",
        label: "Fréquence re-balance (secondes)",
        placeholder: "30",
        step: "5",
        min: 10,
        max: 300,
        hint: "Cron qui relance la phase de re-balance.",
      },
      {
        key: "course.max_detour_meters",
        label: "Distance max entre destinations (mètres)",
        placeholder: "1500",
        step: "100",
        min: 100,
        hint: "Distance maximale acceptable entre 2 points de livraison pour les regrouper dans la même course.",
      },
      {
        key: "course.max_route_duration_min",
        label: "Durée max totale du trajet (minutes)",
        placeholder: "25",
        step: "1",
        min: 5,
        hint: "Durée plafond du trajet complet restaurant → dernier client (via Google Directions).",
      },
    ],
  },

  // ── Section 3 : Scoring d'assignation ─────────────────────────────────
  {
    title: "Pondération du scoring livreur",
    description:
      "Poids relatifs des critères utilisés pour choisir le meilleur livreur à qui envoyer une offre (la somme n'a pas besoin d'être 1, c'est relatif).",
    fields: [
      {
        key: "deliverer.score_weight_queue",
        label: "Poids — Position dans la file d'attente",
        placeholder: "0.5",
        step: "0.05",
        min: 0,
        max: 2,
        hint: "Plus ce poids est élevé, plus l'ordre FIFO domine (équité). Baisse-le pour privilégier l'efficacité.",
      },
      {
        key: "deliverer.score_weight_distance",
        label: "Poids — Distance au restaurant",
        placeholder: "0.3",
        step: "0.05",
        min: 0,
        max: 2,
        hint: "Plus ce poids est élevé, plus on privilégie le livreur géographiquement proche.",
      },
      {
        key: "deliverer.score_weight_chain",
        label: "Poids — Chaînage fin de course",
        placeholder: "0.15",
        step: "0.05",
        min: 0,
        max: 2,
        hint: "Bonus pour un livreur qui termine une livraison proche du restaurant (chaînage sans retour à vide).",
      },
      {
        key: "deliverer.score_weight_vehicle",
        label: "Poids — Véhicule adapté",
        placeholder: "0.05",
        step: "0.05",
        min: 0,
        max: 2,
        hint: "Bonus léger si le type de véhicule correspond bien à la distance de la course (vélo pour court, moto pour long).",
      },
      {
        key: "deliverer.scoring_shadow_mode",
        label: "Shadow mode (0 = off, 1 = on)",
        placeholder: "0",
        step: "1",
        min: 0,
        max: 1,
        hint: "Si actif (1), le scoring est calculé et loggé mais n'est PAS appliqué — l'algorithme historique (last_login_at DESC) est utilisé pour la décision réelle. Idéal pour valider le comportement en prod avant bascule.",
      },
    ],
  },

  // ── Section 4 : File d'attente & pénalités ────────────────────────────
  {
    title: "File d'attente & pénalités de refus",
    description:
      "Règles de gestion de la queue FIFO et sanctions appliquées lors de refus répétés.",
    fields: [
      {
        key: "deliverer.refuse_penalty_positions",
        label: "Recul dans la queue après refus (positions)",
        placeholder: "3",
        step: "1",
        min: 0,
        hint: "Nombre de positions perdues dans la file d'attente après un refus ou une offre ignorée.",
      },
      {
        key: "deliverer.refuse_penalty_duration_min",
        label: "Durée de la pénalité (minutes)",
        placeholder: "10",
        step: "1",
        min: 1,
        hint: "Temps pendant lequel la pénalité reste active. Après, le livreur retrouve sa position naturelle.",
      },
      {
        key: "deliverer.auto_pause_refusals_threshold",
        label: "Seuil refus déclenchant auto-pause",
        placeholder: "3",
        step: "1",
        min: 1,
        hint: "Nombre de refus/expirations consécutifs qui déclenchent une mise en pause forcée du livreur.",
      },
      {
        key: "deliverer.auto_pause_refusals_window_min",
        label: "Fenêtre de comptage des refus (minutes)",
        placeholder: "15",
        step: "1",
        min: 1,
        hint: "Les refus sont comptés sur cette période glissante.",
      },
      {
        key: "deliverer.auto_pause_duration_min",
        label: "Durée de l'auto-pause (minutes)",
        placeholder: "30",
        step: "1",
        min: 5,
        hint: "Durée pendant laquelle un livreur auto-pause ne reçoit plus d'offres (il peut la lever manuellement avant).",
      },
    ],
  },

  // ── Section 5 : Chaînage de courses ───────────────────────────────────
  {
    title: "Chaînage de courses (fin imminente)",
    description:
      "Un livreur qui termine sa livraison proche du restaurant peut recevoir une nouvelle course sans repasser par l'état Disponible. Utile pour les périodes de rush.",
    fields: [
      {
        key: "deliverer.chain_max_distance_meters",
        label: "Distance max pour chaîner (mètres)",
        placeholder: "1000",
        step: "100",
        min: 100,
        hint: "Distance maximale entre la dernière livraison et le restaurant pour autoriser le chaînage.",
      },
      {
        key: "deliverer.chain_max_per_hour",
        label: "Nombre max de chaînages par heure",
        placeholder: "2",
        step: "1",
        min: 0,
        hint: "Plafond par livreur pour éviter l'épuisement (0 = chaînage désactivé).",
      },
    ],
  },

  // ── Section 6 : Géolocalisation livreur ───────────────────────────────
  {
    title: "Géolocalisation du livreur",
    description:
      "Fréquence de remontée GPS (position + vitesse) depuis l'app mobile livreur.",
    fields: [
      {
        key: "deliverer.gps_update_interval_seconds",
        label: "Intervalle d'envoi GPS (secondes)",
        placeholder: "60",
        step: "1",
        min: 15,
        max: 300,
        hint: "Fréquence à laquelle l'app mobile remonte la position et la vitesse du livreur. Moins fréquent = meilleure batterie, moins précis.",
      },
      {
        key: "deliverer.gps_expiration_minutes",
        label: "Durée de validité d'une position (minutes)",
        placeholder: "5",
        step: "1",
        min: 1,
        hint: "Au-delà, la position GPS est considérée trop ancienne et ignorée dans le scoring (fallback queue pure).",
      },
      {
        key: "deliverer.gps_max_speed_kmh",
        label: "Vitesse max plausible (km/h)",
        placeholder: "80",
        step: "1",
        min: 10,
        max: 200,
        hint: "Vitesse au-delà de laquelle une remontée GPS est considérée aberrante (moto en zone urbaine Abidjan).",
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────
  // P7 — Module Schedule (créneaux & disponibilité livreurs)
  // 17 settings catégorisés en 6 groupes.
  // ────────────────────────────────────────────────────────────────────────

  // A. Période & rotation
  {
    title: "Planning — Période & rotation",
    Icon: Calendar,
    description:
      "Durée d'un plan de créneaux et cycle de rotation des jours de repos entre livreurs.",
    fields: [
      {
        key: "schedule.planning_period_weeks",
        label: "Durée d'un plan (semaines)",
        placeholder: "2",
        step: "1",
        min: 1,
        hint: "2 = quinzaine. Le plan auto est généré et envoyé tous les X semaines.",
      },
      {
        key: "schedule.rotation_cycle_weeks",
        label: "Cycle de rotation des repos (semaines)",
        placeholder: "4",
        step: "1",
        min: 1,
        hint: "Toutes les X semaines, chaque livreur passe par tous les jours de repos possibles (équité).",
      },
    ],
  },

  // B. Repos
  {
    title: "Planning — Jours de repos",
    Icon: Moon,
    description:
      "Quotas de repos par livreur, autorisation weekend, et droit de modification par les livreurs.",
    fields: [
      {
        key: "schedule.weekday_rest_days_per_deliverer",
        label: "Jours de repos en semaine (lun-ven)",
        placeholder: "1",
        step: "1",
        min: 0,
        hint: "Nombre de jours OFF entre lundi et vendredi par livreur sur la période.",
      },
      {
        key: "schedule.weekend_rest_allowed",
        label: "Autoriser repos en weekend",
        placeholder: "0",
        step: "1",
        min: 0,
        max: 1,
        hint: "1 = oui (le sam/dim peut être un jour de repos), 0 = jamais (réservé aux jours forts).",
      },
      {
        key: "schedule.solo_deliverer_rest_day",
        label: "Jour de repos forcé (livreur seul)",
        placeholder: "sunday",
        type: "text",
        options: [
          { value: "monday", label: "Lundi" },
          { value: "tuesday", label: "Mardi" },
          { value: "wednesday", label: "Mercredi" },
          { value: "thursday", label: "Jeudi" },
          { value: "friday", label: "Vendredi" },
          { value: "saturday", label: "Samedi" },
          { value: "sunday", label: "Dimanche" },
        ],
        hint: "Si un seul livreur dans le restaurant, jour OFF imposé chaque semaine.",
      },
      {
        key: "schedule.allow_rest_day_override",
        label: "Le livreur peut modifier ses repos (mobile)",
        placeholder: "1",
        step: "1",
        min: 0,
        max: 1,
        hint: "1 = oui (toggle dans l'app), 0 = non (seuls les admins gèrent les repos).",
      },
    ],
  },

  // C. Créneaux
  {
    title: "Planning — Créneaux (shifts)",
    Icon: Clock,
    description:
      "Plages horaires des shifts matin/soir et nombre de slots de base avant volume.",
    fields: [
      {
        key: "schedule.shift_morning",
        label: "Shift du matin (HH:mm-HH:mm)",
        placeholder: "09:00-15:00",
        type: "text",
        hint: "Format strict 'HH:mm-HH:mm'. Snapshoté dans le plan au moment de la génération.",
      },
      {
        key: "schedule.shift_evening",
        label: "Shift du soir (HH:mm-HH:mm)",
        placeholder: "15:00-23:00",
        type: "text",
        hint: "Format strict 'HH:mm-HH:mm'.",
      },
      {
        key: "schedule.default_slots_morning",
        label: "Slots de base — Matin",
        placeholder: "3",
        step: "1",
        min: 1,
        hint: "Nombre de livreurs cibles le matin (en semaine). Sera multiplié par le multiplicateur volume.",
      },
      {
        key: "schedule.default_slots_evening",
        label: "Slots de base — Soir",
        placeholder: "3",
        step: "1",
        min: 1,
        hint: "Nombre de livreurs cibles le soir.",
      },
      {
        key: "schedule.enforce_slots",
        label: "Bloquer dépassement des slots",
        placeholder: "0",
        step: "1",
        min: 0,
        max: 1,
        hint: "1 = refuser les acceptations au-delà de max_slots, 0 = autoriser dépassement (souple).",
      },
    ],
  },

  // D. Volume
  {
    title: "Planning — Volume estimé",
    Icon: BarChart3,
    description:
      "Multiplicateurs appliqués aux slots selon le jour (semaine vs weekend).",
    fields: [
      {
        key: "schedule.weekday_volume_multiplier",
        label: "Multiplicateur volume — Semaine",
        placeholder: "1.0",
        step: "0.1",
        min: 0.1,
        hint: "1.0 = base. 0.8 = semaine plus calme, 1.2 = semaine plus chargée.",
      },
      {
        key: "schedule.weekend_volume_multiplier",
        label: "Multiplicateur volume — Weekend",
        placeholder: "1.5",
        step: "0.1",
        min: 0.1,
        hint: "1.5 = +50% de slots le sam/dim. Adapté au pic de commandes weekend.",
      },
    ],
  },

  // E. Workflow envoi
  {
    title: "Planning — Workflow d'envoi",
    Icon: Send,
    description:
      "Quand le planning est envoyé aux livreurs et combien de temps ils ont pour répondre.",
    fields: [
      {
        key: "schedule.acceptance_deadline_hours",
        label: "Délai de réponse livreur (heures)",
        placeholder: "48",
        step: "1",
        min: 1,
        hint: "Au-delà, les ASSIGNED restants passent CONFIRMED auto et le plan est figé.",
      },
      {
        key: "schedule.auto_send_day_of_week",
        label: "Jour d'envoi auto (0=dim, 5=ven)",
        placeholder: "5",
        step: "1",
        min: 0,
        max: 6,
        hint: "Vendredi par défaut pour que le plan soit reçu pour la semaine suivante.",
      },
      {
        key: "schedule.auto_send_hour",
        label: "Heure d'envoi auto",
        placeholder: "18",
        step: "1",
        min: 0,
        max: 23,
        hint: "Heure de la journée (0-23) à laquelle le cron auto-send se déclenche.",
      },
    ],
  },

  // F. Check-in matin
  {
    title: "Planning — Check-in matinal",
    Icon: Sunrise,
    description:
      "Push quotidien envoyé aux livreurs pour confirmer leur présence du jour.",
    fields: [
      {
        key: "schedule.daily_presence_check_hour",
        label: "Heure du check-in présence",
        placeholder: "8",
        step: "1",
        min: 0,
        max: 23,
        hint: "Heure du matin où le push 'Tu es opérationnel aujourd'hui ?' est envoyé. Sans réponse en 4 h, auto-CONFIRMED PRESENT.",
      },
    ],
  },
];

const DeliverySettings: React.FC = () => {
  // On fetch 2 prefixes : l'UI devait connaître tous les settings course.* + deliverer.*
  // pour précharger les valeurs déjà en base.
  const { data: courseSettings, isLoading: isLoadingCourse } = useSettingsQuery("course.");
  const { data: delivererSettings, isLoading: isLoadingDeliverer } =
    useSettingsQuery("deliverer.");
  const { data: scheduleSettings, isLoading: isLoadingSchedule } =
    useSettingsQuery("schedule.");
  const { mutate: updateSetting, isPending } = useSettingMutation();

  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const isLoading = isLoadingCourse || isLoadingDeliverer || isLoadingSchedule;

  // Liste plate des champs pour la boucle de save
  const allFields = useMemo(() => SECTIONS.flatMap((s) => s.fields), []);

  // Hydrate le state local à partir des settings chargés
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const s of courseSettings ?? []) map[s.key] = s.value;
    for (const s of delivererSettings ?? []) map[s.key] = s.value;
    for (const s of scheduleSettings ?? []) map[s.key] = s.value;
    setValues(map);
  }, [courseSettings, delivererSettings, scheduleSettings]);

  const handleSave = () => {
    // On ne sauve que les champs non-vides (un champ vide = garder le default backend)
    const dirty = allFields.filter(
      (f) => values[f.key] !== undefined && values[f.key] !== ""
    );
    if (dirty.length === 0) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    let remaining = dirty.length;
    for (const field of dirty) {
      updateSetting(
        { key: field.key, value: String(values[field.key]), description: field.label },
        {
          onSuccess: () => {
            remaining--;
            if (remaining <= 0) {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Paramètres de livraison</h3>
        <p className="text-sm text-gray-500">
          Contrôle la mécanique d&apos;affectation des courses, le regroupement de
          commandes, le scoring livreur, et la géolocalisation.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="border-t border-gray-100 pt-6 first:border-t-0 first:pt-0"
        >
          <div className="mb-4">
            <h4 className="text-base font-bold text-[#F17922] mb-1 flex items-center gap-2">
              {section.Icon && <section.Icon className="w-4 h-4" />}
              {section.title}
            </h4>
            <p className="text-xs text-gray-500">{section.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.label}
                </label>
                {field.options ? (
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all bg-white"
                    value={values[field.key] ?? field.placeholder}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  >
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type ?? "number"}
                    step={field.step ?? "1"}
                    min={field.min}
                    max={field.max}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                  />
                )}
                {field.hint && (
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} /> Enregistré
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-6 py-2.5 bg-[#F17922] text-white font-semibold rounded-xl hover:bg-[#e06816] transition-all disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
};

export default DeliverySettings;
