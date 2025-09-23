import OpenAI from 'openai';
import { TaskData } from '@/service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
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
async function getContextByTeamAndProject(
  projectDescription: string, 
  teamDescription: string, 
  tasksTable: TaskData[]
): Promise<string> {

  //   const tasksTable = `
// | Task | Assignee | Due Date | Priority | Status | Notes |
// |------|----------|----------|----------|--------|-------|
// | Setup Nginx gateway | Loc | 2025-09-25 | High | In Progress | 80% done |
// | Build booking API | Alice | 2025-09-27 | High | Not Started | Waiting for DB schema |
// | Design DB schema | Bob | 2025-09-23 | High | Completed | Reviewed by backend team |
// | Implement caching layer | Carol | 2025-09-28 | Medium | In Progress | Redis container running |
//   `;
  const prompt = `
Generate a structured progress report based on the provided project context and task details.

### Project Context
${projectDescription}

### Team Context
${teamDescription}

### Task Details
${JSON.stringify(tasksTable, null, 2)}

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

export async function generateProjectSummary(
  teamId: string,
  projectId: string,
  projectDescription: string,
  teamDescription: string,
  tasksTable: TaskData[]
): Promise<SummaryResponse> {
  try {
    // Validate required parameters
    if (!teamId) {
      return {
        status: 'error',
        errorCode: 'MISSING_TEAM_ID',
        message: 'teamId parameter is required',
        data: null
      };
    }

    if (!projectId) {
      return {
        status: 'error',
        errorCode: 'MISSING_PROJECT_ID',
        message: 'projectId parameter is required',
        data: null
      };
    }

    // Get context from parameters
    const contextText = await getContextByTeamAndProject(
      projectDescription, 
      teamDescription, 
      tasksTable
    );

    if (!contextText || contextText.trim().length === 0) {
      return {
        status: 'error',
        errorCode: 'NO_CONTENT_FOUND',
        message: 'No content found for the specified team and project',
        data: null
      };
    }

    if (contextText.length < 50) {
      return {
        status: 'error',
        errorCode: 'INSUFFICIENT_CONTENT',
        message: 'Content too short to summarize (minimum 50 characters)',
        data: null
      };
    }

    // Generate summary using OpenAI
    const prompt = `Please summarize the following project content in approximately 300-400 words. Focus on the main points, key features, and important information:\n\n${contextText}`;

    const completion = await openai.chat.completions.create({
      // model: "gpt-3.5-turbo",
      model: "gemini-2.5-flash",
      reasoning_effort: "low",
      // model: "wedjat/gpt-120b-oss"
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
      return {
        status: 'error',
        errorCode: 'SUMMARY_GENERATION_FAILED',
        message: 'Failed to generate summary',
        data: null
      };
    }

    return {
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

  } catch (error) {
    console.error('Error in generateProjectSummary:', error);
    return {
      status: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
      data: null
    };
  }
}