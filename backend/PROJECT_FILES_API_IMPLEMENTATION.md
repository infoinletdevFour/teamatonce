# Project Files API Implementation

## Overview
This document describes the **REAL** Project Files API implementation with complete file upload/download functionality using Fluxez SDK storage.

## Implementation Status: ✅ COMPLETE

The Project Files API has been fully implemented with the following features:
- Real file upload to Fluxez storage
- File metadata stored in PostgreSQL database
- File download with proper content-type handling
- File listing with filtering and pagination
- File sharing and permissions
- Milestone deliverable uploads

## Database Schema

The `project_files` table is defined in `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/database/schema.ts`:

```typescript
project_files: {
  columns: [
    { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
    { name: 'project_id', type: 'uuid', nullable: false },
    { name: 'milestone_id', type: 'uuid', nullable: true },
    { name: 'file_name', type: 'string', nullable: false },
    { name: 'file_path', type: 'string', nullable: false }, // Storage path
    { name: 'file_url', type: 'string', nullable: false }, // Public URL
    { name: 'file_size', type: 'bigint', nullable: false }, // Size in bytes
    { name: 'mime_type', type: 'string', nullable: false },
    { name: 'file_type', type: 'string', nullable: false }, // document, image, video, audio, code, archive, other

    // Upload Info
    { name: 'uploaded_by', type: 'string', nullable: false },
    { name: 'uploaded_at', type: 'timestamptz', default: 'now()' },

    // File Metadata
    { name: 'description', type: 'text', nullable: true },
    { name: 'tags', type: 'jsonb', default: '[]' },
    { name: 'version', type: 'integer', default: 1 },
    { name: 'is_deliverable', type: 'boolean', default: false },
    { name: 'deliverable_index', type: 'integer', nullable: true },

    // Thumbnail (for images/videos)
    { name: 'thumbnail_url', type: 'string', nullable: true },

    // Access Control
    { name: 'is_public', type: 'boolean', default: false },
    { name: 'shared_with', type: 'jsonb', default: '[]' },

    { name: 'metadata', type: 'jsonb', default: '{}' },
    { name: 'created_at', type: 'timestamptz', default: 'now()' },
    { name: 'updated_at', type: 'timestamptz', default: 'now()' },
    { name: 'deleted_at', type: 'timestamptz', nullable: true }
  ]
}
```

## API Endpoints

### 1. List Project Files
**Endpoint:** `GET /api/v1/projects/:projectId/files`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `milestoneId` (optional) - Filter by milestone ID
- `fileType` (optional) - Filter by file type (document, image, video, audio, code, archive, other)
- `uploadedBy` (optional) - Filter by uploader ID
- `isDeliverable` (optional) - Filter deliverables only
- `search` (optional) - Search by file name
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Response:**
```json
{
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "project-requirements.pdf",
      "size": 245632,
      "type": "application/pdf",
      "uploadedBy": {
        "id": "user-123",
        "name": "User"
      },
      "uploadedAt": "2025-10-24T00:00:00.000Z",
      "url": "https://storage.fluxez.com/project-files/abc123/project-requirements.pdf"
    }
  ],
  "total": 1
}
```

### 2. Upload File
**Endpoint:** `POST /api/v1/projects/:projectId/files/upload`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body (multipart/form-data):**
- `file` (required) - The file to upload
- `description` (optional) - File description
- `tags` (optional) - Array of tags
- `milestoneId` (optional) - Milestone ID to attach file to
- `isPublic` (optional, default: false) - Whether file is public
- `sharedWith` (optional) - Array of user IDs to share with

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "project-123",
  "milestoneId": null,
  "fileName": "project-requirements.pdf",
  "filePath": "project-123/1698345600000-project-requirements.pdf",
  "fileUrl": "https://storage.fluxez.com/project-files/...",
  "fileSize": 245632,
  "mimeType": "application/pdf",
  "fileType": "document",
  "uploadedBy": "user-123",
  "uploadedAt": "2025-10-24T00:00:00.000Z",
  "description": null,
  "tags": [],
  "version": 1,
  "isDeliverable": false,
  "isPublic": false,
  "sharedWith": [],
  "createdAt": "2025-10-24T00:00:00.000Z",
  "updatedAt": "2025-10-24T00:00:00.000Z"
}
```

### 3. Download File
**Endpoint:** `GET /api/v1/projects/:projectId/files/:fileId/download`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
- Binary file stream
- Content-Type header set to file's MIME type
- Content-Disposition header set for file download

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/v1/projects/project-123/files/file-456/download" \
  --output downloaded-file.pdf
```

### 4. Get File Details
**Endpoint:** `GET /api/v1/projects/:projectId/files/:fileId`

**Response:** Same as upload response

### 5. Get Signed URL
**Endpoint:** `GET /api/v1/projects/:projectId/files/:fileId/url`

**Response:**
```json
{
  "url": "https://storage.fluxez.com/project-files/...?token=abc123",
  "expiresIn": 3600
}
```

### 6. Delete File
**Endpoint:** `DELETE /api/v1/projects/:projectId/files/:fileId`

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### 7. Share File
**Endpoint:** `POST /api/v1/projects/:projectId/files/:fileId/share`

**Body:**
```json
{
  "userIds": ["user-123", "user-456"]
}
```

### 8. Update File Metadata
**Endpoint:** `POST /api/v1/projects/:projectId/files/:fileId`

**Body:**
```json
{
  "description": "Updated description",
  "tags": ["important", "contract"],
  "isPublic": false,
  "sharedWith": ["user-123"]
}
```

### 9. Upload Milestone Deliverable
**Endpoint:** `POST /api/v1/projects/:projectId/milestones/:milestoneId/deliverables/upload`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body:**
- `file` (required) - The deliverable file
- `deliverableIndex` (required) - Index in milestone deliverables array
- `description` (optional) - File description
- `tags` (optional) - Array of tags

### 10. Get Milestone Files
**Endpoint:** `GET /api/v1/projects/:projectId/milestones/:milestoneId/files`

### 11. Get Milestone Deliverables
**Endpoint:** `GET /api/v1/projects/:projectId/milestones/:milestoneId/deliverables`

## Implementation Details

### File Storage
Files are stored in Fluxez Storage using the following pattern:
- **Bucket:** `project-files`
- **Path structure:** `{projectId}/{timestamp}-{filename}`
- **Milestone deliverables:** `{projectId}/milestones/{milestoneId}/{timestamp}-{filename}`

### File Type Detection
File types are automatically detected based on MIME type:
- `image/*` → `image`
- `video/*` → `video`
- `audio/*` → `audio`
- PDF, documents, text → `document`
- JavaScript, TypeScript, code → `code`
- ZIP, RAR, TAR, compressed → `archive`
- Others → `other`

### Security
- All endpoints require JWT authentication
- Files are accessible only to:
  - Project owner (client)
  - Assigned team members
  - Users explicitly shared with
- Soft delete implementation (files marked as deleted, not physically removed)

### Service Implementation

Located at: `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/modules/teamatonce/project/project.service.ts`

Key methods:
```typescript
// Upload file to project
async uploadProjectFile(
  projectId: string,
  userId: string,
  file: Express.Multer.File,
  dto: any,
)

// Upload milestone deliverable
async uploadMilestoneDeliverable(
  projectId: string,
  milestoneId: string,
  userId: string,
  file: Express.Multer.File,
  dto: any,
)

// List project files
async getProjectFiles(projectId: string, filters?: any)

// Get file by ID
async getFileById(projectId: string, fileId: string)

// Download file
async downloadProjectFile(projectId: string, fileId: string)

// Get signed URL
async getFileUrl(projectId: string, fileId: string)

// Delete file
async deleteProjectFile(projectId: string, fileId: string)

// Share file
async shareFile(projectId: string, fileId: string, userIds: string[])

// Update metadata
async updateFileMetadata(projectId: string, fileId: string, dto: any)
```

### Controller Implementation

Located at: `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/modules/teamatonce/project/file.controller.ts`

Uses:
- `FileInterceptor` for file uploads
- `@UseGuards(JwtAuthGuard)` for authentication
- `StreamableFile` for downloads
- Swagger/OpenAPI decorators for documentation

## Usage Examples

### Upload a File
```typescript
const formData = new FormData();
formData.append('file', fileBlob, 'document.pdf');
formData.append('description', 'Project requirements document');
formData.append('tags', JSON.stringify(['requirements', 'contract']));
formData.append('milestoneId', 'milestone-123');

const response = await fetch(
  'http://localhost:3001/api/v1/projects/project-123/files/upload',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  }
);

const fileData = await response.json();
console.log('Uploaded file:', fileData);
```

### List Files
```typescript
const response = await fetch(
  'http://localhost:3001/api/v1/projects/project-123/files?fileType=document&page=1&limit=10',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);

const { files, total } = await response.json();
console.log(`Found ${total} files:`, files);
```

### Download File
```typescript
const response = await fetch(
  'http://localhost:3001/api/v1/projects/project-123/files/file-456/download',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'downloaded-file.pdf';
a.click();
```

## Fluxez SDK Storage Methods Used

The implementation uses the following Fluxez SDK storage methods:

```typescript
// Upload file
await this.fluxez.uploadFile(
  bucket: string,
  file: Buffer,
  fileName: string,
  options: { contentType: string }
)

// Download file
await this.fluxez.downloadFile(bucket: string, path: string)

// Get public URL
await this.fluxez.getPublicUrl(bucket: string, path: string)

// Create signed URL (temporary access)
await this.fluxez.createSignedUrl(bucket: string, path: string, expiresIn: number)

// Delete file
await this.fluxez.deleteFile(bucket: string, path: string)
```

## Testing

### Test File Upload
```bash
curl -X POST \
  http://localhost:3001/api/v1/projects/PROJECT_ID/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "description=Test upload" \
  -F "tags=[\"test\",\"sample\"]"
```

### Test File List
```bash
curl -X GET \
  "http://localhost:3001/api/v1/projects/PROJECT_ID/files?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test File Download
```bash
curl -X GET \
  "http://localhost:3001/api/v1/projects/PROJECT_ID/files/FILE_ID/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output downloaded-file.pdf
```

## Notes

1. **No Dummy Data:** All file operations use real Fluxez storage
2. **Database Persistence:** File metadata is stored in PostgreSQL
3. **Automatic Type Detection:** File types are detected from MIME types
4. **Soft Delete:** Files are soft-deleted (deleted_at timestamp)
5. **Milestone Integration:** Files can be attached to specific milestones
6. **Deliverable Tracking:** Special handling for milestone deliverables
7. **Access Control:** File sharing and permissions system
8. **Signed URLs:** Temporary access URLs for secure downloads
9. **Version Support:** File versioning system in place

## Future Enhancements

Potential improvements:
- [ ] Thumbnail generation for images/videos
- [ ] File preview functionality
- [ ] Bulk file operations (upload/delete multiple)
- [ ] File compression/optimization
- [ ] Virus scanning for uploaded files
- [ ] File encryption at rest
- [ ] Advanced search and filtering
- [ ] File comments and annotations
- [ ] File version history
- [ ] Integration with document signing services
- [ ] Fetch actual user names for uploadedBy.name field

## Related Files

- **Service:** `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/modules/teamatonce/project/project.service.ts`
- **Controller:** `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/modules/teamatonce/project/file.controller.ts`
- **DTOs:** `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/modules/teamatonce/project/dto/file.dto.ts`
- **Module:** `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/modules/teamatonce/project/project.module.ts`
- **Schema:** `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/database/schema.ts`
- **Fluxez Service:** `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/backend/src/modules/fluxez/fluxez.service.ts`

---

**Implementation Date:** October 24, 2025
**Status:** Production Ready
**Storage Provider:** Fluxez SDK
**Database:** PostgreSQL via Fluxez
