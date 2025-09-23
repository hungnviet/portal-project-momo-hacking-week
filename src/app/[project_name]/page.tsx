'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProjectProgress from '../../components/ProjectProgress';
import TeamSection from '../../components/TeamSection';
import ProjectComments from '../../components/ProjectComments';
import TigerLoader from '../../components/TigerLoader';
import Header from '../../components/Header';
import { ProjectDetails, ApiResponse, Project } from '../../service';
import { CachedApiService } from '../../services/cachedApiService';
import { useTaskStatus } from '../../contexts/TaskStatusContext';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectName = params.project_name as string;

  // State management for project data
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use task status context
  const {
    getProjectProgress,
    getTeamProgress,
    getTasksByTeam,
    loading: taskStatusLoading,
    error: taskStatusError,
    lastUpdated,
    refreshTasks
  } = useTaskStatus();

  // Fetch project data when component mounts
  useEffect(() => {
    const fetchProject = async () => {
      await fetchProjectData();
    };

    if (projectName) {
      fetchProject();
    }
  }, [projectName]);

  const fetchProjectData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Decode the project name from URL
      const decodedProjectName = decodeURIComponent(projectName);

      // First, get all projects to find the one with matching name
      const projectsResponse = await CachedApiService.getProjects(forceRefresh);

      if (!CachedApiService.isSuccess(projectsResponse)) {
        setError(CachedApiService.getErrorMessage(projectsResponse));
        return;
      }

      // Find the project with matching name
      const matchingProject = projectsResponse.data.find(
        (p: Project) => p.projectName === decodedProjectName
      );

      if (!matchingProject) {
        setError(`Project "${decodedProjectName}" not found`);
        return;
      }

      // Now fetch detailed project data using the project ID
      const response = await CachedApiService.getProject(matchingProject.projectId, forceRefresh);

      if (CachedApiService.isSuccess(response)) {
        setProject(response.data);
      } else {
        setError(CachedApiService.getErrorMessage(response));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    // Refresh both project data and task status
    await Promise.all([
      fetchProjectData(true),
      refreshTasks()
    ]);
  };

  // Helper function to get enhanced team data with real progress
  const getEnhancedTeamData = (team: any, projectId: number) => {
    const teamProgress = getTeamProgress(projectId, team.teamId);
    const teamTasks = getTasksByTeam(projectId, team.teamId);

    return {
      id: team.teamId.toString(),
      name: team.teamName,
      progress: teamProgress ? teamProgress.progress : team.teamProgress,
      ticketCount: teamTasks.length,
      completedTickets: teamProgress ? teamProgress.doneTasks : 0,
      status: teamProgress ?
        (teamProgress.progress >= 80 ? 'Ahead of Schedule' :
          teamProgress.progress >= 60 ? 'On Track' : 'Behind Schedule') :
        (team.teamProgress >= 80 ? 'Ahead of Schedule' :
          team.teamProgress >= 60 ? 'On Track' : 'Behind Schedule'),
      // Additional task status data
      taskStats: teamProgress ? {
        totalTasks: teamProgress.totalTasks,
        doneTasks: teamProgress.doneTasks,
        inProgressTasks: teamProgress.inProgressTasks,
        statusBreakdown: teamProgress.statusBreakdown
      } : null
    };
  };

  // Get enhanced project progress
  const getEnhancedProjectProgress = () => {
    if (!project) return 0;

    const taskProgress = getProjectProgress(parseInt(project.projectId.toString()));
    return taskProgress ? taskProgress.progress : project.progress;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50/30">
        <Header
          title="Project Details"
          subtitle="Loading project information"
          showBackButton={true}
          backHref="/"
          isRefreshing={true}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300 to-pink-400 rounded-full opacity-20 animate-pulse blur-xl"></div>
              <TigerLoader size="lg" className="relative z-10" />
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Project Details</h3>
              <p className="text-gray-600">Please wait while we fetch project information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show project details with loading state for task progress
  if (taskStatusLoading && project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href="/"
              className="flex items-center gap-2 hover:underline"
              style={{ color: '#eb2f96' }}
            >
              ← Back to Projects
            </Link>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <TigerLoader size="lg" className="mx-auto mb-4" />
              <p className="text-gray-600">Loading team progress...</p>
              <p className="text-gray-500 text-sm mt-2">Project loaded, calculating task progress...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100/30">
        <Header
          title="Project Not Found"
          subtitle="Unable to load project details"
          showBackButton={true}
          backHref="/"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300 to-pink-400 rounded-full opacity-20 blur-xl"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Project</h3>
              <p className="text-gray-600 mb-6">{error || 'Project not found'}</p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Projects
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50/30">
      <Header
        title={project.projectName}
        showBackButton={true}
        backHref="/"
        onRefresh={handleRefreshData}
        isRefreshing={loading || taskStatusLoading}
        lastUpdated={lastUpdated || undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header Card */}
        <div className="glass-card p-8 mb-8 fade-in">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-400 to-blue-400 text-white">
                    {project.status}
                  </span>
                  <span className="text-sm text-gray-500">ID: {project.projectId}</span>
                </div>
                <p className="text-sm text-gray-500">{project.projectDesc}</p>
              </div>
              {taskStatusError && (
                <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-pink-800 font-medium">Task progress unavailable</p>
                      <p className="text-pink-700 text-sm mt-1">
                        {taskStatusError} - Showing basic project data only.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-right ml-6">
              <div className="relative">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent mb-1">
                  {getEnhancedProjectProgress()}%
                </div>
                {lastUpdated && !taskStatusError && (
                  <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <ProjectProgress progress={getEnhancedProjectProgress()} />
          </div>
        </div>

        {/* Teams and Comments Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Teams Section */}
          <div className="xl:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-300 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Contributing Teams
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent"></div>
            </div>
            <div className="space-y-6">
              {project.teamList.map((team, index) => (
                <div key={team.teamId} className={`fade-in-delay-${index + 1}`}>
                  <TeamSection
                    team={getEnhancedTeamData(team, parseInt(project.projectId.toString()))}
                    projectName={projectName}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="xl:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-pink-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Comments
              </h2>
            </div>
            <div className="fade-in-delay-2">
              <ProjectComments
                projectId={project.projectId.toString()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
