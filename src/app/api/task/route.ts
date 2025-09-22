import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseTaskUrl } from '@/lib/external-api';

interface AddTaskRequest {
  type: 'jiraTicket' | 'rowSheet';
  listUrl: string[];
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
    const { type, listUrl } = body;

    if (!type || !listUrl || !Array.isArray(listUrl) || listUrl.length === 0) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'type and listUrl are required, listUrl must be a non-empty array',
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

    // Validate URLs and prepare tasks for insertion
    const tasksToInsert = [];
    const validationErrors = [];

    for (let i = 0; i < listUrl.length; i++) {
      const url = listUrl[i];
      
      try {
        // Validate URL format
        const parsedUrl = parseTaskUrl(url);
        
        // Check if the type matches the expected type
        if (parsedUrl.type !== type) {
          validationErrors.push(`URL ${i + 1}: Type mismatch. Expected ${type}, got ${parsedUrl.type}`);
          continue;
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
        }

        if (existingTask) {
          validationErrors.push(`URL ${i + 1}: Task with this URL already exists`);
          continue;
        }

        tasksToInsert.push({
          teamId: parseInt(teamId),
          projectId: parseInt(projectId),
          url: url
        });

      } catch (error) {
        validationErrors.push(`URL ${i + 1}: Invalid URL format - ${url}`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'Some URLs are invalid',
        data: {
          errors: validationErrors,
          validTasks: tasksToInsert.length
        }
      }, { status: 400 });
    }

    if (tasksToInsert.length === 0) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'NO_VALID_TASKS',
        message: 'No valid tasks to insert',
        data: null
      }, { status: 400 });
    }

    // Insert tasks
    const { data: insertedTasks, error: insertError } = await supabase
      .from('Task')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting tasks:', insertError);
      return NextResponse.json({
        status: 'error',
        errorCode: 'DB_ERROR',
        message: 'Failed to insert tasks',
        data: null
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      errorCode: null,
      message: `Successfully added ${insertedTasks.length} task(s)`,
      data: {
        insertedCount: insertedTasks.length,
        taskIds: insertedTasks.map((task: any) => task.taskId)
      }
    });

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
