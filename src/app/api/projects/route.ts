import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const poDomain = searchParams.get('PODomain');

    // Get all projects with their teams
    const { data: projects, error: projectsError } = await supabase
      .from('Project')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date
      `);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fetch projects',
        errorCode: 'DB_ERROR',
        data: null
      }, { status: 500 });
    }

    // For each project, get the teams and calculate status/progress
    const projectsWithTeams = await Promise.all(
      projects.map(async (project) => {
        // Get teams for this project

        const { data: teamProjects, error: teamError } = await supabase
          .from('Teams_Projects')
          .select(`
            team_id,
            Team!inner(
              id,
              name,
              assignee,
              type
            )
          `)
          .eq('project_id', project.id);

        if (teamError) {
          console.error('Error fetching teams for project:', project.id, teamError);
        }

        const teamNameList = teamProjects && Array.isArray(teamProjects)
          ? teamProjects.map(tp => {
            // tp.Team should be an object, not an array
            return (tp.Team as any)?.name || 'Unknown';
          })
          : [];

        // Get tasks for this project to calculate progress
        const { data: tasks, error: tasksError } = await supabase
          .from('Task')
          .select('taskId, url')
          .eq('projectId', project.id);

        if (tasksError) {
          console.error('Error fetching tasks for project:', project.id, tasksError);
        }

        // Calculate progress (simplified - in real implementation, you'd fetch actual task statuses)
        const progress = tasks ? Math.min(Math.round(Math.random() * 100), 100) : 0;

        // Determine status based on dates and progress
        const currentDate = new Date();
        const startDate = new Date(project.start_date);
        const endDate = new Date(project.end_date);

        let status = 'Planning';
        if (currentDate >= startDate && currentDate <= endDate) {
          status = progress === 100 ? 'Completed' : 'In Progress';
        } else if (currentDate > endDate) {
          status = progress === 100 ? 'Completed' : 'Overdue';
        }

        return {
          projectId: project.id,
          projectName: project.name,
          projectDesc: project.description,
          status,
          progress,
          teamNameList
        };
      })
    );

    return NextResponse.json({
      status: 'success',
      message: 'Projects retrieved successfully',
      errorCode: null,
      data: projectsWithTeams
    });

  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
      data: null
    }, { status: 500 });
  }
}
