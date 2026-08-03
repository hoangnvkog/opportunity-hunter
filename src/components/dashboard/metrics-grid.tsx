import { MetricCard } from "./metric-card";
import { TrendingUp, AlertCircle, Target, Brain, Star, Eye, Bell, Mail, CalendarDays, CheckCircle, FileText, Percent, Zap, BarChart3, Flame } from "lucide-react";
import type { DashboardStats } from "@/types/dashboard";

interface MetricsGridProps {
  metrics: DashboardStats;
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Tổng cơ hội"
        value={metrics.opportunities}
        icon={<Target className="h-4 w-4" />}
      />
      <MetricCard
        title="Điểm đau"
        value={metrics.painPoints}
        icon={<AlertCircle className="h-4 w-4" />}
      />
      <MetricCard
        title="Vector hóa"
        value={metrics.embeddings}
        icon={<Brain className="h-4 w-4" />}
      />
      <MetricCard
        title="Cơ hội đã xác thực"
        value={metrics.validated}
        icon={<CheckCircle className="h-4 w-4" />}
      />
      <MetricCard
        title="Ý tưởng startup"
        value={metrics.ideas}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Cơ hội đã lưu"
        value={metrics.savedCount}
        icon={<Star className="h-4 w-4" />}
      />
      <MetricCard
        title="Danh sách theo dõi"
        value={metrics.watchlistsCount}
        icon={<Eye className="h-4 w-4" />}
      />
      <MetricCard
        title="Cảnh báo chưa đọc"
        value={metrics.unreadAlertsCount}
        icon={<Bell className="h-4 w-4" />}
      />
      <MetricCard
        title="Cơ hội trong tuần"
        value={metrics.weeklyOpportunities}
        icon={<CalendarDays className="h-4 w-4" />}
      />
      <MetricCard
        title="Email hằng tuần"
        value={metrics.weeklyEmailsSent}
        icon={<Mail className="h-4 w-4" />}
        change="Bản tổng hợp đã gửi"
      />
      <MetricCard
        title="Bằng chứng thị trường"
        value={metrics.evidenceCount}
        icon={<FileText className="h-4 w-4" />}
      />
      <MetricCard
        title="Độ tin cậy TB"
        value={Math.round(metrics.averageEvidenceConfidence)}
        suffix="%"
        icon={<Percent className="h-4 w-4" />}
      />
      <MetricCard
        title="Cơ hội đã dự báo"
        value={metrics.forecastCount}
        icon={<Zap className="h-4 w-4" />}
      />
      <MetricCard
        title="Điểm dự báo cao nhất"
        value={Math.round(metrics.topForecastScore)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Điểm dự báo TB"
        value={Math.round(metrics.averageForecastScore)}
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <MetricCard
        title="Hồ sơ tình báo thị trường"
        value={metrics.intelligenceCount}
        icon={<Flame className="h-4 w-4" />}
      />
      <MetricCard
        title="Điểm thị trường cao nhất"
        value={Math.round(metrics.highestIntelligenceScore)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Điểm thị trường TB"
        value={Math.round(metrics.averageIntelligenceScore)}
        icon={<BarChart3 className="h-4 w-4" />}
      />
    </div>
  );
}
export { MetricsGrid };
