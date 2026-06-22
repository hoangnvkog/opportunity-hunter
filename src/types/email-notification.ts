import type { Uuid } from "./database.types";

export type EmailStatus = "queued" | "sent" | "failed";

/**
 * Row type for email_notifications table
 */
export type EmailNotificationRow = {
  id: Uuid;
  user_id: Uuid;
  alert_id: Uuid;
  status: EmailStatus;
  attempts: number;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

/**
 * Insert type for creating email notifications
 */
export type EmailNotificationInsert = {
  id?: Uuid;
  user_id: Uuid;
  alert_id: Uuid;
  status?: EmailStatus;
  attempts?: number;
};

/**
 * User notification settings
 */
export type NotificationSettingsRow = {
  user_id: Uuid;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationSettingsUpdate = {
  email_enabled?: boolean;
};

/**
 * Alert details used for email rendering
 */
export type AlertEmailContext = {
  userEmail: string;
  userName: string | null;
  watchlistName: string;
  opportunityTitle: string;
  clusterName: string;
  score: number;
  severity: number;
  buyingIntent: number;
  opportunityUrl: string;
};
