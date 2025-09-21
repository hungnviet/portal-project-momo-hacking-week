# BU Project Portal

A project management portal for Business Unit teams to manage projects with contributions from multiple teams (Technology, Media, Design, etc.). The portal allows monitoring task progress through Jira tickets and spreadsheet rows.

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Homepage - shows all projects
│   ├── [project_name]/           # Dynamic project routes
│   │   ├── page.tsx              # Project detail page
│   │   └── [team_name]/          # Dynamic team routes
│   │       └── page.tsx          # Team detail page with tickets
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── CreateProjectPopup.tsx    # Modal for creating new projects
│   ├── ProjectCard.tsx           # Project card for homepage grid
│   ├── ProjectProgress.tsx       # Progress bar component
│   ├── TeamSection.tsx           # Team section in project detail
│   ├── ProjectComments.tsx       # Comments section
│   ├── TeamHeader.tsx            # Team page header
│   └── TicketCard.tsx            # Individual ticket/task card
└── types/                        # TypeScript type definitions
    └── index.ts                  # Shared interfaces and types
```

## Pages Overview

### 1. Homepage (`/`)

- **Purpose**: Display all BU projects in a grid layout
- **Features**:
  - Project cards showing name, description, progress, status, and teams
  - "Create New Project" button that opens a modal popup
  - Click on any project card to navigate to project detail page

### 2. Project Detail Page (`/[project_name]`)

- **Purpose**: Show comprehensive information about a specific project
- **Features**:
  - Project header with name, description, dates, owner, and overall progress
  - Team sections showing each contributing team's progress and status
  - Comments section for project discussions
  - Click on team sections to navigate to team detail pages

### 3. Team Detail Page (`/[project_name]/[team_name]`)

- **Purpose**: Display tasks and tickets for a specific team within a project
- **Features**:
  - Team header with progress and status information
  - List of tickets/tasks from both Jira and spreadsheets
  - Click on tickets to open them in Jira or Google Sheets
  - Visual distinction between Jira tickets and spreadsheet rows

## Key Features

### Multi-Source Task Tracking

- **Jira Integration**: Display tickets from Jira with direct links
- **Spreadsheet Integration**: Show tasks from Google Sheets with row references
- **Unified View**: Both types of tasks displayed in consistent format

### Project Management

- **Create Projects**: Modal popup for adding new projects with team selection
- **Progress Monitoring**: Visual progress bars and status indicators
- **Team Collaboration**: Comments system for project communication

### Navigation Flow

```
Homepage → Project Detail → Team Detail
    ↓           ↓              ↓
All Projects → Specific     → Team Tasks
              Project Info     & Tickets
```

## Component Descriptions

### Core Components

- **CreateProjectPopup**: Form modal for creating new projects with team selection
- **ProjectCard**: Clickable card showing project summary and progress
- **ProjectProgress**: Reusable progress bar component
- **TeamSection**: Interactive team summary with click-to-navigate functionality
- **ProjectComments**: Comment system with add/view functionality
- **TeamHeader**: Team page header with progress and status information
- **TicketCard**: Individual task/ticket display with external links

### Data Flow

- Mock data is currently used for demonstration
- Real implementation would integrate with:
  - Jira API for ticket data
  - Google Sheets API for spreadsheet data
  - Backend API for project management

## Technologies Used

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React** for component-based architecture

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view the application

## Future Enhancements

- Jira API integration
- Google Sheets API integration
- User authentication and authorization
- Real-time updates and notifications
- Advanced filtering and search functionality
- Export capabilities for reports
