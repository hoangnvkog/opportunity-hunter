import type { AlertEmailContext } from "@/types/email-notification";

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function escapeHtml(value: string): string {
  const amp = String.fromCharCode(38) + "amp;";
  const lt = String.fromCharCode(60);
  const gt = String.fromCharCode(62);
  const quot = String.fromCharCode(34);
  const apos = String.fromCharCode(39);
  return value
    .replace(/&(?!#|amp;)/g, amp)
    .replace(/</g, lt)
    .replace(/>/g, gt)
    .replace(/"/g, quot + ";")
    .replace(/'/g, apos + ";");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

export function renderAlertEmailHtml(context: AlertEmailContext): string {
  const parts: string[] = [];
  parts.push("<!DOCTYPE html>");
  parts.push("<html lang=\"en\"><head><meta charset=\"UTF-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><title>New opportunity in " + escapeHtml(context.watchlistName) + "</title></head>");
  parts.push("<body style=\"margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#111827;\">");
  parts.push("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#f9fafb;padding:24px 0;\"><tr><td align=\"center\">");
  parts.push("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"600\" style=\"background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;\"><tr><td style=\"padding:32px 32px 16px 32px;\">");
  parts.push("<h1 style=\"margin:0 0 8px 0;font-size:20px;font-weight:600;color:#111827;\">New opportunity in " + escapeHtml(context.watchlistName) + "</h1>");
  parts.push("<p style=\"margin:0;color:#6b7280;font-size:14px;\">");
  parts.push(context.userName ? "Hi " + escapeHtml(context.userName) + "," : "Hi there,");
  parts.push(" a new opportunity just matched your watchlist.</p></td></tr>");
  parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #e5e7eb;border-radius:6px;\"><tr><td style=\"padding:20px;\">");
  parts.push("<h2 style=\"margin:0 0 12px 0;font-size:18px;font-weight:600;color:#111827;\">" + escapeHtml(context.opportunityTitle) + "</h2>");
  parts.push("<p style=\"margin:0 0 16px 0;color:#6b7280;font-size:13px;\">Cluster: <strong style=\"color:#374151;\">" + escapeHtml(context.clusterName) + "</strong></p>");
  parts.push("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\">");
  const metrics: Array<[string, number]> = [
    ["Score", context.score],
    ["Severity", context.severity],
    ["Buying Intent", context.buyingIntent],
  ];
  for (const [label, value] of metrics) {
    parts.push("<tr><td style=\"padding:8px 0;font-size:13px;color:#6b7280;\">" + escapeHtml(label) + "</td><td align=\"right\" style=\"padding:8px 0;font-size:13px;font-weight:600;color:#111827;\">" + escapeHtml(formatNumber(value)) + "</td></tr>");
  }
  parts.push("</table></td></tr></table></td></tr>");
  parts.push("<tr><td style=\"padding:0 32px 32px 32px;\" align=\"center\"><a href=\"" + escapeAttr(context.opportunityUrl) + "\" style=\"display:inline-block;background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;\">View Opportunity</a></td></tr>");
  parts.push("<tr><td style=\"padding:16px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;\">You received this email because your watchlist " + escapeHtml(context.watchlistName) + " matched a new opportunity. Update notification settings in your account.</td></tr>");
  parts.push("</table></td></tr></table></body></html>");
  return parts.join("");
}

export function renderAlertEmailText(context: AlertEmailContext): string {
  const greeting = context.userName ? `Hi ${context.userName},` : "Hi there,";
  return [
    greeting,
    "",
    `A new opportunity just matched your watchlist "${context.watchlistName}".`,
    "",
    `Title: ${context.opportunityTitle}`,
    `Cluster: ${context.clusterName}`,
    `Score: ${formatNumber(context.score)}`,
    `Severity: ${formatNumber(context.severity)}`,
    `Buying Intent: ${formatNumber(context.buyingIntent)}`,
    "",
    `View: ${context.opportunityUrl}`,
  ].join("\n");
}
