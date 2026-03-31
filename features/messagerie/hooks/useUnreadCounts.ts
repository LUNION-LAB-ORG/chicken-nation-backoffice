import { useStatsMessagesQuery } from '../queries/conversation-list.query';
import { useTicketStatsQuery } from '../queries/ticket-list.query';

export interface UnreadCounts {
  conversations: number;
  tickets: number;
  total: number;
}

export const useUnreadCounts = (): UnreadCounts => {
  const { data: msgStats } = useStatsMessagesQuery();
  const { data: ticketStats } = useTicketStatsQuery();

  const conversations = msgStats?.unread_conversations ?? 0;
  const tickets = ticketStats?.open ?? 0;
  const total = conversations + tickets;

  return { conversations, tickets, total };
};
