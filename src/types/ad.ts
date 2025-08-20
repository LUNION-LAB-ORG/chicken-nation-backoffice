export interface Ad {
  id?: string;
  title: string;
  content: string;
  image?: string | null;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  status?: 'draft' | 'published' | 'scheduled';
  type?: 'social' | 'app' | 'email';
  authorId?: string;
  authorName?: string;
  stats?: {
    sentTo: number;
    readBy: number;
  };
}
