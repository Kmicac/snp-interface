# Files Upload Security (`/files/upload`)

Date: 2026-02-16  
BE files:

- `snp-ops-api/src/modules/files/files.controller.ts`
- `snp-ops-api/src/modules/files/files.service.ts`
- `snp-ops-api/src/main.ts`

## Implemented Controls (P0)

### 1) Tenant scope and membership

- Primary route: `POST /orgs/:orgId/files/upload`.
- Legacy route kept for compatibility: `POST /files/upload`, now requires `orgId` in body.
- Both routes enforce org membership (`OrgMembership`) before upload.
- Folder normalization enforces org scoping:
  - `orgs/:orgId/...` must match route/body `orgId`.
  - `events/:eventId/...` is validated to belong to `orgId`, then rewritten to `orgs/:orgId/events/:eventId/...`.
  - legacy static folders (`partners`, `assets`, etc.) are auto-scoped to `orgs/:orgId/<folder>`.

### 2) File type validation

Server-side allowlist by MIME and extension:

- `image/jpeg` -> `.jpg`, `.jpeg`
- `image/png` -> `.png`
- `image/webp` -> `.webp`
- `application/pdf` -> `.pdf`

Rejects mismatched MIME/extension combinations.

### 3) Upload hardening

- Multer memory upload with `5MB` limit.
- Missing file and invalid folder are explicit `400`.
- Cross-org/event mismatch handled as `400/404/403` with clear messages.

### 4) CORS and error exposure

- CORS restricted by `CORS_ORIGINS` (`main.ts`), fallback `http://localhost:3000`.
- Prisma exception filter returns sanitized generic messages (`prisma-exception.filter.ts`), avoiding internal details in API responses.

## ACL and Object Access

- Removed hardcoded `ACL: "public-read"` from S3 `PutObjectCommand`.
- Objects now rely on bucket-level policy/default ACL (safer default than forcing public-read in app code).
- Non-production only fallback is available when S3 is unavailable: inline `data:` URL response (`FILES_ALLOW_DEV_INLINE_FALLBACK != false`).
- Production keeps strict behavior: no inline fallback, returns `503` on storage outage.

## Remaining Recommended Hardening

1. Move read path to signed URLs for private objects.
2. Add antivirus/malware scanning for uploaded files.
3. Add rate limiting and upload audit events per org/user.
4. Add content-sniff validation (magic bytes) in addition to MIME/extension.
