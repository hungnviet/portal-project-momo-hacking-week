import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SummaryResponse {
  status: 'success' | 'error';
  errorCode?: string;
  message: string;
  data: {
    summary: string;
    originalLength: number;
    summaryLength: number;
    teamId: string;
    projectId: string;
  } | null;
}

// This function would fetch context based on teamId and projectId
// You'll need to implement this based on your database/data source
async function getContextByTeamAndProject(teamId: string, projectId: string): Promise<string> {
  // STEP 1: Fetch your actual data (replace placeholder with real fetching logic)
  // Example:
  // const project = await db.projects.findFirst({ where: { id: projectId, teamId } });
  // const tasks = await db.tasks.findMany({ where: { projectId } });
  // const team = await db.teams.findFirst({ where: { id: teamId } });

  const projectDescription = "Room Management System for internal scheduling. Focus: reliability, availability, security.";
  const teamDescription = "6-person team: 2 UI devs, 2 DB engineers, 2 backend engineers.";
  const tasksTable = `
| Task | Assignee | Due Date | Priority | Status | Notes |
|------|----------|----------|----------|--------|-------|
| Setup Nginx gateway | Loc | 2025-09-25 | High | In Progress | 80% done |
| Build booking API | Alice | 2025-09-27 | High | Not Started | Waiting for DB schema |
| Design DB schema | Bob | 2025-09-23 | High | Completed | Reviewed by backend team |
| Implement caching layer | Carol | 2025-09-28 | Medium | In Progress | Redis container running |
  `;

  // STEP 2: Build a single string with the prompt template
  const prompt = `
Generate a structured progress report based on the provided project context and task details.

### Project Context
${projectDescription}

### Team Context
${teamDescription}

### Task Details
${tasksTable}

### Requirements for Report
1. **Executive Summary** - 3-4 sentences summarizing project health (on-track, delayed, etc.).
2. **Completed Work** - Bullet points of tasks finished since last report.
3. **Ongoing Work** - Bullet points of tasks in progress, with percent complete if possible.
4. **Upcoming Work** - Next priorities or tasks due soon, ordered by priority.
5. **Blockers/Risks** - List anything causing delays or requiring escalation.
6. **Action Items** - Recommended actions for team or stakeholders.

Format the report in clear sections with headings, making it easy to scan quickly.
`;
  return prompt;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const projectId = searchParams.get('projectId');

    // Validate required parameters
    if (!teamId) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'MISSING_TEAM_ID',
        message: 'teamId parameter is required',
        data: null
      }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'MISSING_PROJECT_ID',
        message: 'projectId parameter is required',
        data: null
      }, { status: 400 });
    }

    // Get context from teamId and projectId
    const contextText = await getContextByTeamAndProject(teamId, projectId);

    if (!contextText || contextText.trim().length === 0) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'NO_CONTENT_FOUND',
        message: 'No content found for the specified team and project',
        data: null
      }, { status: 404 });
    }

    if (contextText.length < 50) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'INSUFFICIENT_CONTENT',
        message: 'Content too short to summarize (minimum 50 characters)',
        data: null
      }, { status: 400 });
    }

    // Generate summary using OpenAI
    const prompt = `Please summarize the following project content in approximately 150-200 words. Focus on the main points, key features, and important information:\n\n${contextText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an assistant that generates clear, concise, and actionable progress reports for project management. You summarize status updates, highlight blockers, and suggest next steps in a professional tone."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'SUMMARY_GENERATION_FAILED',
        message: 'Failed to generate summary',
        data: null
      }, { status: 500 });
    }

    const response: SummaryResponse = {
      status: 'success',
      message: 'Summary generated successfully',
      data: {
        summary: summary.trim(),
        originalLength: contextText.length,
        summaryLength: summary.trim().length,
        teamId,
        projectId,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/summarize:', error);
    return NextResponse.json({
      status: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}