# System Architecture

## Data Flow

Reddit
↓
Collector
↓
Raw Posts
↓
Pain Detection
↓
Pain Clusters
↓
Opportunity Scoring
↓
Startup Generator
↓
Dashboard

---

## Components

### Frontend

- Next.js
- Tailwind
- shadcn/ui

### Backend

- Next.js API Routes

### Database

- PostgreSQL (Supabase)

### AI Layer

- OpenAI API

### Scheduler

- Vercel Cron

### Deployment

- Vercel
