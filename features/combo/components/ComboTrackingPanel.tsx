"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Users,
  Trophy,
  Dices,
  Loader2,
} from "lucide-react";
import {
  useComboParticipationsQuery,
  useComboWinnersQuery,
} from "../queries/combo.queries";
import { useDrawComboWinnersMutation } from "../queries/combo.mutations";
import { formatImageUrl } from "@/utils/imageHelpers";
import { ComboGame } from "../types/combo.types";
import {
  dateTimeFmt,
  describeSolution,
  resolveStatus,
  STATUS_BADGE,
  STATUS_LABEL,
} from "../utils/combo.utils";

interface ComboTrackingPanelProps {
  game: ComboGame;
  onBack: () => void;
  canManage: boolean;
}

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  tone?: string;
}> = ({ icon: Icon, label, value, tone = "text-[#F17922]" }) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E4E4E7] bg-white px-4 py-3">
    <div className={`shrink-0 ${tone}`}>
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <div className="text-xl font-bold text-[#18181B] leading-none">
        {value}
      </div>
      <div className="text-[12px] text-[#9796A1] mt-1">{label}</div>
    </div>
  </div>
);

const Avatar: React.FC<{ name: string | null; image?: string | null }> = ({
  name,
  image,
}) => {
  const initials =
    (name ?? "")
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={formatImageUrl(image)}
      alt=""
      className="w-8 h-8 rounded-full object-cover shrink-0"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-[#FFF6E9] text-[#F17922] text-[11px] font-bold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
};

const ClientCell: React.FC<{
  name: string | null;
  image?: string | null;
}> = ({ name, image }) => (
  <div className="flex items-center gap-2.5">
    <Avatar name={name} image={image} />
    <span className="font-medium truncate">{name || "Client"}</span>
  </div>
);

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <th
    className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9796A1] ${className}`}
  >
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <td className={`px-4 py-3 text-sm text-[#18181B] ${className}`}>{children}</td>
);

export default function ComboTrackingPanel({
  game,
  onBack,
  canManage,
}: ComboTrackingPanelProps) {
  const { data: participations, isLoading: loadingP } =
    useComboParticipationsQuery(game.id);
  const { data: winners, isLoading: loadingW } = useComboWinnersQuery(game.id);
  const drawMut = useDrawComboWinnersMutation();

  const status = resolveStatus(game);
  const correct = (participations ?? []).filter((p) => p.is_correct);
  const participantsCount =
    game.stats?.participants_count ?? participations?.length ?? 0;
  const correctCount = game.stats?.correct_count ?? correct.length;
  const winnersCount = winners?.length ?? game.stats?.winners_count ?? 0;

  // Le tirage est SINGLE-SHOT : il ne doit être déclenché QUE lorsque la
  // fenêtre de jeu est terminée (statut ENDED). Tirer pendant que le jeu est
  // encore ACTIVE (starts_at passé mais ends_at non atteint) figerait la
  // loterie sur des réponses partielles.
  const canDraw =
    canManage &&
    !game.winners_drawn &&
    correctCount > 0 &&
    status === "ENDED";

  // Le jeu est en cours : on affiche un bouton désactivé + un hint tant que la
  // fenêtre n'est pas fermée.
  const drawPendingWindow =
    canManage && !game.winners_drawn && status === "ACTIVE";

  const handleDraw = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Tirer au sort ${game.winners_count} gagnant(s) parmi ${correctCount} bonne(s) réponse(s) ? Cette action est définitive.`
      )
    )
      return;
    drawMut.mutate(game.id);
  };

  return (
    <motion.div
      key="combo-tracking"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Retour à la liste, lien clair EN HAUT, pas collé au titre */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#71717A] hover:text-[#18181B] cursor-pointer"
      >
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-[#595959]">
              {game.title}
            </h2>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
          <p className="text-[13px] text-[#9796A1] mt-0.5">
            Solution : {describeSolution(game.solution_items)}
          </p>
          <p className="text-[12px] text-[#9796A1]">
            {dateTimeFmt(game.starts_at)} → {dateTimeFmt(game.ends_at)}
          </p>
        </div>

        {canDraw && (
          <motion.button
            onClick={handleDraw}
            disabled={drawMut.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {drawMut.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Dices size={16} />
            )}
            Tirer {game.winners_count} gagnant(s)
          </motion.button>
        )}
        {drawPendingWindow && (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              disabled
              title="Le tirage sera disponible une fois la fenêtre de jeu terminée."
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EEEBF5] text-[#9B8FBF] rounded-xl cursor-not-allowed"
            >
              <Dices size={16} />
              Tirage indisponible
            </button>
            <span className="text-[11px] text-[#9796A1]">
              Attendre la fermeture de la fenêtre
            </span>
          </div>
        )}
        {game.winners_drawn && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#7C3AED] bg-[#F3E8FF] px-3 py-2 rounded-lg">
            <Trophy size={15} /> Tirage déjà effectué
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Participants"
          value={participantsCount}
        />
        <StatCard
          icon={CheckCircle2}
          label="Bonnes réponses (pool du tirage)"
          value={correctCount}
          tone="text-[#1E8E5A]"
        />
        <StatCard
          icon={Trophy}
          label="Gagnants tirés"
          value={winnersCount}
          tone="text-[#7C3AED]"
        />
      </div>

      {/* Gagnants tirés */}
      <div>
        <h3 className="text-sm font-semibold text-[#595959] mb-2 flex items-center gap-1.5">
          <Trophy size={15} className="text-[#7C3AED]" /> Gagnants tirés au sort
        </h3>
        <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead className="bg-[#FAFAFA] border-b border-[#F1F3F5]">
                <tr>
                  <Th>Client</Th>
                  <Th>Téléphone</Th>
                  <Th>Lot (Reward)</Th>
                  <Th>Tiré le</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {loadingW ? (
                  <tr>
                    <Td className="text-[#9796A1]">Chargement…</Td>
                    <Td> </Td>
                    <Td> </Td>
                    <Td> </Td>
                  </tr>
                ) : !winners || winners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-[#9796A1]"
                    >
                      Aucun gagnant tiré pour l&apos;instant.
                    </td>
                  </tr>
                ) : (
                  winners.map((w) => (
                    <tr key={w.id} className="hover:bg-[#FBF7FF]">
                      <Td>
                        <ClientCell name={w.customer_name} image={w.customer_image} />
                      </Td>
                      <Td className="text-[#71717A]">
                        {w.customer_phone || "—"}
                      </Td>
                      <Td className="text-[#71717A]">
                        {w.reward_id ? (
                          <span className="text-[12px] font-mono">
                            {w.reward_id.slice(0, 8)}…
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="text-[#71717A]">
                        {dateTimeFmt(w.drawn_at)}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Participations */}
      <div>
        <h3 className="text-sm font-semibold text-[#595959] mb-2 flex items-center gap-1.5">
          <Users size={15} className="text-[#71717A]" /> Participations
        </h3>
        <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="bg-[#FAFAFA] border-b border-[#F1F3F5]">
                <tr>
                  <Th>Client</Th>
                  <Th>Téléphone</Th>
                  <Th className="text-right">Essais</Th>
                  <Th>Résultat</Th>
                  <Th>Bonne réponse le</Th>
                  <Th>Dernier essai</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {loadingP ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-[#9796A1]"
                    >
                      Chargement…
                    </td>
                  </tr>
                ) : !participations || participations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-[#9796A1]"
                    >
                      Aucune participation pour l&apos;instant.
                    </td>
                  </tr>
                ) : (
                  participations.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FFF9F2]">
                      <Td>
                        <ClientCell name={p.customer_name} image={p.customer_image} />
                      </Td>
                      <Td className="text-[#71717A]">
                        {p.customer_phone || "—"}
                      </Td>
                      <Td className="text-right">
                        {p.attempts_used}
                        <span className="text-[#9796A1]">
                          {" "}
                          / {game.max_attempts}
                        </span>
                      </Td>
                      <Td>
                        {p.is_correct ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F4EC] text-[#1E8E5A]">
                            <CheckCircle2 size={12} /> Bonne réponse
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF1F4] text-[#6C757D]">
                            En cours / échec
                          </span>
                        )}
                      </Td>
                      <Td className="text-[#71717A]">
                        {dateTimeFmt(p.answered_at)}
                      </Td>
                      <Td className="text-[#71717A]">
                        {dateTimeFmt(p.last_attempt_at)}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
