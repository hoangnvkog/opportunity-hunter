import { EmailNotificationsRepository, NotificationSettingsRepository } from "@/lib/db/repositories/email-notifications.repository";
import { AlertsRepository } from "@/lib/db/repositories/alerts.repository";
import { sendEmail } from "@/lib/email/resend.provider";
import { renderAlertEmailHtml, renderAlertEmailText } from "@/lib/email/templates/alert-email";
import type { Uuid } from "@/types";

const MAX_ATTEMPTS = 3;

const EMAIL_SUBJECT_PREFIX = "[Opportunity Hunter] New match in";

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

/**
 * Email service — orchestrates the queue → send → mark workflow.
 */
export class EmailService {
  constructor(
    private emailRepo: EmailNotificationsRepository,
    private settingsRepo: NotificationSettingsRepository,
    private alertsRepo: AlertsRepository,
  ) {}

  static async create(): Promise<EmailService> {
    const emailRepo = await EmailNotificationsRepository.create();
    const settingsRepo = await NotificationSettingsRepository.create();
    const alertsRepo = await AlertsRepository.create();
    return new EmailService(emailRepo, settingsRepo, alertsRepo);
  }

  /**
   * Queue an email notification for an alert.
   * No-ops if the user has email notifications disabled.
   */
  async queueAlertEmail(userId: Uuid, alertId: Uuid): Promise<Uuid | null> {
    const settings = await this.settingsRepo.getOrCreate(userId);
    if (!settings?.email_enabled) {
      return null;
    }

    const notification = await this.emailRepo.create({ user_id: userId, alert_id: alertId });
    return notification.id;
  }

  /**
   * Send a single pending email notification.
   * Returns true if the send was successful.
   */
  async sendAlertEmail(notificationId: Uuid): Promise<boolean> {
    // Fetch the notification via the alerts join so we can render a useful email
    const users = await this.resolveNotification(notificationId);
    if (!users) return false;

    const { emailContext } = users;
    const result = await sendEmail({
      to: emailContext.userEmail,
      subject: `${EMAIL_SUBJECT_PREFIX} ${emailContext.watchlistName}`,
      html: renderAlertEmailHtml(emailContext),
      text: renderAlertEmailText(emailContext),
    });

    await this.emailRepo.incrementAttempts(notificationId);

    if (result.success) {
      await this.emailRepo.markSent(notificationId);
      return true;
    }

    await this.emailRepo.markFailed(notificationId, result.error ?? "Unknown error");
    return false;
  }

  /**
   * Process all queued notifications within the retry budget.
   */
  async sendPendingEmails(): Promise<{ sent: number; failed: number; retried: number }> {
    const pending = await this.emailRepo.listPending(50);

    let sent = 0;
    let failed = 0;
    let retried = 0;

    for (const notification of pending) {
      const currentAttempts = notification.attempts ?? 0;
      if (currentAttempts >= MAX_ATTEMPTS) {
        // Already exhausted retries — leave as-is
        continue;
      }

      const ok = await this.sendAlertEmail(notification.id);
      if (ok) {
        sent++;
        continue;
      }

      const updatedNotification = await this.emailRepo.findByAlert(notification.user_id, notification.alert_id);
      const attemptsAfter = updatedNotification?.attempts ?? currentAttempts + 1;

      if (attemptsAfter < MAX_ATTEMPTS) {
        await this.emailRepo.requeue(notification.id);
        retried++;
      }
      failed++;
    }

    return { sent, failed, retried };
  }

  /**
   * Look up the alert context for a queued notification so we can render the email.
   * Returns null if the alert/user pair has gone missing.
   */
  private async resolveNotification(notificationId: Uuid): Promise<{ emailContext: import("@/types/email-notification").AlertEmailContext } | null> {
    // Fetch the notification directly
    const { data: notification, error } = await this.emailRepo["client"]
      .from("email_notifications")
      .select("*")
      .eq("id", notificationId)
      .maybeSingle();

    if (error || !notification) return null;

    // Fetch the alert + opportunity + user details
    const { data: alertData, error: alertError } = await this.alertsRepo["client"]
      .from("alerts")
      .select(
        `
        id,
        user_id,
        watchlist:watchlists(name),
        opportunity:opportunities(
          id,
          title,
          score,
          severity,
          buying_intent,
          cluster:pain_clusters(name)
        )
      `,
      )
      .eq("id", notification.alert_id)
      .maybeSingle();

    if (alertError || !alertData) return null;

    // Fetch the user's email from auth (via profiles table for safety)
    const { data: profile, error: profileError } = await this.emailRepo["client"]
      .from("profiles")
      .select("email, name")
      .eq("id", notification.user_id)
      .maybeSingle();

    if (profileError || !profile) return null;

    const opportunity = alertData.opportunity as unknown as {
      id: string;
      title: string;
      score: string | number;
      severity: string | number;
      buying_intent: string | number;
      cluster: { name: string } | null;
    } | null;
    const watchlist = alertData.watchlist as unknown as { name: string } | null;

    if (!opportunity || !watchlist) return null;

    const opportunityId = opportunity.id;
    const opportunityUrl = `${getBaseUrl()}/opportunities/${opportunityId}`;

    return {
      emailContext: {
        userEmail: profile.email,
        userName: profile.name ?? null,
        watchlistName: watchlist.name,
        opportunityTitle: opportunity.title,
        clusterName: opportunity.cluster?.name ?? "Unknown",
        score: parseScore(opportunity.score),
        severity: parseScore(opportunity.severity),
        buyingIntent: parseScore(opportunity.buying_intent),
        opportunityUrl,
      },
    };
  }
}

function parseScore(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
