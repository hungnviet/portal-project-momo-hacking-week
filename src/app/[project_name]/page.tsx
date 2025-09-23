'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProjectProgress from '../../components/ProjectProgress';
import TeamSection from '../../components/TeamSection';
import ProjectComments from '../../components/ProjectComments';
import TigerLoader from '../../components/TigerLoader';
import { apiService, ProjectDetails, ApiResponse, Project } from '../../service';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectName = params.project_name as string;

  // State management for project data
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch project data when component mounts
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        // Decode the project name from URL
        const decodedProjectName = decodeURIComponent(projectName);

        // First, get all projects to find the one with matching name
        const projectsResponse = await apiService.getProjects();

        if (!apiService.isSuccess(projectsResponse)) {
          setError(apiService.getErrorMessage(projectsResponse));
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
        const response = await apiService.getProject(matchingProject.projectId);

        if (apiService.isSuccess(response)) {
          setProject(response.data);
        } else {
          setError(apiService.getErrorMessage(response));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project data');
      } finally {
        setLoading(false);
      }
    };

    if (projectName) {
      fetchProject();
    }
  }, [projectName]);

  // Loading state
  if (loading) {
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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Project</h2>
            <p className="text-red-600">{error || 'Project not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:underline"
            style={{ color: '#eb2f96' }}
          >
            ← Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.projectName}</h1>
              <p className="text-gray-600 mb-4">{project.projectDesc}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Status: {project.status}</span>
                <span>Project ID: {project.projectId}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: '#eb2f96' }}>{project.progress}%</div>
              <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
          </div>

          <ProjectProgress progress={project.progress} />
        </div>

        {/* Teams Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contributing Teams</h2>
            <div className="space-y-4">
              {project.teamList.map((team) => (
                <TeamSection
                  key={team.teamId}
                  team={{
                    id: team.teamId.toString(),
                    name: team.teamName,
                    progress: team.teamProgress,
                    ticketCount: 0, // This would need to be added to the API or calculated
                    completedTickets: 0, // This would need to be added to the API or calculated
                    status: team.teamProgress >= 80 ? 'Ahead of Schedule' :
                      team.teamProgress >= 60 ? 'On Track' : 'Behind Schedule'
                  }}
                  projectName={projectName}
                />
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Comments</h2>
            <ProjectComments
              projectId={project.projectId.toString()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
