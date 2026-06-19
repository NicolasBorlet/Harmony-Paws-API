# Harmony Paws API — Contributing

## Identifiers

- **UUID** primary keys for user-facing entities exposed in the REST API: `users`, `dogs`, `activities`, `friendships`, `activity_stats`, badge entities.
- **SERIAL (Int)** for internal catalog tables never exposed as public resource IDs: `roles`, `breeds`, `behavior`.
- **BigInt** auto-increment for high-volume relational tables: `messages`, `conversations`, `modules`, `lessons`, etc.
- **No `*_old` columns** — every FK to a user is `user_id UUID`.

## Module layout

Each domain lives under `src/<domain>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`, and DTOs.

## Authorization

Replace Supabase RLS with service-layer checks: the authenticated user from JWT (`sub`) must match `user_id` / `owner_id` / participant predicates before reads or writes.
