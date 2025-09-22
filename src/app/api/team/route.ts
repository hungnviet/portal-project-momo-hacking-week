import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchJiraTicket, fetchSheetRow, calculateProgress } from '@/lib/external-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const projectId = searchParams.get('projectId');

    console.log(`Fetching details for teamId: ${teamId}, projectId: ${projectId}`);

    if (!teamId || !projectId) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'teamId and projectId are required',
        data: null
      }, { status: 400 });
    }

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from('Team')
      .select('*')
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

    // Get team-project relationship details
    const { data: teamProject, error: teamProjectError } = await supabase
      .from('Teams_Projects')
      .select('description')
      .eq('team_id', teamId)
      .eq('project_id', projectId)
      .single();

    if (teamProjectError) {
      console.error('Error fetching team-project relationship:', teamProjectError);
    }

    // Get tasks for this team in this project
    const { data: tasks, error: tasksError } = await supabase
      .from('Task')
      .select('*')
      .eq('teamId', teamId)
      .eq('projectId', projectId);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json({
        status: 'error',
        errorCode: 'DB_ERROR',
        message: 'Failed to fetch tasks',
        data: null
      }, { status: 500 });
    }

    // Fetch external data for each task
    const taskList = await Promise.all(
      (tasks || []).map(async (task: any) => {
        let taskData = {
          type: 'unknown' as 'rowSheet' | 'jiraTicket',
          url: task.url,
          taskDesc: 'Unable to fetch details',
          taskStatus: 'Unknown',
          taskAssignee: 'Unknown'
        };

        try {
          if (task.url.includes('atlassian.net') || task.url.includes('jira')) {
            // Fetch Jira ticket
            taskData.type = 'jiraTicket';
            const jiraData = await fetchJiraTicket(task.url);
            if (jiraData) {
              taskData.taskDesc = jiraData.summary;
              taskData.taskStatus = jiraData.status.name;
              taskData.taskAssignee = jiraData.assignee?.displayName || 'Unassigned';
            }
          } else if (task.url.includes('docs.google.com/spreadsheets')) {
            // Fetch Google Sheets data
            taskData.type = 'rowSheet';
            const sheetData = await fetchSheetRow(task.url);
            if (sheetData) {
              taskData.taskDesc = sheetData.taskDesc;
              taskData.taskStatus = sheetData.status;
              taskData.taskAssignee = sheetData.assignee;
            }
          }
        } catch (error) {
          console.error(`Error fetching data for task ${task.taskId}:`, error);
          // Keep default values if fetch fails
        }

        return taskData;
      })
    );

    // Calculate progress based on task statuses
    const progress = calculateProgress(taskList.map(task => ({ status: task.taskStatus })));

    return NextResponse.json({
      status: 'success',
      errorCode: null,
      message: 'Team details retrieved successfully',
      data: {
        teamId: parseInt(teamId),
        teamDesc: teamProject?.description || '',
        assignee: team.assignee,
        progress,
        taskList
      }
    });

  } catch (error) {
    console.error('Error in GET /api/team:', error);
    return NextResponse.json({
      status: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}
