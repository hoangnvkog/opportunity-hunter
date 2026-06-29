import type { WeeklyDigestEmailContext, WeeklyDigestStats } from "@/types/weekly-digest";

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function formatInt(value: number): string {
  return Number.isFinite(value) ? Math.round(value).toString() : "0";
}

function escapeHtml(value: string): string {
  // Build entity strings via char codes so the author can sanity check that
  // no literal angle/quote characters sneak back into the source.
  const amp = String.fromCharCode(38) + "amp;";
  const entlt = String.fromCharCode(38) + "lt;";
  const entgt = String.fromCharCode(38) + "gt;";
  const entquot = String.fromCharCode(38) + "quot;";
  const entapos = String.fromCharCode(38) + "#39;";
  return value
    .replace(/&(?!#|amp;|lt;|gt;|quot;|#39;)/g, amp)
    .replace(/</g, entlt)
    .replace(/>/g, entgt)
    .replace(/"/g, entquot)
    .replace(/'/g, entapos);
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function formatDateRange(stats: WeeklyDigestStats): string {
  const start = new Date(stats.week_start).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const end = new Date(stats.week_end).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

function recommendations(stats: WeeklyDigestStats): string[] {
  const out: string[] = [];
  if (stats.alerts_count === 0) {
    out.push("No new watchlist matches this week — consider adding another watchlist to broaden coverage.");
  }
  if (stats.opportunities_count === 0) {
    out.push("No new opportunities were generated this week. The pipeline may be idling on undervalued subreddits.");
  }
  if (stats.highest_score >= 70) {
    out.push(`A standout opportunity surfaced (score ${formatNumber(stats.highest_score)}) — review it before it cools off.`);
  }
  if (stats.highest_buying_intent >= 0.7) {
    out.push(`Buying-intent signal spiked (${formatNumber(stats.highest_buying_intent)}) — focus cluster analysis here.`);
  }
  if (stats.top_clusters.length >= 2) {
    out.push("Multiple clusters matured simultaneously — pick the moat-rich one and validate fast.");
  }
  if (out.length === 0) {
    out.push("Keep iterating: the next 7 days will likely surface stronger signals.");
  }
  return out;
}

export function renderWeeklyDigestHtml(context: WeeklyDigestEmailContext): string {
  const { stats } = context;
  const dateRange = formatDateRange(stats);
  const greeting = context.userName ? `Hi ${escapeHtml(context.userName)},` : "Hi there,";
  const recs = recommendations(stats);

  const parts: string[] = [];
  parts.push("<!DOCTYPE html>");
  parts.push(`<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Weekly Opportunity Digest — ${escapeHtml(dateRange)}</title></head>`);
  parts.push("<body style=\"margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#111827;\">");
  parts.push("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#f9fafb;padding:24px 0;\"><tr><td align=\"center\">");
  parts.push("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"600\" style=\"background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;\"><tr><td style=\"padding:32px 32px 16px 32px;\">");
  parts.push(`<h1 style="margin:0 0 8px 0;font-size:20px;font-weight:600;color:#111827;">Weekly Opportunity Digest</h1>`);
  parts.push(`<p style="margin:0;color:#6b7280;font-size:14px;">${greeting} Here's what your hunters found between <strong style="color:#374151;">${escapeHtml(dateRange)}</strong>.</p>`);
  parts.push("</td></tr>");

  // Summary metrics
  parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #e5e7eb;border-radius:6px;\"><tr><td style=\"padding:20px;\">");
  parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#111827;\">Summary</h2>");
  parts.push("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\">");
  const summaryRows: Array<[string, string]> = [
    ["Alerts matched", formatInt(stats.alerts_count)],
    ["Active watchlists", formatInt(stats.watchlists_count)],
    ["New opportunities", formatInt(stats.opportunities_count)],
    ["Average score", formatNumber(stats.average_score)],
    ["Highest score", formatNumber(stats.highest_score)],
    ["Peak buying intent", formatNumber(stats.highest_buying_intent)],
  ];
  for (const [label, value] of summaryRows) {
    parts.push(`<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;">${escapeHtml(label)}</td><td align="right" style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${escapeHtml(value)}</td></tr>`);
  }
  parts.push("</table></td></tr></table></td></tr>");

  // AI insight summary (Sprint 46)
  if (stats.ai_summary) {
    parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #ddd6fe;border-radius:6px;background-color:#f5f3ff;\"><tr><td style=\"padding:20px;\">");
    parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#6d28d9;\">AI insight summary</h2>");
    parts.push(`<p style=\"margin:0;font-size:13px;line-height:1.6;color:#1f2937;\">${escapeHtml(stats.ai_summary)}</p>`);
    parts.push("</td></tr></table></td></tr>");
  }

  if (stats.top_recommendation) {
    const rec = stats.top_recommendation;
    parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #ddd6fe;border-radius:6px;background-color:#f5f3ff;\"><tr><td style=\"padding:20px;\">");
    parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#6d28d9;\">Top AI recommendation</h2>");
    parts.push(`<a href=\"${escapeAttr(rec.url)}\" style=\"color:#6d28d9;font-weight:600;font-size:14px;text-decoration:none;\">${escapeHtml(rec.title)}</a>`);
    parts.push(`<div style=\"font-size:12px;color:#6b7280;margin-top:2px;\">Confidence ${Math.round(rec.confidence_score * 100)}%</div>`);
    parts.push(`<p style=\"margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#1f2937;\">${escapeHtml(rec.summary)}</p>`);
    parts.push("</td></tr></table></td></tr>");
  }

  // Top clusters
  if (stats.top_clusters.length > 0) {
    parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #e5e7eb;border-radius:6px;\"><tr><td style=\"padding:20px;\">");
    parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#111827;\">Top clusters</h2>");
    parts.push("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\">");
    for (const cluster of stats.top_clusters) {
      parts.push(`<tr><td style="padding:6px 0;font-size:13px;color:#374151;">${escapeHtml(cluster.name)}</td><td align="right" style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${formatInt(cluster.count)}</td></tr>`);
    }
    parts.push("</table></td></tr></table></td></tr>");
  }

  // Top opportunities
  if (stats.top_opportunities.length > 0) {
    parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #e5e7eb;border-radius:6px;\"><tr><td style=\"padding:20px;\">");
    parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#111827;\">Top opportunities</h2>");
    for (const opp of stats.top_opportunities) {
      parts.push("<div style=\"padding:10px 0;border-bottom:1px solid #f3f4f6;\">");
      parts.push(`<a href="${escapeAttr(opp.url)}" style="color:#111827;font-weight:600;font-size:14px;text-decoration:none;">${escapeHtml(opp.title)}</a>`);
      parts.push(`<div style="font-size:12px;color:#6b7280;margin-top:2px;">${escapeHtml(opp.cluster_name)} · score ${escapeHtml(formatNumber(opp.score))}</div>`);
      parts.push("</div>");
    }
    parts.push("</td></tr></table></td></tr>");
  }

  // Top forecasted opportunities (Sprint 54)
  if (stats.top_forecasts.length > 0) {
    parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #dbeafe;border-radius:6px;background-color:#eff6ff;\"><tr><td style=\"padding:20px;\">");
    parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#1d4ed8;\">\uD83D\uDE80 Top forecasted opportunities</h2>");
    for (const fc of stats.top_forecasts) {
      parts.push("<div style=\"padding:10px 0;border-bottom:1px solid #dbeafe;\">");
      parts.push(`<a href="${escapeAttr(fc.url)}" style="color:#1d4ed8;font-weight:600;font-size:14px;text-decoration:none;">${escapeHtml(fc.title)}</a>`);
      parts.push(`<div style="font-size:12px;color:#6b7280;margin-top:2px;">Forecast ${escapeHtml(formatNumber(fc.forecast_score))} · growth ${escapeHtml(formatNumber(fc.growth_probability))}% · momentum ${escapeHtml(formatNumber(fc.momentum))}</div>`);
      parts.push("</div>");
    }
    parts.push("</td></tr></table></td></tr>");
  }

  // Top market signals (Sprint 55)
  if (stats.top_market_signals.length > 0) {
    parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #fed7aa;border-radius:6px;background-color:#fff7ed;\"><tr><td style=\"padding:20px;\">");
    parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#c2410c;\">\uD83D\uDD25 Top market signals</h2>");
    for (const sig of stats.top_market_signals) {
      parts.push("<div style=\"padding:10px 0;border-bottom:1px solid #fed7aa;\">");
      parts.push(`<a href="${escapeAttr(sig.url)}" style="color:#c2410c;font-weight:600;font-size:14px;text-decoration:none;">${escapeHtml(sig.title)}</a>`);
      parts.push(`<div style="font-size:12px;color:#6b7280;margin-top:2px;">Overall ${escapeHtml(formatNumber(sig.overall_score))} \u00b7 confidence ${escapeHtml(formatNumber(sig.confidence))}%</div>`);
      parts.push(`<div style="font-size:11px;color:#9ca3af;margin-top:2px;">Reddit ${escapeHtml(formatNumber(sig.reddit_score))} \u00b7 GitHub ${escapeHtml(formatNumber(sig.github_score))} \u00b7 PH ${escapeHtml(formatNumber(sig.product_hunt_score))} \u00b7 News ${escapeHtml(formatNumber(sig.news_score))} \u00b7 Trends ${escapeHtml(formatNumber(sig.google_trends_score))} \u00b7 Jobs ${escapeHtml(formatNumber(sig.jobs_score))}</div>`);
      parts.push("</div>");
    }
    parts.push("</td></tr></table></td></tr>");
  }

  // Top investment grades (Sprint 56)
  if (stats.top_investment_grades.length > 0) {
    parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #fde68a;border-radius:6px;background-color:#fffbeb;\"><tr><td style=\"padding:20px;\">");
    parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#92400e;\">\u2B50 Top investment grades</h2>");
    for (const ig of stats.top_investment_grades) {
      parts.push("<div style=\"padding:10px 0;border-bottom:1px solid #fde68a;\">");
      parts.push(`<a href="${escapeAttr(ig.url)}" style="color:#92400e;font-weight:600;font-size:14px;text-decoration:none;">${escapeHtml(ig.title)}</a>`);
      parts.push(`<div style="font-size:12px;color:#6b7280;margin-top:2px;">Overall ${escapeHtml(formatNumber(ig.overall_score))} \u00b7 ${escapeHtml(ig.recommendation)}</div>`);
      parts.push(`<div style="font-size:11px;color:#9ca3af;margin-top:2px;">TAM ${escapeHtml(formatNumber(ig.tam_score))} \u00b7 Timing ${escapeHtml(formatNumber(ig.market_timing_score))} \u00b7 Competition ${escapeHtml(formatNumber(ig.competition_score))} \u00b7 Moat ${escapeHtml(formatNumber(ig.moat_score))} \u00b7 Distribution ${escapeHtml(formatNumber(ig.distribution_score))} \u00b7 Execution ${escapeHtml(formatNumber(ig.execution_score))} \u00b7 Capital ${escapeHtml(formatNumber(ig.capital_efficiency_score))}</div>`);
      parts.push("</div>");
    }
    parts.push("</td></tr></table></td></tr>");
  }

  // Recommendations
  parts.push("<tr><td style=\"padding:0 32px 24px 32px;\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"border:1px solid #e5e7eb;border-radius:6px;\"><tr><td style=\"padding:20px;\">");
  parts.push("<h2 style=\"margin:0 0 12px 0;font-size:16px;font-weight:600;color:#111827;\">Recommendations</h2>");
  parts.push("<ul style=\"margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:1.6;\">");
  for (const line of recs) {
    parts.push(`<li>${escapeHtml(line)}</li>`);
  }
  parts.push("</ul></td></tr></table></td></tr>");

  // CTA
  parts.push(`<tr><td style="padding:0 32px 32px 32px;" align="center"><a href="${escapeAttr(context.historyUrl)}" style="display:inline-block;background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;">View digest history</a></td></tr>`);

  // Footer
  parts.push(`<tr><td style="padding:16px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">Weekly digest for ${escapeHtml(dateRange)}. <a href="${escapeAttr(context.settingsUrl)}" style="color:#9ca3af;">Manage settings</a> · <a href="${escapeAttr(context.unsubscribeUrl)}" style="color:#9ca3af;">Unsubscribe from weekly digest</a></td></tr>`);
  parts.push("</table></td></tr></table></body></html>");
  return parts.join("");
}

export function renderWeeklyDigestText(context: WeeklyDigestEmailContext): string {
  const { stats } = context;
  const dateRange = formatDateRange(stats);
  const greeting = context.userName ? `Hi ${context.userName},` : "Hi there,";
  const recs = recommendations(stats);

  const lines: string[] = [];
  lines.push(greeting);
  lines.push("");
  lines.push(`Weekly Opportunity Digest — ${dateRange}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(`  Alerts matched:     ${formatInt(stats.alerts_count)}`);
  lines.push(`  Active watchlists:  ${formatInt(stats.watchlists_count)}`);
  lines.push(`  New opportunities:  ${formatInt(stats.opportunities_count)}`);
  lines.push(`  Average score:      ${formatNumber(stats.average_score)}`);
  lines.push(`  Highest score:      ${formatNumber(stats.highest_score)}`);
  lines.push(`  Peak buying intent: ${formatNumber(stats.highest_buying_intent)}`);

  if (stats.ai_summary) {
    lines.push("");
    lines.push("AI INSIGHT SUMMARY");
    lines.push(`  ${stats.ai_summary}`);
  }

  if (stats.top_recommendation) {
    const rec = stats.top_recommendation;
    lines.push("");
    lines.push("TOP AI RECOMMENDATION");
    lines.push(`  ${rec.title}`);
    lines.push(`    Confidence ${Math.round(rec.confidence_score * 100)}%`);
    lines.push(`    ${rec.summary}`);
    lines.push(`    ${rec.url}`);
  }

  if (stats.top_clusters.length > 0) {
    lines.push("");
    lines.push("TOP CLUSTERS");
    for (const cluster of stats.top_clusters) {
      lines.push(`  - ${cluster.name} (${cluster.count})`);
    }
  }

  if (stats.top_opportunities.length > 0) {
    lines.push("");
    lines.push("TOP OPPORTUNITIES");
    for (const opp of stats.top_opportunities) {
      lines.push(`  - ${opp.title}`);
      lines.push(`    ${opp.cluster_name} · score ${formatNumber(opp.score)}`);
      lines.push(`    ${opp.url}`);
    }
  }

  if (stats.top_forecasts.length > 0) {
    lines.push("");
    lines.push("TOP FORECASTED OPPORTUNITIES");
    for (const fc of stats.top_forecasts) {
      lines.push(`  - ${fc.title}`);
      lines.push(`    forecast ${formatNumber(fc.forecast_score)} · growth ${formatNumber(fc.growth_probability)}% · momentum ${formatNumber(fc.momentum)}`);
      lines.push(`    ${fc.url}`);
    }
  }

  if (stats.top_market_signals.length > 0) {
    lines.push("");
    lines.push("TOP MARKET SIGNALS");
    for (const sig of stats.top_market_signals) {
      lines.push(`  - ${sig.title}`);
      lines.push(`    overall ${formatNumber(sig.overall_score)} · confidence ${formatNumber(sig.confidence)}%`);
      lines.push(`    reddit ${formatNumber(sig.reddit_score)} · github ${formatNumber(sig.github_score)} · producthunt ${formatNumber(sig.product_hunt_score)} · news ${formatNumber(sig.news_score)} · trends ${formatNumber(sig.google_trends_score)} · jobs ${formatNumber(sig.jobs_score)}`);
      lines.push(`    ${sig.url}`);
    }
  }

  if (stats.top_investment_grades.length > 0) {
    lines.push("");
    lines.push("TOP INVESTMENT GRADES");
    for (const ig of stats.top_investment_grades) {
      lines.push(`  - ${ig.title}`);
      lines.push(`    overall ${formatNumber(ig.overall_score)} · ${ig.recommendation}`);
      lines.push(`    tam ${formatNumber(ig.tam_score)} · timing ${formatNumber(ig.market_timing_score)} · competition ${formatNumber(ig.competition_score)} · moat ${formatNumber(ig.moat_score)} · distribution ${formatNumber(ig.distribution_score)} · execution ${formatNumber(ig.execution_score)} · capital ${formatNumber(ig.capital_efficiency_score)}`);
      lines.push(`    ${ig.url}`);
    }
  }

  lines.push("");
  lines.push("RECOMMENDATIONS");
  for (const r of recs) lines.push(`  - ${r}`);

  lines.push("");
  lines.push(`View digest history: ${context.historyUrl}`);
  lines.push(`Manage settings:     ${context.settingsUrl}`);
  lines.push(`Unsubscribe:         ${context.unsubscribeUrl}`);

  return lines.join("\n");
}
