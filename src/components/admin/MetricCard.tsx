"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, Activity, TrendingUp, Brain, Rss, DollarSign,
  Briefcase, AlertCircle, BarChart3, FileText, Target,
  Zap, Shield, Search, Globe, Clock, PieChart, Settings,
  TrendingDown, ArrowUpRight, ArrowDownRight, Minus, Star,
  CheckCircle, XCircle, Eye, BookOpen, Lightbulb, Flame,
  Layers, Database, Cpu, BarChart2, LineChart, Calendar,
  CreditCard
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Users, Activity, TrendingUp, Brain, Rss, DollarSign,
  Briefcase, AlertCircle, BarChart3, FileText, Target,
  Zap, Shield, Search, Globe, Clock, PieChart, Settings,
  TrendingDown, ArrowUpRight, ArrowDownRight, Minus, Star,
  CheckCircle, XCircle, Eye, BookOpen, Lightbulb, Flame,
  Layers, Database, Cpu, BarChart2, LineChart, Calendar,
  CreditCard,
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: MetricCardProps) {
  const Icon = ICON_MAP[icon] || Activity;
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.positive ? "+" : ""}
                {trend.value}% vs last period
              </p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}