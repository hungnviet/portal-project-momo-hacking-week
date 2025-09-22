# Database Schema Issues and Corrections

## Issues Found in Your Schema

### 1. Task Table Issue

Your current schema has a problem:

```sql
CREATE TABLE public.Task (
  teamId bigint GENERATED ALWAYS AS IDENTITY NOT NULL,  -- ❌ PROBLEM
  taskId bigint NOT NULL,
  url text,
  projectId bigint,
  CONSTRAINT Task_pkey PRIMARY KEY (taskId),
  CONSTRAINT ProjectTask_teamId_fkey FOREIGN KEY (teamId) REFERENCES public.Team(id),
  CONSTRAINT TeamTask_projectId_fkey FOREIGN KEY (projectId) REFERENCES public.Project(id)
);
```

**Problem**: `teamId` cannot be both `GENERATED ALWAYS AS IDENTITY` and a foreign key to Team(id).

### Corrected Schema

```sql
CREATE TABLE public.Task (
  taskId bigint GENERATED ALWAYS AS IDENTITY NOT NULL,  -- ✅ Auto-increment primary key
  teamId bigint NOT NULL,                              -- ✅ Foreign key to Team
  projectId bigint NOT NULL,                           -- ✅ Foreign key to Project
  url text NOT NULL,
  CONSTRAINT Task_pkey PRIMARY KEY (taskId),
  CONSTRAINT Task_teamId_fkey FOREIGN KEY (teamId) REFERENCES public.Team(id),
  CONSTRAINT Task_projectId_fkey FOREIGN KEY (projectId) REFERENCES public.Project(id)
);
```

## API Updates Made

I've updated all the APIs to match your actual schema structure:

### Table Name Changes

- `Teams` → `Team` (singular)
- Column names use snake_case in database but APIs handle conversion

### Column Name Corrections

- `Teams_Projects.teamId` → `Teams_Projects.team_id`
- `Teams_Projects.projectId` → `Teams_Projects.project_id`
- `Comment.projectId` → `Comment.projectid` (lowercase)

### Foreign Key Relationships Fixed

- Updated all Supabase queries to use correct table and column names
- Fixed JOIN syntax for Supabase client

## Required Database Migration

If you need to fix your Task table, run this migration:

```sql
-- Drop existing constraints
ALTER TABLE public.Task DROP CONSTRAINT IF EXISTS ProjectTask_teamId_fkey;
ALTER TABLE public.Task DROP CONSTRAINT IF EXISTS TeamTask_projectId_fkey;

-- Drop and recreate the table with correct structure
DROP TABLE IF EXISTS public.Task;

CREATE TABLE public.Task (
  taskId bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  teamId bigint NOT NULL,
  projectId bigint NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Task_pkey PRIMARY KEY (taskId),
  CONSTRAINT Task_teamId_fkey FOREIGN KEY (teamId) REFERENCES public.Team(id) ON DELETE CASCADE,
  CONSTRAINT Task_projectId_fkey FOREIGN KEY (projectId) REFERENCES public.Project(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_task_team_project ON public.Task(teamId, projectId);
CREATE INDEX idx_task_project ON public.Task(projectId);
```

## API Endpoints Status

All APIs have been updated to match your schema:

✅ **GET /api/projects** - Fixed table names and column references
✅ **POST /api/project** - Fixed team creation and relationship insertion  
✅ **GET /api/project** - Fixed comment and team queries
✅ **GET /api/team** - Fixed table names and column references
✅ **POST /api/task** - Fixed validation queries (Note: May need Task table fix)
✅ **POST /api/comment** - Fixed projectid column reference

## Testing Recommendations

1. **Fix your Supabase environment variables first**:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://djclkgepeokjoexmownp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

2. **Test APIs in this order**:

   - GET /api/projects (basic read test)
   - POST /api/project (create test)
   - GET /api/project?projectId=1 (detailed read test)
   - POST /api/comment?projectId=1 (comment test)

3. **For Task API testing**, you may need to fix the Task table schema first.

## Current API Compatibility

The APIs are now compatible with your current schema except for the Task table issue. If you can't modify the Task table immediately, I can create a workaround API that works with your current structure.
