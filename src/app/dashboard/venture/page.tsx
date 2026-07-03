/**
 * Sprint 63: Dashboard Venture Studio Page
 *
 * Displays AI-generated startup blueprints (venture projects).
 * Shows projects, readiness, average score, and average MVP cost.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTopProjectsAction, getStatisticsAction } from "@/actions/venture-studio.actions";
import { Building2, Rocket, TrendingUp, DollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-700";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-yellow-600";
  return "text-gray-600";
}

function getStatusBadge(status: string) {
  if (status === "ready")
    return <Badge className="bg-green-100 text-green-800">✅ Ready to Build</Badge>;
  if (status === "archived")
    return <Badge className="bg-gray-100 text-gray-800">📦 Archived</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-800">📝 {status}</Badge>;
}

export default async function VentureStudioPage() {
  const [projectsResult, statsResult] = await Promise.all([
    getTopProjectsAction(50),
    getStatisticsAction(),
  ]);

  const projects = projectsResult.success ? projectsResult.data ?? [] : [];
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Venture Studio</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated startup blueprints — canvas, GTM, MVP, roadmap & checklist
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready To Build</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {stats?.readyToBuild ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats?.averageScore ?? 0)}`}>
                {Math.round(stats?.averageScore ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg MVP Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageMvpCost ?? "$0"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Venture Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No venture projects generated yet. Projects are generated for opportunities
                with startup_score overall_score ≥ 75.
              </p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/venture/${project.id}`}
                    className="block border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium flex items-center gap-2">
                          {project.name}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.tagline}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        {getStatusBadge(project.status)}
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs text-muted-foreground">Score:</span>
                          <span className={`text-sm font-bold ${getScoreColor(project.overall_score)}`}>
                            {project.overall_score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
