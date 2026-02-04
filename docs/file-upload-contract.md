# File Upload Contract (NestJS + Next.js)

## HTTP API

- Endpoint: `POST /files/upload`
- Content-Type: `multipart/form-data`
- Fields:
  - `file` (required, binary)
  - `folder` (required string: `staff` | `brands` | `sponsors`)
  - `entityId` (optional string)

### Success response (200)

```json
{
  "url": "https://cdn.snp.com/org_org_1/staff/staff_12/1f8c...jpg",
  "key": "org_org_1/staff/staff_12/1f8c...jpg",
  "size": 241992,
  "mimeType": "image/jpeg"
}
```

### Error codes

- `400` invalid payload / unsupported MIME type
- `401` unauthenticated
- `403` role not allowed
- `413` file too large
- `500` storage/internal failure

### Validation and security

- Server-side allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- Max size: e.g. `5MB`
- Auth required (JWT/session)
- Allowed roles example: `SUPER_ADMIN`, `EVENT_DIRECTOR`, `TECH_SYSTEMS`, `GUADA`
- Frontend never gets S3 credentials, only API URLs.

## Frontend contract

Types and helper live in:
- `lib/api/upload-image.ts`

Reusable uploader component lives in:
- `components/shared/image-upload.tsx`

### Example: Create Staff form integration

```tsx
const [photoFile, setPhotoFile] = useState<File | null>(null)

async function onSubmit(values: CreateStaffPayload) {
  let avatarUrl: string | undefined
  let avatarKey: string | undefined

  if (photoFile) {
    const upload = await uploadImage({ file: photoFile, folder: "staff" })
    avatarUrl = upload.url
    avatarKey = upload.key
  }

  console.log("Create Staff payload", { ...values, avatarUrl, avatarKey })
}

<ImageUpload
  label="Profile photo"
  value={photoFile}
  onChange={setPhotoFile}
  maxSizeMB={5}
/>
```

### Example: Create Brand form integration

```tsx
const [logoFile, setLogoFile] = useState<File | null>(null)

async function onSubmit(values: CreateBrandPayload) {
  const upload = logoFile ? await uploadImage({ file: logoFile, folder: "brands" }) : null
  console.log("Create Brand payload", {
    ...values,
    logoUrl: upload?.url,
    logoKey: upload?.key,
  })
}

<ImageUpload
  label="Brand logo"
  value={logoFile}
  onChange={setLogoFile}
  maxSizeMB={5}
/>
```

## S3 key strategy

- `org_{orgId}/staff/{staffId}/{uuid}.{ext}`
- `org_{orgId}/brands/{brandId}/{uuid}.{ext}`
- `org_{orgId}/sponsors/{eventId}/{uuid}.{ext}`

Why:
- Predictable path by domain
- UUID avoids collisions
- Easy cleanup by org/entity prefix

## Migration path

1. Current: `ImageUpload` returns `File` + local preview.
2. Next: form submit calls `uploadImage({ file, folder })`.
3. API returns `url`/`key`; save in entity (`staff.avatarUrl`, `brand.logoUrl`, `sponsorship.imageUrl`).
4. Edit flows pass existing URL via `existingImageUrl` prop.

## NestJS shape (high level)

```ts
// dto/upload-file.dto.ts
export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  folder!: string

  @IsOptional()
  @IsString()
  entityId?: string
}

// dto/upload-file-response.dto.ts
export class UploadFileResponseDto {
  url!: string
  key!: string
  size!: number
  mimeType!: string
}

// files.controller.ts
@UseGuards(AuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "EVENT_DIRECTOR", "TECH_SYSTEMS", "GUADA")
@Post("upload")
@UseInterceptors(FileInterceptor("file"))
uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UploadFileDto,
  @Req() req: AuthenticatedRequest,
): Promise<UploadFileResponseDto> {
  return this.filesService.upload({ file, folder: dto.folder, entityId: dto.entityId, actorId: req.user.id })
}
```

## Environment variables (backend)

- `S3_BUCKET_NAME`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT` (optional for S3-compatible providers)
- `S3_PUBLIC_BASE_URL` (optional CDN/public host)
