# Milestone API - Quick Reference

## Endpoint Details

**URL:** `GET /api/v1/projects/:projectId/milestones`
**Authentication:** JWT Bearer Token (Required)
**Method:** GET

## Request

### Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### Path Parameters
- `projectId` (UUID): Project identifier

## Response

### Success (200 OK)
```json
{
  "milestones": [
    {
      "id": "uuid",
      "title": "Milestone Title",
      "description": "Milestone description",
      "status": "pending" | "in_progress" | "completed" | "approved",
      "dueDate": "ISO date" | null,
      "progress": 0-100,
      "amount": number | null,
      "deliverables": ["deliverable 1", "deliverable 2"],
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "milestoneType": "planning" | "design" | "development" | "testing" | "deployment" | "maintenance",
      "orderIndex": number,
      "paymentStatus": "pending" | "paid" | "overdue"
    }
  ]
}
```

### Error Responses

**404 Not Found** - Project doesn't exist
```json
{
  "statusCode": 404,
  "message": "Project with ID {projectId} not found",
  "error": "Not Found"
}
```

**401 Unauthorized** - Missing or invalid JWT token
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Key Features

✅ **Real Database Queries** - Fetches actual data from PostgreSQL
✅ **Smart Progress Calculation** - Automatically calculates based on task completion
✅ **Ordered Results** - Sorted by milestone order index
✅ **Type Safe** - Full TypeScript support with DTOs
✅ **Well Documented** - Swagger/OpenAPI integration

## Progress Calculation

The `progress` field is automatically calculated using:
- **Formula:** `(completed_tasks / total_tasks) * 100`
- **Range:** 0-100
- **No Tasks:** Returns 0
- **Completed Task Status:** Tasks with status = "done"

## Testing with cURL

```bash
curl -X GET \
  'http://localhost:3001/api/v1/projects/YOUR_PROJECT_ID/milestones' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Testing with Postman

1. Create new GET request
2. URL: `{{base_url}}/api/v1/projects/{{projectId}}/milestones`
3. Authorization → Bearer Token → Paste JWT
4. Send

## Code Example (Frontend)

```typescript
// Using fetch
async function getProjectMilestones(projectId: string, token: string) {
  const response = await fetch(
    `${API_URL}/api/v1/projects/${projectId}/milestones`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.milestones;
}

// Using axios
import axios from 'axios';

async function getProjectMilestones(projectId: string, token: string) {
  const { data } = await axios.get(
    `${API_URL}/api/v1/projects/${projectId}/milestones`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return data.milestones;
}
```

## TypeScript Types

```typescript
export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  dueDate: string | null;
  progress: number;
  amount: number | null;
  deliverables: string[];
  createdAt: string;
  updatedAt: string;
  milestoneType?: string;
  orderIndex?: number;
  paymentStatus?: string;
}

export interface MilestonesResponse {
  milestones: Milestone[];
}
```

## Related Endpoints

- `POST /api/v1/projects/:id/milestones` - Create new milestone
- `GET /api/v1/projects/milestones/:milestoneId` - Get single milestone
- `PUT /api/v1/projects/milestones/:milestoneId/status` - Update milestone status
- `PUT /api/v1/projects/milestones/:milestoneId/approve` - Approve milestone

## Database Tables Used

- `project_milestones` - Main milestone data
- `project_tasks` - For progress calculation
- `projects` - Project validation

## Important Notes

- Milestones are ordered by `orderIndex` in ascending order
- Progress is calculated in real-time on each request
- JSONB fields (deliverables) are automatically parsed
- Returns empty array if project has no milestones
- All dates are in ISO 8601 format
