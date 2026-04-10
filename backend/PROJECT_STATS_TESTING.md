# Testing the Project Stats API Endpoint

## Quick Test Guide

### Prerequisites
1. Backend server running on `http://localhost:3001`
2. Valid JWT authentication token
3. At least one project in the database

### Method 1: Using cURL

```bash
# Replace {PROJECT_ID} with an actual project ID
# Replace {YOUR_JWT_TOKEN} with your authentication token

curl -X GET \
  http://localhost:3001/api/v1/projects/{PROJECT_ID}/stats \
  -H 'Authorization: Bearer {YOUR_JWT_TOKEN}' \
  -H 'Content-Type: application/json'
```

**Expected Response:**
```json
{
  "totalTasks": 45,
  "completedTasks": 32,
  "inProgressTasks": 8,
  "totalMilestones": 6,
  "completedMilestones": 4,
  "completionPercentage": 67,
  "teamMembers": 5,
  "filesCount": 23,
  "budgetSpent": 25000.00,
  "totalBudget": 40000.00
}
```

### Method 2: Using Postman

1. **Create a new GET request:**
   - URL: `http://localhost:3001/api/v1/projects/{PROJECT_ID}/stats`
   - Method: GET

2. **Add Authorization Header:**
   - Go to "Headers" tab
   - Add: `Authorization: Bearer {YOUR_JWT_TOKEN}`

3. **Send the request**

4. **Verify the response structure matches the expected format**

### Method 3: Using Thunder Client (VS Code)

1. Install Thunder Client extension in VS Code
2. Create new request
3. Set URL: `http://localhost:3001/api/v1/projects/{PROJECT_ID}/stats`
4. Add Auth header: `Bearer {YOUR_JWT_TOKEN}`
5. Send request

### Method 4: Using JavaScript/TypeScript

```typescript
async function getProjectStats(projectId: string, token: string) {
  const response = await fetch(
    `http://localhost:3001/api/v1/projects/${projectId}/stats`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const stats = await response.json();
  return stats;
}

// Usage
const stats = await getProjectStats('your-project-id', 'your-jwt-token');
console.log('Project Stats:', stats);
console.log(`Completion: ${stats.completionPercentage}%`);
console.log(`Tasks: ${stats.completedTasks}/${stats.totalTasks}`);
```

### Method 5: Testing via Swagger UI

1. Open browser: `http://localhost:3001/api`
2. Find the "Projects" section
3. Locate the `GET /projects/{id}/stats` endpoint
4. Click "Try it out"
5. Enter your project ID
6. Click "Authorize" and enter your JWT token
7. Click "Execute"

## Test Scenarios

### Scenario 1: Empty Project (No Tasks/Milestones)

**Expected Result:**
```json
{
  "totalTasks": 0,
  "completedTasks": 0,
  "inProgressTasks": 0,
  "totalMilestones": 0,
  "completedMilestones": 0,
  "completionPercentage": 0,
  "teamMembers": 0,
  "filesCount": 0,
  "budgetSpent": 0,
  "totalBudget": 0
}
```

### Scenario 2: Project with Tasks but No Milestones

**Setup:**
- Create 10 tasks (5 completed, 3 in progress, 2 todo)

**Expected Result:**
```json
{
  "totalTasks": 10,
  "completedTasks": 5,
  "inProgressTasks": 3,
  "totalMilestones": 0,
  "completedMilestones": 0,
  "completionPercentage": 0,
  "teamMembers": 0,
  "filesCount": 0,
  "budgetSpent": 0,
  "totalBudget": 5000
}
```

### Scenario 3: Fully Completed Project

**Setup:**
- All tasks completed
- All milestones completed/approved
- All milestone payments made

**Expected Result:**
```json
{
  "totalTasks": 20,
  "completedTasks": 20,
  "inProgressTasks": 0,
  "totalMilestones": 5,
  "completedMilestones": 5,
  "completionPercentage": 100,
  "teamMembers": 5,
  "filesCount": 15,
  "budgetSpent": 50000,
  "totalBudget": 50000
}
```

### Scenario 4: In-Progress Project

**Setup:**
- Mixed task statuses
- Some milestones completed
- Team assigned
- Files uploaded

**Expected Result:**
```json
{
  "totalTasks": 35,
  "completedTasks": 20,
  "inProgressTasks": 10,
  "totalMilestones": 6,
  "completedMilestones": 3,
  "completionPercentage": 50,
  "teamMembers": 4,
  "filesCount": 12,
  "budgetSpent": 15000,
  "totalBudget": 30000
}
```

## Verification Checklist

- [ ] Endpoint returns 200 OK status
- [ ] Response contains all required fields
- [ ] All numeric fields are numbers (not strings)
- [ ] `completionPercentage` is between 0-100
- [ ] `completedTasks` <= `totalTasks`
- [ ] `inProgressTasks` <= `totalTasks`
- [ ] `completedMilestones` <= `totalMilestones`
- [ ] `budgetSpent` <= `totalBudget`
- [ ] Values reflect actual database data
- [ ] No hardcoded or dummy values returned

## Error Cases to Test

### 1. Invalid Project ID
```bash
curl -X GET \
  http://localhost:3001/api/v1/projects/invalid-id/stats \
  -H 'Authorization: Bearer {TOKEN}'
```
**Expected:** 404 Not Found

### 2. Missing Authentication
```bash
curl -X GET \
  http://localhost:3001/api/v1/projects/{PROJECT_ID}/stats
```
**Expected:** 401 Unauthorized

### 3. Non-existent Project
```bash
curl -X GET \
  http://localhost:3001/api/v1/projects/00000000-0000-0000-0000-000000000000/stats \
  -H 'Authorization: Bearer {TOKEN}'
```
**Expected:** 404 Not Found with message "Project with ID ... not found"

## Database Verification

To verify the stats are calculated correctly, run these SQL queries:

```sql
-- Verify task counts
SELECT
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks
FROM project_tasks
WHERE project_id = 'YOUR_PROJECT_ID';

-- Verify milestone counts
SELECT
  COUNT(*) as total_milestones,
  COUNT(CASE WHEN status IN ('completed', 'approved') THEN 1 END) as completed_milestones
FROM project_milestones
WHERE project_id = 'YOUR_PROJECT_ID';

-- Verify team members count
SELECT COUNT(*) as team_members
FROM project_team_assignments
WHERE project_id = 'YOUR_PROJECT_ID'
  AND is_active = true;

-- Verify files count
SELECT COUNT(*) as files_count
FROM project_files
WHERE project_id = 'YOUR_PROJECT_ID'
  AND deleted_at IS NULL;

-- Verify budget spent
SELECT SUM(milestone_amount) as budget_spent
FROM project_milestones
WHERE project_id = 'YOUR_PROJECT_ID'
  AND payment_status = 'paid';

-- Verify total budget
SELECT estimated_cost as total_budget
FROM projects
WHERE id = 'YOUR_PROJECT_ID';
```

## Performance Testing

Test with different data volumes:

1. **Small Project:** 10 tasks, 3 milestones, 2 team members
2. **Medium Project:** 50 tasks, 10 milestones, 5 team members
3. **Large Project:** 200 tasks, 20 milestones, 15 team members

Monitor response times:
- Small: < 100ms
- Medium: < 200ms
- Large: < 500ms

## Integration Testing

### Frontend Integration Example

```typescript
import { useEffect, useState } from 'react';

function ProjectDashboard({ projectId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(
          `/api/v1/projects/${projectId}/stats`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [projectId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h2>Project Statistics</h2>
      <p>Completion: {stats.completionPercentage}%</p>
      <p>Tasks: {stats.completedTasks} / {stats.totalTasks}</p>
      <p>Team: {stats.teamMembers} members</p>
      <p>Budget: ${stats.budgetSpent} / ${stats.totalBudget}</p>
    </div>
  );
}
```

## Automated Test Script

```bash
#!/bin/bash

# Configuration
API_URL="http://localhost:3001/api/v1"
TOKEN="your-jwt-token"
PROJECT_ID="your-project-id"

# Test endpoint
echo "Testing Project Stats API..."
response=$(curl -s -w "\n%{http_code}" \
  -X GET \
  "${API_URL}/projects/${PROJECT_ID}/stats" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

# Extract response and status code
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

# Check status code
if [ "$http_code" -eq 200 ]; then
  echo "✅ Status: 200 OK"
  echo "Response:"
  echo "$body" | jq '.'
else
  echo "❌ Status: $http_code"
  echo "Error:"
  echo "$body"
  exit 1
fi

# Validate response structure
required_fields=("totalTasks" "completedTasks" "inProgressTasks" "totalMilestones" "completedMilestones" "completionPercentage" "teamMembers" "filesCount" "budgetSpent" "totalBudget")

for field in "${required_fields[@]}"; do
  if echo "$body" | jq -e ".$field" > /dev/null 2>&1; then
    echo "✅ Field '$field' exists"
  else
    echo "❌ Field '$field' missing"
    exit 1
  fi
done

echo "✅ All tests passed!"
```

## Conclusion

The Project Stats API endpoint is now fully functional and ready for integration with the frontend. All statistics are calculated from real database queries with no hardcoded data.
