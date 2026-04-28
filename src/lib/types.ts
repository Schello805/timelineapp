export type TimelineEvent = {
  id: string;
  slug: string;
  event_date: string;
  title: string;
  description: string;
  image_url: string | null;
  video_url: string | null;
  pdf_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TimelineEventInput = {
  slug?: string | null;
  event_date: string;
  title: string;
  description: string;
  image_url?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  is_primary: number;
  created_at?: string;
  updated_at?: string;
};
