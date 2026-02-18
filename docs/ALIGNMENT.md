# FE↔BE↔Prisma Alignment Matrix

Date: 2026-02-16  
Repos: `snp-interface` (FE), `snp-ops-api` (BE)

## 1) Module Map (Current State)

| Module | FE pages/dialogs/hooks | Data source in FE | BE controllers/services | Prisma models | Drift |
|---|---|---|---|---|---|
| Events | `app/events/page.tsx`, `app/events/[eventId]/page.tsx`, `components/events/create-event-dialog.tsx`, `components/events/event-resources-dialog.tsx` | Real API | `events.controller.ts`, `events.service.ts` | `Event`, `Zone`, `EventResource` | P1 (some consumers still not invalidating all dependents) |
| Zones/Layout | `app/events/zones/page.tsx` | Real API | `events.controller.ts` (zones endpoints) | `Zone` | P1 (read-only FE flow) |
| Tasks | `app/tasks/page.tsx`, `lib/context/tasks-board-context.tsx`, `components/tasks/*` | Real API (no mock board state) | `tasks.controller.ts`, `tasks.service.ts`, `tasks.repo.ts` | `Task`, `TaskActivity`, `TaskComment`, `TaskChecklistItem` | P0 fixed (assignee/event constraints + refresh invalidation) |
| WorkOrders | `app/work-orders/page.tsx`, `components/work-orders/create-work-order-dialog.tsx` | Real API | `work-orders.controller.ts`, `work-orders.service.ts` | `WorkOrder`, `WorkOrderEvidence`, `ProviderService`, `Zone` | P0 fixed (task creation now uses real IDs) |
| Inventory (dashboard/assets/kits/checklists/movements/categories) | `app/inventory/*`, `components/inventory/*`, `lib/inventory/utils.ts` | Real API | `inventory.controller.ts`, `inventory.service.ts` | `Asset*`, `InventoryKit*`, `InventoryChecklist*`, `AssetUsage`, `InventoryMovement` | P0 fixed (apply-kit contract + refresh + no mock fallback) |
| Files | `lib/api/upload-image.ts`, image upload usage in events/tasks/inventory | Real API | `files.controller.ts`, `files.service.ts` | N/A (S3 object storage + DB references in entities) | P0 fixed (org scope + MIME/ext allowlist + membership checks) |
| Staff & Access | `app/staff/page.tsx`, `app/access/page.tsx`, `components/staff/*`, `components/access/*` | Mostly mock; partial real usage in Tasks/WorkOrders for assignments | `staff.controller.ts`, `staff.service.ts` | `StaffMember`, `StaffAssignment`, `Credential`, `ScanLog`, `Shift` | P1 (pages still mock-backed) |
| Incidents | `app/incidents/page.tsx`, `components/incidents/*` | Mock | `incidents.controller.ts` | `Incident`, `IncidentEvidence` | P1 |
| Improvements | `app/improvements/page.tsx`, `components/improvements/*` | Mock | `improvements.controller.ts` | `Improvement` | P1 |
| Partners/Sponsors | `app/partners/page.tsx`, `app/sponsors/page.tsx`, `components/partners/*`, `components/sponsors/*` | Mock | `partners.controller.ts` | `Brand`, `Partnership`, `Sponsorship`, `PartnerSponsorApplication` | P1 |
| Referees & Tatamis | `app/referees/page.tsx`, `components/referees/*` | Mock | `referees.controller.ts` | `RefereeProfile`, `Tatami`, `TatamiReferee` | P1 |
| Trainings | `app/trainings/page.tsx`, `components/trainings/*` | Mock | `trainings.controller.ts` | `Training`, `TrainingAttendee` | P1 |
| Dashboard/KPIs | `app/dashboard/page.tsx`, `app/kpis/page.tsx`, `components/dashboard/*` | Mostly mock | `kpis.controller.ts` | Aggregations over operational tables | P2 |

## 2) Endpoint Contract Matrix (FE → BE → Prisma)

### Events / Zones / Resources

| FE caller | Method + endpoint | FE payload/expectation | BE path | Prisma | Drift |
|---|---|---|---|---|---|
| `app/events/page.tsx` | `GET /orgs/:orgId/events` | expects list with counters and media fields | `events.controller.ts#getEvents` | `Event` (+ counts) | P1 |
| `app/events/page.tsx` | `POST /orgs/:orgId/events` | `{code,name,startDate,endDate,venue,imageUrl,imageKey}` | `events.controller.ts#createEvent` | `Event` | Aligned |
| `app/events/page.tsx` | `PATCH /orgs/:orgId/events/:eventId` | update event/media | `events.controller.ts#updateEvent` | `Event` | Aligned |
| `app/events/page.tsx` | `PUT /orgs/:orgId/events/:eventId/resources` | `{staffIds,assetIds}` | `events.controller.ts#assignResources` | `EventResource` | Aligned |
| `app/events/zones/page.tsx` | `GET /orgs/:orgId/events/:eventId/zones` | list zones for selected event | `events.controller.ts#getZones` | `Zone` | Aligned |

### Tasks

| FE caller | Method + endpoint | FE payload/expectation | BE path | Prisma | Drift |
|---|---|---|---|---|---|
| `tasks-board-context.tsx` | `GET /orgs/:orgId/tasks` | full board dataset (comments/checklist counts) | `tasks.controller.ts#listTasks` | `Task*` | Aligned |
| `tasks-board-context.tsx` | `POST /orgs/:orgId/tasks` | includes `eventId`, `assigneeId`, relation IDs, `labels` | `tasks.controller.ts#createTask` | `Task` | P0 fixed |
| `tasks-board-context.tsx` | `PATCH /orgs/:orgId/tasks/:taskId` | partial update incl move fields | `tasks.controller.ts#updateTask` | `Task`, `TaskActivity` | P0 fixed |
| `tasks-board-context.tsx` | `POST /orgs/:orgId/tasks/:taskId/move` | `{status,overTaskId}` | `tasks.controller.ts#moveTaskPost` | `Task`, `TaskActivity` | Aligned |
| `tasks-board-context.tsx` | comments/checklist endpoints | comment + checklist mutations | `tasks.controller.ts` | `TaskComment`, `TaskChecklistItem`, `TaskActivity` | Aligned |

### WorkOrders

| FE caller | Method + endpoint | FE payload/expectation | BE path | Prisma | Drift |
|---|---|---|---|---|---|
| `app/work-orders/page.tsx` | `GET /orgs/:orgId/events/:eventId/work-orders` | list per selected event | `work-orders.controller.ts#listWorkOrders` | `WorkOrder` | Aligned |
| `app/work-orders/page.tsx` | `POST /orgs/:orgId/events/:eventId/provider-services/:providerServiceId/work-orders` | create with zone + schedule | `work-orders.controller.ts#createWorkOrder` | `WorkOrder` | Aligned |
| `app/work-orders/page.tsx` | `PATCH /orgs/:orgId/events/:eventId/work-orders/:id` | update fields | `work-orders.controller.ts#updateWorkOrder` | `WorkOrder` | Aligned |
| `app/work-orders/page.tsx` | `PATCH /orgs/:orgId/events/:eventId/work-orders/:id/status` | status transitions | `work-orders.controller.ts#updateWorkOrderStatus` | `WorkOrder` | Aligned |

### Inventory

| FE caller | Method + endpoint | FE payload/expectation | BE path | Prisma | Drift |
|---|---|---|---|---|---|
| `app/inventory/assets/page.tsx` | `/orgs/:orgId/assets` CRUD | asset lifecycle with media keys | `inventory.controller.ts` | `Asset`, `AssetCategory` | Aligned |
| `app/inventory/kits/page.tsx` | `POST /orgs/:orgId/events/:eventId/inventory/apply-kit/:kitId` | expects `{assignedCount,missingItems[]}` | `inventory.service.ts#applyKitToEvent` | `InventoryKit*`, `AssetUsage`, `InventoryMovement` | P0 fixed |
| `app/inventory/checklists/page.tsx` | checklists CRUD/verify/sign | event-scoped checklist state | `inventory.controller.ts` | `InventoryChecklist*` | Aligned |
| `app/inventory/movements/page.tsx` | `GET /orgs/:orgId/inventory/movements` | filtered movement log | `inventory.controller.ts#listMovements` | `InventoryMovement` | Aligned |
| `app/inventory/page.tsx` | `GET /orgs/:orgId/inventory/dashboard/stats` | aggregate dashboard stats | `inventory.controller.ts#inventoryDashboardStats` | aggregated | Aligned |

### Files

| FE caller | Method + endpoint | FE payload/expectation | BE path | Storage contract | Drift |
|---|---|---|---|---|---|
| `lib/api/upload-image.ts` | `POST /orgs/:orgId/files/upload` | form-data: `file`,`folder`,`entityId?` | `files.controller.ts#uploadFile` | org-scoped keys under `orgs/:orgId/...` + MIME/ext allowlist | P0 fixed |

## 3) Drift Backlog by Priority

### P0 (must hold now)

- [x] Task assignee must be `StaffMember` in org; if task has `eventId`, assignee must be assigned to event (`StaffAssignment` or `EventResource`).
- [x] Task relation mismatches (`workOrder/zone/incident/sponsorship` vs `eventId`) return `409 Conflict`.
- [x] WorkOrder → Task creation uses real IDs from backend (no local/mock ID generation).
- [x] Inventory apply-kit returns FE contract (`assignedCount`, `missingItems`) and emits refresh invalidations.
- [x] `/files/upload` hardened for org-scoping + membership + MIME/ext allowlist.

### P1 (remaining for full no-mock objective)

- [ ] Replace mock data flows in: Staff, Access, Incidents, Improvements, Partners, Sponsors, Referees/Tatamis, Trainings.
- [ ] Replace dashboard/KPI mock cards with real aggregations.
- [ ] Complete module API clients for all remaining domains (same error semantics as Tasks/Inventory/WorkOrders).
- [ ] Migrate from custom invalidation bus to TanStack Query once package install/network is available.

### P2

- [ ] Signed URL flow for private file reads (upload already tenant-scoped).
- [ ] Consolidate FE response adapters where endpoint envelopes differ (`array` vs `data/items`).

