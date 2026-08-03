import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { ReactNode } from "react";
import {
  Database,
  AlertCircle,
  Target,
  CheckCircle,
  Sparkles,
  TrendingUp,
  FileText,
  Star,
  Eye,
  Bell,
  Mail,
  CalendarDays,
  PieChart,
  BarChart3,
  Flame,
  Brain,
  Percent,
  Zap,
} from "lucide-react";
import type { DashboardStats } from "@/types/dashboard";

interface KpiGroupProps {
  stats: DashboardStats;
}

interface Group {
  title: string;
  description: string;
  cards: Array<{
    title: string;
    value: string | number;
    suffix?: string;
    icon: ReactNode;
    tone?: "default" | "hot" | "risk" | "ai" | "info";
  }>;
}

export function KpiGroup({ stats }: KpiGroupProps) {
  const groups: Group[] = [
    {
      title: "Data Intake",
      description: "Tín hiệu thị trường đang được thu thập",
      cards: [
        {
          title: "Raw posts",
          value: stats.rawPosts,
          icon: <Database className="h-4 w-4" />,
        },
        {
          title: "Pain points",
          value: stats.painPoints,
          icon: <AlertCircle className="h-4 w-4" />,
        },
        {
          title: "Vector hóa",
          value: stats.embeddings,
          icon: <Brain className="h-4 w-4" />,
        },
        {
          title: "Cluster (cụm)",
          value: stats.clusters,
          icon: <Target className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Opportunity Quality",
      description: "Chất lượng cơ hội qua từng giai đoạn",
      cards: [
        {
          title: "Cơ hội",
          value: stats.opportunities,
          icon: <Target className="h-4 w-4" />,
        },
        {
          title: "Đã xác thực",
          value: stats.validated,
          tone: "hot",
          icon: <CheckCircle className="h-4 w-4" />,
        },
        {
          title: "Ý tưởng startup",
          value: stats.ideas,
          tone: "ai",
          icon: <Sparkles className="h-4 w-4" />,
        },
        {
          title: "TB pain/cụm",
          value: stats.averageClusterSize.toFixed(1),
          icon: <PieChart className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Investment Readiness",
      description: "Cơ hội đã sẵn sàng cho vòng đầu tư",
      cards: [
        {
          title: "Bằng chứng thị trường",
          value: stats.evidenceCount,
          tone: "info",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          title: "Độ tin cậy TB",
          value: Math.round(stats.averageEvidenceConfidence),
          suffix: "%",
          icon: <Percent className="h-4 w-4" />,
        },
        {
          title: "Đã dự báo",
          value: stats.forecastCount,
          tone: "ai",
          icon: <TrendingUp className="h-4 w-4" />,
        },
        {
          title: "Hồ sơ tình báo",
          value: stats.intelligenceCount,
          tone: "info",
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Personal Workflow",
      description: "Hoạt động của Quốc Sư trong tuần",
      cards: [
        {
          title: "Đã lưu",
          value: stats.savedCount,
          icon: <Star className="h-4 w-4" />,
        },
        {
          title: "Watchlists",
          value: stats.watchlistsCount,
          icon: <Eye className="h-4 w-4" />,
        },
        {
          title: "Cảnh báo chưa đọc",
          value: stats.unreadAlertsCount,
          tone: "risk",
          icon: <Bell className="h-4 w-4" />,
        },
        {
          title: "Digest đã gửi",
          value: stats.weeklyEmailsSent,
          icon: <Mail className="h-4 w-4" />,
        },
      ],
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map((group) => (
        <Card key={group.title} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold tracking-tight">
                {group.title}
              </CardTitle>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.cards.length} KPI
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{group.description}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-2">
            {group.cards.map((card, i) => (
              <MetricCard
                key={i}
                size="sm"
                title={card.title}
                value={card.value}
                suffix={card.suffix}
                icon={card.icon}
                tone={card.tone}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Smaller highlight row reserved for top-of-dashboard spotlight stats.
 */
export function SpotlightStats({ stats }: KpiGroupProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Cơ hội trong tuần"
        value={stats.weeklyOpportunities}
        icon={<CalendarDays className="h-4 w-4" />}
        change="7 ngày qua"
        trend="up"
      />
      <MetricCard
        title="Điểm dự báo cao nhất"
        value={Math.round(stats.topForecastScore)}
        icon={<Zap className="h-4 w-4" />}
        tone="ai"
      />
      <MetricCard
        title="Tình báo thị trường TB"
        value={Math.round(stats.averageIntelligenceScore)}
        icon={<BarChart3 className="h-4 w-4" />}
        tone="info"
      />
      <MetricCard
        title="Cụm lớn nhất"
        value={stats.largestClusterSize}
        icon={<Flame className="h-4 w-4" />}
        change={`Cụm ngữ nghĩa nóng nhất`}
      />
    </div>
  );
}