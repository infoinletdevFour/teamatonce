# Tasks API - Quick Reference

## Endpoint
```
GET /api/v1/projects/:projectId/tasks
```

## Headers
```
Authorization: Bearer {your_jwt_token}
```

## Response
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "status": "todo" | "in_progress" | "review" | "done",
      "assignee": {
        "id": "user_id",
        "name": "John Doe",
        "avatar": "/path/to/avatar.png"
      },
      "dueDate": "2025-11-01T00:00:00Z",
      "priority": "low" | "medium" | "high" | "urgent",
      "createdAt": "2025-10-24T00:00:00Z",
      "updatedAt": "2025-10-24T12:00:00Z"
    }
  ]
}
```

## Example Request (cURL)
```bash
curl -X GET \
  http://localhost:3001/api/v1/projects/550e8400-e29b-41d4-a716-446655440000/tasks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Example Request (JavaScript/Fetch)
```javascript
const response = await fetch(
  `http://localhost:3001/api/v1/projects/${projectId}/tasks`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
const data = await response.json();
console.log(data.tasks);
```

## Example Request (Axios)
```javascript
const { data } = await axios.get(
  `/api/v1/projects/${projectId}/tasks`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
console.log(data.tasks);
```

## Key Features
- ✅ Real database queries (NO dummy data)
- ✅ Enriched assignee information from team_members table
- ✅ Sorted by creation date (newest first)
- ✅ Handles unassigned tasks (assignee = null)
- ✅ JWT authentication required
- ✅ Returns 404 if project not found

## Alternative Endpoint (with filters)
```
GET /api/v1/projects/:projectId/tasks/filtered?status=in_progress&priority=high
```

### Query Parameters
- `milestoneId` - Filter by milestone
- `assignedTo` - Filter by user ID
- `status` - Filter by status (todo, in_progress, review, done)
- `priority` - Filter by priority (low, medium, high, urgent)

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Project with ID {projectId} not found"
}
```

## Database Tables Used
1. `project_tasks` - Main task data
2. `team_members` - Assignee information
3. `projects` - Project verification

## Implementation Location
- **Service:** `/backend/src/modules/teamatonce/project/project.service.ts`
- **Controller:** `/backend/src/modules/teamatonce/project/project.controller.ts`
- **DTOs:** `/backend/src/modules/teamatonce/project/dto/project.dto.ts`
- **Schema:** `/backend/src/database/schema.ts`
