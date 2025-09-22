# API Documentation

This document describes all the API endpoints available in the BU Project Portal.

## Base URL

All API endpoints are relative to: `http://localhost:3000/api`

## Response Format

All API responses follow this standard format:

```json
{
  "status": "success" | "error",
  "message": "Description of the result",
  "errorCode": null | "ERROR_CODE",
  "data": null | {...}
}
```

## Endpoints

### 1. Get List of Portal Projects

**GET** `/api/projects`

**Query Parameters:**

- `PODomain` (optional): Filter projects by PO domain

**Response:**

```json
{
  "status": "success",
  "message": "Projects retrieved successfully",
  "errorCode": null,
  "data": [
    {
      "projectId": 1,
      "projectName": "Mobile App Redesign",
      "projectDesc": "Complete redesign of mobile application",
      "status": "In Progress",
      "progress": 65,
      "teamNameList": ["Technology", "Media", "Design"]
    }
  ]
}
```

**Usage:** Homepage to display all BU team projects

---

### 2. Create New Portal Project

**POST** `/api/project`

**Request Body:**

```json
{
  "projectName": "New Project",
  "projectDesc": "Project description",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "teams": [
    {
      "teamName": "Technology",
      "teamDesc": "Development team responsibilities",
      "PODomain": "tech-po@company.com"
    }
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "errorCode": null,
  "message": "Project created successfully",
  "data": {
    "projectId": 1,
    "projectName": "New Project",
    "teams": [
      {
        "teamId": 1,
        "teamName": "Technology"
      }
    ]
  }
}
```

**Usage:** BU PO creates a new project

---

### 3. Load Project Detail Information

**GET** `/api/project?projectId={id}`

**Query Parameters:**

- `projectId` (required): Project ID

**Response:**

```json
{
  "status": "success",
  "errorCode": null,
  "message": "Project details retrieved successfully",
  "data": {
    "projectId": 1,
    "projectName": "Mobile App Redesign",
    "projectDesc": "Complete redesign description",
    "status": "In Progress",
    "progress": 65,
    "comments": [
      {
        "id": 1,
        "comment": "Project update",
        "user": "user@company.com",
        "created_at": "2024-02-15T10:30:00Z"
      }
    ],
    "teamList": [
      {
        "teamId": 1,
        "teamName": "Technology",
        "teamDesc": "Development responsibilities",
        "teamProgress": 70,
        "teamPODomain": "tech-po@company.com"
      }
    ]
  }
}
```

**Usage:** Project detail page to show project-level information

---

### 4. Load Team Detail Information

**GET** `/api/team?teamId={teamId}&projectId={projectId}`

**Query Parameters:**

- `teamId` (required): Team ID
- `projectId` (required): Project ID

**Response:**

```json
{
  "status": "success",
  "errorCode": null,
  "message": "Team details retrieved successfully",
  "data": {
    "teamId": 1,
    "teamDesc": "Development team responsibilities",
    "assignee": "tech-po@company.com",
    "progress": 70,
    "taskList": [
      {
        "type": "jiraTicket",
        "url": "https://company.atlassian.net/browse/PROJ-123",
        "taskDesc": "Implement user authentication",
        "taskStatus": "In Progress",
        "taskAssignee": "John Doe"
      },
      {
        "type": "rowSheet",
        "url": "https://docs.google.com/spreadsheets/d/abc123",
        "taskDesc": "Database schema design",
        "taskStatus": "Completed",
        "taskAssignee": "Jane Smith"
      }
    ]
  }
}
```

**Usage:** Team detail page to show team's tasks from Jira and Google Sheets

---

### 5. Add Jira Ticket or Sheet Row URLs

**POST** `/api/task?teamId={teamId}&projectId={projectId}`

**Query Parameters:**

- `teamId` (required): Team ID
- `projectId` (required): Project ID

**Request Body:**

```json
{
  "type": "jiraTicket" | "rowSheet",
  "listUrl": [
    "https://company.atlassian.net/browse/PROJ-123",
    "https://company.atlassian.net/browse/PROJ-124"
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "errorCode": null,
  "message": "Successfully added 2 task(s)",
  "data": {
    "insertedCount": 2,
    "taskIds": [1, 2]
  }
}
```

**Usage:** Team PO adds links to their tasks for BU PO monitoring

---

### 6. Add Comment

**POST** `/api/comment?projectId={projectId}`

**Query Parameters:**

- `projectId` (required): Project ID

**Request Body:**

```json
{
  "time": "2024-02-15T10:30:00Z",
  "userDomain": "user@company.com",
  "content": "Project update comment"
}
```

**Response:**

```json
{
  "status": "success",
  "errorCode": null,
  "message": "Comment added successfully",
  "data": {
    "commentId": 1,
    "projectId": 1,
    "content": "Project update comment",
    "user": "user@company.com",
    "createdAt": "2024-02-15T10:30:00Z"
  }
}
```

**Usage:** Add comments to project discussions

---

### 7. Get Comments (Bonus endpoint)

**GET** `/api/comment?projectId={projectId}`

**Query Parameters:**

- `projectId` (required): Project ID

**Response:**

```json
{
  "status": "success",
  "errorCode": null,
  "message": "Comments retrieved successfully",
  "data": [
    {
      "id": 1,
      "projectId": 1,
      "comment": "Project update",
      "user": "user@company.com",
      "created_at": "2024-02-15T10:30:00Z"
    }
  ]
}
```

## Database Schema

### Tables

1. **Project**

   - `id` (Primary Key)
   - `name`
   - `description`
   - `start_date`
   - `end_date`

2. **Teams**

   - `id` (Primary Key)
   - `name`
   - `assignee` (PO domain)
   - `type` (0: sheet, 1: jira)

3. **Teams_Projects**

   - `teamId` (Foreign Key)
   - `projectId` (Foreign Key)
   - `description`

4. **Task**

   - `taskId` (Primary Key)
   - `teamId` (Foreign Key)
   - `projectId` (Foreign Key)
   - `url`

5. **Comment**
   - `id` (Primary Key)
   - `projectId` (Foreign Key)
   - `comment`
   - `user`
   - `created_at`

## External Integrations

### Jira Integration

The system fetches task details from Jira using the Jira REST API v3:

- Endpoint: `{JIRA_BASE_URL}/rest/api/3/issue/{ticketKey}`
- Authentication: Basic Auth with email and API token
- Returns: Task summary, status, assignee, priority, due date

### Google Sheets Integration

The system fetches row data from Google Sheets using the Sheets API v4:

- Endpoint: `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}`
- Authentication: API Key
- Returns: Task data from specified rows and columns

## Error Codes

- `VALIDATION_ERROR`: Missing or invalid request parameters
- `NOT_FOUND`: Requested resource not found
- `DB_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error
- `NO_VALID_TASKS`: No valid tasks to process

## Environment Variables

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
JIRA_BASE_URL=your_jira_base_url
JIRA_AUTH_TOKEN=base64_encoded_email_and_token
GOOGLE_SHEETS_API_KEY=your_google_api_key
```

## Installation

1. Install required packages:

```bash
npm install @supabase/supabase-js
```

2. Set up environment variables in `.env.local`

3. Configure Supabase database with the required tables

4. Set up Jira API access with appropriate permissions

5. Enable Google Sheets API and obtain API key

## Usage Examples

### Frontend Integration

```typescript
// Fetch projects
const response = await fetch("/api/projects");
const { data } = await response.json();

// Create project
const response = await fetch("/api/project", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(projectData),
});

// Add tasks
const response = await fetch(`/api/task?teamId=1&projectId=1`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "jiraTicket", listUrl: ["..."] }),
});
```
