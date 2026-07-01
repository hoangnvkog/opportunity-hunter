// Sprint 60: Portfolio Intelligence Engine - Portfolio Card Component

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, Archive, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState } from 'react';
import { PortfolioStatusLabels, PriorityLabels } from '@/types/portfolio';
import type { PortfolioItemRow, PortfolioStatus, Priority } from '@/types/portfolio';

// PortfolioCard props
interface PortfolioCardPropsBase {
  portfolioItem: PortfolioItemRow | null;
  opportunityId: string;
}
type PortfolioCardProps = PortfolioCardPropsBase;

export function PortfolioCard({ portfolioItem, opportunityId }: PortfolioCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(portfolioItem?.notes || '');
  const [status, setStatus] = useState<PortfolioStatus>(portfolioItem?.status || 'WATCHLIST');
  const [priority, setPriority] = useState<Priority>(portfolioItem?.priority || 'MEDIUM');

  if (!portfolioItem) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Management</CardTitle>
          <CardDescription>Add this opportunity to your portfolio to track its health and lifecycle</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => handleAddToPortfolio()} className="w-full">
            Add to Portfolio
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSaveReview = async () => {
    // TODO: Call server action to save review
    setIsEditing(false);
  };

  const handleToggleFavorite = async () => {
    // TODO: Call server action to toggle favorite
  };

  const handleArchive = async () => {
    // TODO: Call server action to archive
  };

  const handleAddToPortfolio = async () => {
    // TODO: Call server action to add to portfolio
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Management</CardTitle>
            <CardDescription>Track health, status, and lifecycle</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={portfolioItem.favorite ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleFavorite}
            >
              <Star className={portfolioItem.favorite ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Health Score</p>
            {portfolioItem.health_score !== null ? (
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-2xl font-bold ${getHealthColor(portfolioItem.health_score)}`}>
                  {portfolioItem.health_score.toFixed(1)}
                </p>
                {getHealthIcon(portfolioItem.health_score)}
              </div>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">Last Reviewed</p>
            <p className="text-sm mt-1">
              {portfolioItem.last_reviewed_at
                ? new Date(portfolioItem.last_reviewed_at).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as PortfolioStatus)} disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PortfolioStatusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)} disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PriorityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">Notes</label>
          <Textarea
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            disabled={!isEditing}
            placeholder="Add your notes..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSaveReview} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Save Review
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="flex-1">
              Review Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getHealthColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getHealthIcon(score: number) {
  if (score >= 70) {
    return <TrendingUp className="h-5 w-5 text-green-600" />;
  }
  if (score < 50) {
    return <TrendingDown className="h-5 w-5 text-red-600" />;
  }
  return <Minus className="h-5 w-5 text-yellow-600" />;
}
