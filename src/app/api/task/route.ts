import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseTaskUrl } from '@/lib/external-api';

interface AddTaskRequest {
  type: 'jiraTicket' | 'rowSheet';
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const projectId = searchParams.get('projectId');

    if (!teamId || !projectId) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'teamId and projectId are required',
        data: null
      }, { status: 400 });
    }

    const body: AddTaskRequest = await request.json();
    const { type, url } = body;

    if (!type || !url) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'type and url are required',
        data: null
      }, { status: 400 });
    }

    // Validate team and project exist
    const { data: team, error: teamError } = await supabase
      .from('Team')
      .select('id')
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'NOT_FOUND',
        message: 'Team not found',
        data: null
      }, { status: 404 });
    }

    const { data: project, error: projectError } = await supabase
      .from('Project')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'NOT_FOUND',
        message: 'Project not found',
        data: null
      }, { status: 404 });
    }

    // Validate team-project relationship exists
    const { data: teamProject, error: teamProjectError } = await supabase
      .from('Teams_Projects')
      .select('team_id')
      .eq('team_id', teamId)
      .eq('project_id', projectId)
      .single();

    if (teamProjectError || !teamProject) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'NOT_FOUND',
        message: 'Team is not associated with this project',
        data: null
      }, { status: 404 });
    }

    // Validate URL and prepare task for insertion
    try {
      // Validate URL format
      const parsedUrl = parseTaskUrl(url);

      // Check if the type matches the expected type
      if (parsedUrl.type !== type) {
        return NextResponse.json({
          status: 'error',
          errorCode: 'VALIDATION_ERROR',
          message: `Type mismatch. Expected ${type}, got ${parsedUrl.type}`,
          data: null
        }, { status: 400 });
      }

      // Check if task with this URL already exists for this team and project
      const { data: existingTask, error: checkError } = await supabase
        .from('Task')
        .select('taskId')
        .eq('teamId', teamId)
        .eq('projectId', projectId)
        .eq('url', url)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing task:', checkError);
        return NextResponse.json({
          status: 'error',
          errorCode: 'DB_ERROR',
          message: 'Failed to check existing tasks',
          data: null
        }, { status: 500 });
      }

      if (existingTask) {
        return NextResponse.json({
          status: 'error',
          errorCode: 'DUPLICATE_TASK',
          message: 'Task with this URL already exists',
          data: null
        }, { status: 409 });
      }

      // Insert task
      const { data: insertedTask, error: insertError } = await supabase
        .from('Task')
        .insert({
          teamId: parseInt(teamId),
          projectId: parseInt(projectId),
          url: url
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting task:', insertError);
        return NextResponse.json({
          status: 'error',
          errorCode: 'DB_ERROR',
          message: 'Failed to insert task',
          data: null
        }, { status: 500 });
      }

      return NextResponse.json({
        status: 'success',
        errorCode: null,
        message: 'Successfully added task',
        data: {
          taskId: insertedTask.taskId
        }
      });

    } catch (error) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: `Invalid URL format - ${url}`,
        data: null
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in POST /api/task:', error);
    return NextResponse.json({
      status: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}
