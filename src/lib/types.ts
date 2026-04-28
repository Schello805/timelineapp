export type TimelineEvent = {
  id: string;
  slug: string;
  event_date: string;
  title: string;
  description: string;
  importance?: "standard" | "important" | "milestone";
  image_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  pdf_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TimelineEventInput = {
  slug?: string | null;
  event_date: string;
  title: string;
  description: string;
  importance?: "standard" | "important" | "milestone";
  image_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  pdf_url?: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  is_primary: number;
  created_at?: string;
  updated_at?: string;
};

export type AnnualMetric = {
  id: string;
  year: string;
  label: string;
  value: number;
  unit: string | null;
  comparison_label: string | null;
  comparison_value: number | null;
  comparison_unit: string | null;
  description: string | null;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};
