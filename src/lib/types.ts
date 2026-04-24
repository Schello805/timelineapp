export type TimelineEvent = {
  id: string;
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
  event_date: string;
  title: string;
  description: string;
  image_url?: string | null;
  video_url?: string | null;
  pdf_url?: string | null;
};
