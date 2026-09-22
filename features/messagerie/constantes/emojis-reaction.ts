/**
 * Les emojis de réaction, dans l'ordre où le sélecteur les propose.
 *
 * ⚠️ Cette liste DOIT rester identique à celle du serveur
 * (`backend/src/common/constantes/emojis-reaction.ts`), qui refuse tout ce qui
 * n'y figure pas. Elle n'est pas fermée pour la modération mais pour le
 * comptage : « ❤️ » et « ❤ » sont deux chaînes différentes pour un seul cœur,
 * et deux pastilles apparaîtraient côte à côte pour la même intention.
 */
export const EMOJIS_REACTION = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;
