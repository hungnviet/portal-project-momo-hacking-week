import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CreateProjectRequest {
  projectName: string;
  projectDesc: string;
  startDate: string;
  endDate: string;
  teams: Array<{
    teamName: string;
    teamDesc: string;
    PODomain: string;
    type: number; // Optional team type: 0 = Sheet, 1 = Jira (default)
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectRequest = await request.json();
    const { projectName, projectDesc, startDate, endDate, teams } = body;

    // Validate required fields
    if (!projectName || !projectDesc || !startDate || !endDate || !teams || teams.length === 0) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        data: null
      }, { status: 400 });
    }

    // Start a transaction-like operation
    // First, create the project
    const { data: newProject, error: projectError } = await supabase
      .from('Project')
      .insert({
        name: projectName,
        description: projectDesc,
        start_date: startDate,
        end_date: endDate
      })
      .select()
      .single();

    if (projectError) {
      console.log(projectError)
      return NextResponse.json({
        status: 'error',
        errorCode: 'DB_ERROR',
        message: 'Failed to create project',
        data: null
      }, { status: 500 });
    }

    // Process teams
    const teamOperations = await Promise.all(
      teams.map(async (teamData) => {
        // Check if team already exists
        const { data: existingTeam, error: teamCheckError } = await supabase
          .from('Team')
          .select('id')
          .eq('name', teamData.teamName)
          .eq('assignee', teamData.PODomain)
          .single();

        let teamId: number;

        if (existingTeam) {
          // Team exists, use existing team
          teamId = existingTeam.id;
        } else {
          // Create new team
          const { data: newTeam, error: teamCreateError } = await supabase
            .from('Team')
            .insert({
              name: teamData.teamName,
              assignee: teamData.PODomain,
              type: teamData.type
            })
            .select()
            .single();

          if (teamCreateError) {
            throw new Error(`Failed to create team: ${teamData.teamName}`);
          }
          teamId = newTeam.id;
        }

        // Create team-project relationship
        const { error: relationError } = await supabase
          .from('Teams_Projects')
          .insert({
            team_id: teamId,
            project_id: newProject.id,
            description: teamData.teamDesc,
          });

        if (relationError) {
          throw new Error(`Failed to link team ${teamData.teamName} to project`);
        }

        return { teamId, teamName: teamData.teamName };
      })
    );

    return NextResponse.json({
      status: 'success',
      errorCode: null,
      message: 'Project created successfully',
      data: {
        projectId: newProject.id,
        projectName: newProject.name,
        teams: teamOperations
      }
    });

  } catch (error) {
    console.error('Error in POST /api/project:', error);
    return NextResponse.json({
      status: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Internal server error',
      data: null
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'projectId is required',
        data: null
      }, { status: 400 });
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('Project')
      .select('*')
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


    // Get teams for this project
    const { data: teamProjects, error: teamsError } = await supabase
      .from('Teams_Projects')
      .select(`
        team_id,
        description,
        Team(
          id,
          name,
          assignee,
          type
        )
      `)
      .eq('project_id', projectId);

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
    }

    // Calculate team progress for each team
    const teamList = await Promise.all(
      (teamProjects || []).map(async (tp: any) => {
        // Get tasks for this team in this project
        const { data: tasks, error: tasksError } = await supabase
          .from('Task')
          .select('url')
          .eq('teamId', tp.team_id)
          .eq('projectId', projectId);

        if (tasksError) {
          console.error('Error fetching team tasks:', tasksError);
        }



        return {
          teamId: tp.Team.id,
          teamName: tp.Team.name,
          teamDesc: tp.description,
          teamPODomain: tp.Team.assignee
        };
      })
    );



    return NextResponse.json({
      status: 'success',
      errorCode: null,
      message: 'Project details retrieved successfully',
      data: {
        projectId: project.id,
        projectName: project.name,
        projectDesc: project.description,
        startDate: project.start_date,
        dueDate: project.end_date,
        teamList
      }
    });

  } catch (error) {
    console.error('Error in GET /api/project:', error);
    return NextResponse.json({
      status: 'error',
      errorCode: 'INTERNAL_ERROR',
      message: 'Internal server error',
      data: null
    }, { status: 500 });
  }
}
