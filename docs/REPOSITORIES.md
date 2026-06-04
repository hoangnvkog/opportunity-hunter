# Repository layer

The repository layer is the only thing the rest of the app should import
to read or write the database. It hides PostgREST, it returns typed
domain rows, and it throws typed errors.

## Quick start

```ts
import {
  SourcesRepository,
  RawPostsRepository,
  NotFoundError,
} from "@/lib/db";

const sources = await SourcesRepository.create();
const source = await sources.findById(id);
if (!source) throw new NotFoundError("sources", id);

const posts = await RawPostsRepository.create();
const latest = await posts.listBySource("r/SaaS", 25);
```

## Conventions

1. **One file per table.** File name is `<table>.repository.ts`.
2. **Class with a static `create()` factory** that wires the default
   server Supabase client. Tests can bypass the factory and call
   `new SourcesRepository(mockClient)` directly.
3. **Finders come in two flavours**:
   - `findByX(...)` returns `T | null`.
   - `findByXOrThrow(...)` returns `T` and throws `NotFoundError`.
4. **`list` accepts a single `opts` object** so adding new filters
   later is a non-breaking change.
5. **`create` / `update` return the persisted row** so callers can
   immediately use the server-generated `id` (and `created_at` when
   the table has one).
6. **Errors are typed.** PostgREST `23505` → `UniqueViolationError`,
   `23503` → `ForeignKeyViolationError`, `23514` →
   `CheckViolationError`. The PostgREST `PGRST116` "no row" code
   surfaces as `NotFoundError`. Anything else wraps into the base
   `RepositoryError`.

## Adding a new table

1. Create a new migration in `supabase/migrations/`.
2. Add `Row` / `Insert` / `Update` types in
   `src/types/database.types.ts` and register the table on the
   `Database` interface.
3. Add a `<table>.repository.ts` under
   `src/lib/db/repositories/` and re-export it from the barrel.
4. Re-export the new class from `src/lib/db/index.ts`.
