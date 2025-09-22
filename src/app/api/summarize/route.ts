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
  // TODO: Replace this with your actual data fetching logic
  // Example implementations:
  
  // Option 1: Database query
  // const context = await db.projects.findFirst({
  //   where: { teamId, projectId },
  //   select: { content: true, description: true, notes: true }
  // });
  // return context ? `${context.content} ${context.description} ${context.notes}` : '';
  
  // Option 2: API call to another service
  // const response = await fetch(`${process.env.API_BASE_URL}/teams/${teamId}/projects/${projectId}`);
  // const data = await response.json();
  // return data.content || '';
  
  // Placeholder implementation
  return `This is placeholder context for team ${teamId} and project ${projectId}. Replace this function with your actual context retrieval logic from your database or data source.`;
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
          content: "You are a helpful assistant that creates concise and accurate summaries of project content. Focus on key features, main objectives, and important details."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
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