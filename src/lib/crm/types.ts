export type LeadSegment =
  | 'BIOLOGY_INTEREST'
  | 'CEE_COURSE_INTEREST'
  | 'HIGH_INTENT'
  | 'PAYMENT_ABANDONED'
  | 'ACTIVE_LEAD'
  | 'COLD_LEAD'
  | 'PURCHASED'
  | 'INACTIVE';

export type LeadScoreTier = 'Cold' | 'Warm' | 'Hot' | 'High Intent';

export type LeadStatus = 'new' | 'nurturing' | 'high_intent' | 'customer' | 'unsubscribed' | 'bounced';

export interface LeadRecord {
  id: string;
  email: string;
  first_name: string;
  phone?: string | null;
  academic_level?: string | null;
  prep_status?: string | null;
  score: number;
  segment: LeadSegment;
  status: LeadStatus;
  lead_magnet: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  device?: string | null;
  browser?: string | null;
  consent: boolean;
  unsubscribed_at?: string | null;
  created_at: string;
  updated_at: string;
  last_active_at: string;
  user_id?: string | null;
  total_revenue?: number;
}

export interface LeadEvent {
  id: string;
  lead_id?: string | null;
  anonymous_id?: string | null;
  event_type: string;
  metadata?: Record<string, any> | null;
  url?: string | null;
  created_at: string;
}

export interface EmailQueueItem {
  id: string;
  lead_id: string;
  email: string;
  template_id: string;
  subject: string;
  scheduled_at: string;
  sent_at?: string | null;
  status: 'pending' | 'sent' | 'cancelled' | 'failed' | 'skipped';
  failure_reason?: string | null;
  created_at: string;
}

export interface EmailLogItem {
  id: string;
  lead_id: string;
  email: string;
  template_id: string;
  subject: string;
  sent_at: string;
  opened_at?: string | null;
  clicked_at?: string | null;
  status: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
}

export interface LeadTimelineEvent {
  timestamp: string;
  title: string;
  description: string;
  type: 'lead_capture' | 'page_view' | 'pdf_download' | 'email_sent' | 'checkout' | 'payment' | 'login';
  icon?: string;
  metadata?: Record<string, any>;
}
