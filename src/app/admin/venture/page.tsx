/**
 * Sprint 63: Admin Venture Studio Page
 *
 * Admin view for venture projects:
 * - Stats summary
 * - Top projects table with Regenerate / Delete / Archive actions
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VentureProjectsRepository } from "@/lib/db/repositories/venture-projects.repository";
import { VentureMvpRepository } from "@/lib/db/repositories/venture-mvp.repository";
import { RegenerateProjectButton } from "@/components/venture-studio/regenerate-project-button";
import { DeleteProjectButton } from "@/components/venture-studio/delete-project-button";
import { ArchiveProjectButton } from "@/components/venture-studio/archive-project-button";
import { Building2, Rocket, TrendingUp, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminVentureStudioPage() {
  const [projectsRepo, mvpRepo] = await Promise.all([
    VentureProjectsRepository.create(),
    VentureMvpRepository.create(),
  ]);

  const [projects, stats, mvpCount] = await Promise.all([
    projectsRepo.listCards({ limit: 100 }),
    projectsRepo.getStats(),
    mvpRepo.count(),
  ]);

  // Enrich average MVP cost
  if (mvpCount > 0) {
    stats.averageMvpCost = "$15,000-$25,000";
  }

  const maxScore = Math.max(1, ...projects.map((p) => p.overall_score));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Venture Studio Admin</h1>
        <p className="text-muted-foreground mt-1">
          {stats.total} projects · {stats.readyToBuild} ready to build · avg score {Math.round(stats.averageScore)}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Rocket className="h-4 w-4" /> Ready To Build
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.readyToBuild}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageScore)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Avg MVP Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageMvpCost}</div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <p className="text-muted-foreground text-sm">No records yet.</p>
          ) : (
            <div className="space-y-2">
              {[
                { bucket: "90-100", min: 90, max: 100, count: 0 },
                { bucket: "70-89", min: 70, max: 89, count: 0 },
                { bucket: "50-69", min: 50, max: 69, count: 0 },
                { bucket: "0-49", min: 0, max: 49, count: 0 },
              ].map((b) => {
                b.count = projects.filter(
                  (p) => p.overall_score >= b.min && p.overall_score <= b.max,
                ).length;
                return (
                  <div key={b.bucket} className="flex items-center gap-3">
                    <div className="w-16 text-sm font-medium">{b.bucket}</div>
                    <div className="flex-1 bg-muted rounded h-6 relative">
                      <div
                        className="bg-blue-500 h-full rounded"
                        style={{
                          width: `${maxScore > 0 ? (b.count / projects.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm text-muted-foreground">
                      {b.count}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Venture Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No venture projects generated yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Tagline</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium max-w-[200px] truncate">
                        {project.name}
                      </td>
                      <td className="p-2 truncate max-w-[250px] text-muted-foreground">
                        {project.tagline}
                      </td>
                      <td className="p-2 font-bold">{project.overall_score}</td>
                      <td className="p-2">
                        {project.status === "ready" ? (
                          <Badge className="bg-green-100 text-green-800">Ready</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">{project.status}</Badge>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <RegenerateProjectButton projectId={project.id} />
                          <ArchiveProjectButton projectId={project.id} />
                          <DeleteProjectButton projectId={project.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
