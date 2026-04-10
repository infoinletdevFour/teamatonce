# Analytics API Quick Reference

## Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

## Project Analytics Endpoints

### 1. Get Project Analytics
```http
GET /analytics/projects/:projectId
```
**Response:** Comprehensive project metrics including tasks, progress, budget, efficiency

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/projects/abc-123
```

---

### 2. Get Project Timeline
```http
GET /analytics/projects/:projectId/timeline
```
**Response:** Gantt chart data with milestones and dates

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/projects/abc-123/timeline
```

---

### 3. Get Task Completion by Milestone
```http
GET /analytics/projects/:projectId/task-completion
```
**Response:** Task breakdown grouped by milestone with priority distribution

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/projects/abc-123/task-completion
```

---

### 4. Get Team Performance
```http
GET /analytics/projects/:projectId/team-performance
```
**Response:** Individual team member performance metrics

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/projects/abc-123/team-performance
```

---

### 5. Get Burndown Chart Data
```http
GET /analytics/projects/:projectId/burndown?milestoneId=xxx
```
**Query Parameters:**
- `milestoneId` (optional) - Filter to specific milestone

**Response:** Daily burndown data (ideal vs actual)

**Example:**
```bash
# Project-wide burndown
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/projects/abc-123/burndown

# Milestone-specific burndown
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/projects/abc-123/burndown?milestoneId=milestone-456
```

---

## Company Analytics Endpoints

### 6. Get Company Analytics (Current User)
```http
GET /analytics/company
```
**Response:** Company-wide metrics for current user's company

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/company
```

---

### 7. Get Company Analytics by ID
```http
GET /analytics/company/:companyId
```
**Response:** Company-wide metrics for specific company

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/company/company-789
```

---

### 8. Get Revenue by Month (Current User)
```http
GET /analytics/company/revenue?period=monthly&startDate=2024-01-01&endDate=2024-12-31
```
**Query Parameters:**
- `period` (optional) - monthly, quarterly, yearly (default: monthly)
- `startDate` (optional) - YYYY-MM-DD format
- `endDate` (optional) - YYYY-MM-DD format

**Response:** Monthly revenue, expenses, profit data

**Example:**
```bash
# Last 12 months (default)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/company/revenue

# Custom date range
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/analytics/company/revenue?period=monthly&startDate=2024-01-01&endDate=2024-06-30"
```

---

### 9. Get Revenue by Month (Specific Company)
```http
GET /analytics/company/:companyId/revenue?period=monthly&startDate=xxx&endDate=xxx
```
**Query Parameters:** Same as above

**Response:** Revenue data for specific company

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/analytics/company/company-789/revenue?period=quarterly"
```

---

### 10. Get Projects by Status (Current User)
```http
GET /analytics/company/projects-by-status
```
**Response:** Project distribution by status with counts and percentages

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/company/projects-by-status
```

---

### 11. Get Projects by Status (Specific Company)
```http
GET /analytics/company/:companyId/projects-by-status
```
**Response:** Project distribution for specific company

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/company/company-789/projects-by-status
```

---

### 12. Get Team Utilization (Current User)
```http
GET /analytics/company/team-utilization?startDate=2024-01-01&endDate=2024-12-31
```
**Query Parameters:**
- `startDate` (optional) - YYYY-MM-DD format
- `endDate` (optional) - YYYY-MM-DD format

**Response:** Team member utilization with project breakdown

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/analytics/company/team-utilization?startDate=2024-01-01"
```

---

### 13. Get Team Utilization (Specific Company)
```http
GET /analytics/company/:companyId/team-utilization?startDate=xxx&endDate=xxx
```
**Query Parameters:** Same as above

**Response:** Team utilization for specific company

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/analytics/company/company-789/team-utilization"
```

---

## Developer Analytics Endpoints

### 14. Get Developer Stats
```http
GET /analytics/developer/:userId
```
**Response:** Comprehensive developer statistics and performance metrics

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/analytics/developer/user-123
```

---

### 15. Get Hours Worked
```http
GET /analytics/developer/:userId/hours-worked?period=weekly&startDate=xxx&endDate=xxx
```
**Query Parameters:**
- `period` (optional) - daily, weekly, monthly (default: weekly)
- `startDate` (optional) - YYYY-MM-DD format
- `endDate` (optional) - YYYY-MM-DD format

**Response:** Time-series hours worked with project breakdown

**Example:**
```bash
# Last 30 days, weekly view
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/analytics/developer/user-123/hours-worked?period=weekly"

# Custom range, daily view
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/analytics/developer/user-123/hours-worked?period=daily&startDate=2024-01-01&endDate=2024-01-31"
```

---

### 16. Get Tasks Completed
```http
GET /analytics/developer/:userId/tasks-completed?period=weekly&startDate=xxx&endDate=xxx
```
**Query Parameters:** Same as hours-worked

**Response:** Task completion trends over time

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/analytics/developer/user-123/tasks-completed?period=weekly"
```

---

### 17. Get Performance Score
```http
GET /analytics/developer/:userId/performance-score?period=weekly&startDate=xxx&endDate=xxx
```
**Query Parameters:** Same as hours-worked

**Response:** Performance metrics over time with quality and speed scores

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/analytics/developer/user-123/performance-score?period=monthly"
```

---

## Response Examples

### Project Analytics Response
```json
{
  "projectId": "abc-123",
  "totalTasks": 50,
  "completedTasks": 30,
  "inProgressTasks": 15,
  "pendingTasks": 5,
  "overdueTasks": 2,
  "completionRate": 60.0,
  "averageTaskDuration": 3.5,
  "estimatedCompletion": "2024-12-31T00:00:00.000Z",
  "actualProgress": 65.5,
  "plannedProgress": 70.0,
  "teamEfficiency": 93.57,
  "budgetSpent": 45000,
  "budgetRemaining": 5000,
  "budgetTotal": 50000
}
```

### Timeline Event Response
```json
[
  {
    "id": "milestone-1",
    "name": "Project Planning",
    "type": "milestone",
    "startDate": "2024-01-01",
    "endDate": "2024-01-15",
    "progress": 100,
    "status": "completed"
  },
  {
    "id": "milestone-2",
    "name": "Development Phase",
    "type": "milestone",
    "startDate": "2024-01-16",
    "endDate": "2024-03-31",
    "progress": 65,
    "status": "in_progress"
  }
]
```

### Company Analytics Response
```json
{
  "totalProjects": 25,
  "activeProjects": 10,
  "completedProjects": 12,
  "onHoldProjects": 3,
  "totalRevenue": 1250000,
  "averageProjectValue": 50000,
  "clientSatisfaction": 92.5,
  "teamUtilization": 78.3,
  "projectSuccessRate": 85.0
}
```

### Developer Stats Response
```json
{
  "userId": "user-123",
  "totalTasksCompleted": 150,
  "totalHoursWorked": 320.5,
  "averageTaskCompletionTime": 4.2,
  "performanceScore": 88.5,
  "onTimeDeliveryRate": 92.0,
  "codeQualityScore": 95.5,
  "activeProjects": 3,
  "earnings": 24000
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Project not found",
  "error": "Not Found"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## Testing with cURL

### Set Environment Variables
```bash
export API_URL="http://localhost:3001"
export TOKEN="your-jwt-token-here"
```

### Test Project Analytics
```bash
# Get project analytics
curl -H "Authorization: Bearer $TOKEN" \
  $API_URL/analytics/projects/your-project-id

# Get timeline
curl -H "Authorization: Bearer $TOKEN" \
  $API_URL/analytics/projects/your-project-id/timeline

# Get task completion
curl -H "Authorization: Bearer $TOKEN" \
  $API_URL/analytics/projects/your-project-id/task-completion
```

### Test Company Analytics
```bash
# Get company analytics
curl -H "Authorization: Bearer $TOKEN" \
  $API_URL/analytics/company

# Get revenue data
curl -H "Authorization: Bearer $TOKEN" \
  "$API_URL/analytics/company/revenue?period=monthly"

# Get projects by status
curl -H "Authorization: Bearer $TOKEN" \
  $API_URL/analytics/company/projects-by-status
```

### Test Developer Analytics
```bash
# Get developer stats
curl -H "Authorization: Bearer $TOKEN" \
  $API_URL/analytics/developer/your-user-id

# Get hours worked
curl -H "Authorization: Bearer $TOKEN" \
  "$API_URL/analytics/developer/your-user-id/hours-worked?period=weekly"

# Get performance score
curl -H "Authorization: Bearer $TOKEN" \
  "$API_URL/analytics/developer/your-user-id/performance-score?period=monthly"
```

---

## Swagger Documentation

Access interactive API documentation at:
```
http://localhost:3001/api
```

All analytics endpoints are documented under the "analytics" tag with full parameter descriptions and example responses.
