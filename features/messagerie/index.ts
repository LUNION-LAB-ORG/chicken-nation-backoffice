// === Types ===
export * from './types/conversation.type';
export * from './types/ticket.type';

// === APIs ===
export { conversationAPI } from './apis/conversation.api';
export { ticketAPI } from './apis/ticket.api';

// === Schemas ===
export * from './schemas/conversation.schema';
export * from './schemas/ticket.schema';

// === Query Keys & Invalidation ===
export * from './queries/index.query';

// === Conversation Queries ===
export { useConversationListQuery, useConversationListInfiniteQuery, useStatsMessagesQuery } from './queries/conversation-list.query';
export { useMessageListQuery } from './queries/message-list.query';

// === Conversation Mutations ===
export { useEnvoyerMessageMutation } from './queries/message-envoyer.mutation';
export { useMarquerLuMutation } from './queries/message-marquer-lu.mutation';

// === Ticket Queries ===
export { useTicketListQuery, useTicketListInfiniteQuery, useTicketStatsQuery } from './queries/ticket-list.query';
export { useTicketDetailQuery } from './queries/ticket-detail.query';

// === Ticket Mutations ===
export { useMarquerLuTicketMutation } from './queries/ticket-marquer-lu.mutation';
export { useCreerTicketMutation, useEscaladerConversationMutation } from './queries/ticket-creer.mutation';
export {
  useModifierTicketMutation,
  useModifierStatutTicketMutation,
  useModifierPrioriteTicketMutation,
  useSupprimerTicketMutation,
  useAssignerTicketMutation,
  useEnvoyerMessageTicketMutation,
} from './queries/ticket-modifier.mutation';

// === Socket Sync Hooks ===
export { useMessagerieSocketSync } from './hooks/useMessagerieSocketSync';
export { useTicketSocketSync } from './hooks/useTicketSocketSync';
