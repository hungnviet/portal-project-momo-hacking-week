import OpenAI from 'openai';
import { TaskData } from '@/service';
import { convertTicketsToMarkdown } from "@/utils/preprocess_context"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
});

async function getContextByTeamAndProject(
  projectDescription: string,
  teamDescription: string,
  tasksTable: TaskData[]
): Promise<string> {

  const tasksTable_modified = await convertTicketsToMarkdown(tasksTable);
  const prompt = `
Generate a structured progress report based on the provided project context and task details.

### Project Context
${projectDescription}

### Team Context
${teamDescription}

### Task Details
${tasksTable_modified}

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
  projectDescription: string,
  teamDescription: string,
  tasksTable: TaskData[]
): Promise<string> {
  try {
    // Get context from parameters
    const contextText = await getContextByTeamAndProject(
      projectDescription,
      teamDescription,
      tasksTable
    );

    if (!contextText || contextText.trim().length === 0) {
      throw new Error('No content found for the specified team and project');
    }

    if (contextText.length < 50) {
      throw new Error('Content too short to summarize (minimum 50 characters)');
    }

    // Generate summary using OpenAI
    const prompt = `Please summarize the following project content in approximately 150-200 words. Focus on the main points, key features, and important information:\n\n${contextText}`;

    const completion = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
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
      throw new Error('Failed to generate summary');
    }

    return summary.trim();

    return `Có key hong mà đòi ra kết quả
      ${projectDescription}\n
      ${teamDescription}\n
      ${JSON.stringify(tasksTable, null, 2)}
    `;
  } catch (error) {    console.error('Error in generateProjectSummary:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { projectDescription, teamDescription, tasksTable } = await request.json();

    if (!projectDescription || !teamDescription || !tasksTable) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: projectDescription, teamDescription, tasksTable' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const summary = await generateProjectSummary(projectDescription, teamDescription, tasksTable);

    return new Response(
      JSON.stringify({ summary }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in POST /api/summarize:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate summary' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}