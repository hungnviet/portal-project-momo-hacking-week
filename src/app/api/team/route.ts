import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getListGeneralInfoOfJiraTicket } from '@/lib/get-general-info-of-list-jira-ticket';

function calculateProgress(taskList: any[]) {
  if (!taskList || taskList.length === 0) return 0;

  const completedStatuses = ['Done', 'Closed', 'Resolved', 'Complete'];
  const completedTasks = taskList.filter(task =>
    completedStatuses.includes(task.ticketStatus)
  ).length;

  return Math.round((completedTasks / taskList.length) * 100);
}

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

    // Extract Jira URLs from tasks
    const jiraUrls = (tasks || [])
      .filter(task => task.url && (task.url.includes('atlassian.net') || task.url.includes('jira')))
      .map(task => task.url);

    console.log(`🔍 Found ${jiraUrls.length} Jira tickets to fetch`);

    // Fetch comprehensive Jira ticket information
    let taskList: any[] = [];

    if (jiraUrls.length > 0) {
      try {
        const jiraTicketsInfo = await getListGeneralInfoOfJiraTicket(jiraUrls);

        // Map the fetched data to the task list format
        taskList = jiraTicketsInfo.map(ticket => ({
          id: ticket.id,
          ticketName: ticket.ticketName,
          ticketDescription: ticket.ticketDescription,
          ticketStatus: ticket.ticketStatus,
          ticketPriority: ticket.ticketPriority,
          assignee: ticket.assignee,
          startdate: ticket.startdate,
          duedate: ticket.duedate,
          ticketKey: ticket.ticketKey,
          projectName: ticket.projectName,
          ticketType: ticket.ticketType,
          url: ticket.url,
          type: 'jiraTicket' as const
        }));

        console.log(`✅ Successfully fetched ${taskList.length} Jira tickets`);
      } catch (error) {
        console.error('Error fetching Jira tickets:', error);
        // Fallback to basic task info if Jira fetch fails
        taskList = (tasks || []).map(task => ({
          type: 'jiraTicket' as const,
          url: task.url,
          ticketName: 'Unable to fetch details',
          ticketStatus: 'Unknown',
          assignee: 'Unknown',
          error: 'Failed to fetch Jira data'
        }));
      }
    }

    // Handle non-Jira tasks (Google Sheets, etc.) - keep original logic for these
    const nonJiraTasks = (tasks || [])
      .filter(task => task.url && !task.url.includes('atlassian.net') && !task.url.includes('jira'));

    if (nonJiraTasks.length > 0) {
      console.log(`📋 Found ${nonJiraTasks.length} non-Jira tasks (e.g., Google Sheets)`);

      const nonJiraTaskData = nonJiraTasks.map(task => ({
        type: task.url.includes('docs.google.com/spreadsheets') ? 'rowSheet' as const : 'unknown' as const,
        url: task.url,
        ticketName: 'External task',
        ticketStatus: 'Unknown',
        assignee: 'Unknown',
        note: 'Non-Jira task - detailed fetching not implemented'
      }));

      taskList = [...taskList, ...nonJiraTaskData];
    }

    // Calculate progress based on task statuses
    const progress = calculateProgress(taskList);

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
