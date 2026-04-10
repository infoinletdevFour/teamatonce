# Project Files API - Quick Start Guide

## ✅ Implementation Complete

The Project Files API is **fully implemented** and **production-ready** with real Fluxez SDK storage integration.

## Quick Test

### 1. Start the Backend
```bash
cd backend
npm run dev
```

### 2. Get Auth Token
First, login to get your JWT token:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourpassword"
  }'
```

Save the `access_token` from the response.

### 3. Upload a File
```bash
curl -X POST \
  http://localhost:3001/api/v1/projects/YOUR_PROJECT_ID/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/file.pdf" \
  -F "description=Test upload" \
  -F "tags=[\"test\"]"
```

### 4. List Files
```bash
curl -X GET \
  "http://localhost:3001/api/v1/projects/YOUR_PROJECT_ID/files" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Download a File
```bash
curl -X GET \
  "http://localhost:3001/api/v1/projects/YOUR_PROJECT_ID/files/FILE_ID/download" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output downloaded-file.pdf
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects/:projectId/files` | List all project files |
| POST | `/api/v1/projects/:projectId/files/upload` | Upload a file |
| GET | `/api/v1/projects/:projectId/files/:fileId` | Get file details |
| GET | `/api/v1/projects/:projectId/files/:fileId/download` | Download file |
| GET | `/api/v1/projects/:projectId/files/:fileId/url` | Get signed URL |
| DELETE | `/api/v1/projects/:projectId/files/:fileId` | Delete file |
| POST | `/api/v1/projects/:projectId/files/:fileId/share` | Share with users |
| POST | `/api/v1/projects/:projectId/files/:fileId` | Update metadata |
| POST | `/api/v1/projects/:projectId/milestones/:milestoneId/deliverables/upload` | Upload deliverable |
| GET | `/api/v1/projects/:projectId/milestones/:milestoneId/files` | Get milestone files |
| GET | `/api/v1/projects/:projectId/milestones/:milestoneId/deliverables` | Get deliverables |

## Response Format (List Files)

```json
{
  "files": [
    {
      "id": "uuid-here",
      "name": "document.pdf",
      "size": 245632,
      "type": "application/pdf",
      "uploadedBy": {
        "id": "user-id",
        "name": "User"
      },
      "uploadedAt": "2025-10-24T00:00:00.000Z",
      "url": "https://storage.fluxez.com/..."
    }
  ],
  "total": 1
}
```

## Key Features

- ✅ Real file upload to Fluxez Storage
- ✅ File metadata stored in PostgreSQL
- ✅ Automatic file type detection
- ✅ Download with proper content types
- ✅ Signed URLs for temporary access
- ✅ File sharing and permissions
- ✅ Milestone deliverable support
- ✅ Soft delete (files marked deleted, not removed)
- ✅ Search and filtering
- ✅ Pagination support

## Storage Details

- **Storage Provider:** Fluxez SDK
- **Bucket:** `project-files`
- **Path Pattern:** `{projectId}/{timestamp}-{filename}`
- **Deliverables Path:** `{projectId}/milestones/{milestoneId}/{timestamp}-{filename}`

## File Types Supported

All file types are supported. Files are automatically categorized as:
- `document` - PDFs, docs, text files
- `image` - JPEG, PNG, GIF, etc.
- `video` - MP4, AVI, MOV, etc.
- `audio` - MP3, WAV, AAC, etc.
- `code` - JS, TS, Python, etc.
- `archive` - ZIP, RAR, TAR, etc.
- `other` - Everything else

## Security

- All endpoints require JWT authentication
- Files are accessible to:
  - Project owner (client)
  - Assigned team members
  - Explicitly shared users
- Soft delete prevents data loss

## Next Steps

1. Test file upload with your actual files
2. Integrate with frontend file upload component
3. Test download functionality
4. Implement file preview (if needed)
5. Add file thumbnail generation (optional)

## Documentation

For complete documentation, see:
- **Full API Documentation:** `PROJECT_FILES_API_IMPLEMENTATION.md`
- **Source Code:**
  - Service: `src/modules/teamatonce/project/project.service.ts`
  - Controller: `src/modules/teamatonce/project/file.controller.ts`
  - DTOs: `src/modules/teamatonce/project/dto/file.dto.ts`

## Support

For issues or questions:
1. Check the error logs in the backend console
2. Verify your auth token is valid
3. Ensure the project ID exists
4. Check file size limits (if configured)

---

**Status:** ✅ Production Ready
**Last Updated:** October 24, 2025
