# Seed data

Deterministic development seed for Opportunity Hunter. All IDs are stable
UUIDs (`00000000-0000-0000-0000-00000000000N`) so a fresh `db reset` always
produces the same dataset and the seeds compose cleanly.

## Files (run in order)

| File | Populates |
| --- | --- |
| `00_reset.sql` | Truncates every Opportunity Hunter table. |
| `01_sources.sql` | `sources` — 5 rows (Reddit, HN, Indie Hackers, App Reviews). |
| `02_raw_posts.sql` | `raw_posts` — 6 sample posts. |
| `03_pain_points.sql` | `pain_points` — 6 sample extractions. |
| `04_pain_clusters.sql` | `pain_clusters` — 6 themes. |
| `05_opportunities.sql` | `opportunities` — 6 scored opportunities. |
| `06_startup_ideas.sql` | `startup_ideas` — 6 product briefs. |

## Running

### With the Supabase CLI

```bash
supabase db reset
# or, if you've already started the local stack:
psql "$SUPABASE_DB_URL" -f supabase/seed/00_reset.sql
for f in supabase/seed/0[1-6]*.sql; do psql "$SUPABASE_DB_URL" -f "$f"; done
```

### Without the Supabase CLI

Apply the migrations first (`psql ... -f supabase/migrations/*.sql` in
order) and then run the seed files above. The seed is idempotent — every
insert uses `on conflict (id) do nothing`.
