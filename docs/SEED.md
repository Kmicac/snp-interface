# Seed Plan and Status (`org_snp`)

Date: 2026-02-16  
BE file: `snp-ops-api/prisma/seed.ts`

## Current Coverage

Implemented as idempotent `upsert` seed for:

- Organization and admin membership.
- 12 events for 2026 (with `imageUrl` + deterministic `imageKey`).
- Staff members and event assignments.
- Tasks (event-scoped, assigned to valid staff members).
- Asset categories and assets.
- Inventory kits and kit items.
- Inventory checklists and checklist items.

## Idempotency Strategy

Current seed uses stable keys/upserts on:

- `Organization.id` (`org_snp`)
- `Event` by unique `(organizationId, code)`
- `StaffMember.id`
- `StaffAssignment.id` (deterministic composite string)
- `Task.id`
- `AssetCategory` by `(organizationId, name)`
- `Asset` by `(organizationId, assetTag)` (lookup + update/create)
- `InventoryKit.id`
- `InventoryChecklist.checklistNumber`

No duplication is expected on repeated `pnpm prisma db seed`.

## Gaps vs Full-App Seed Objective

Still missing/partial for full-screen population:

- Venues and event zones generation per event.
- Work orders with zone links and evidence.
- Incidents and improvements linked to events/tasks.
- Asset usages/movements bootstrapped from kit application or checkouts.
- Credentials and scan logs for access screens.
- Referees/tatamis/trainings entities with realistic relations.
- Task activity/comment records across scenarios.

## Target Additions (Next Increment)

1. Add zones for each seeded event (`Tatami`, `FOH`, `Mesa de control`, etc).
2. Seed provider/services and `>=10` work orders tied to events/zones.
3. Seed incidents/improvements and attach tasks to those entities.
4. Create deterministic checkouts/returns to generate `AssetUsage` + `InventoryMovement`.
5. Seed credentials + scan logs for access module.
6. Add task comments/activities for auditability and board detail.

## Validation Commands

Executed:

- `pnpm prisma generate` ✅
- `pnpm prisma migrate deploy` ✅ (no pending migrations)
- `pnpm prisma db seed` ✅ (idempotent upsert run)
