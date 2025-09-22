'use client';

import { useState, useEffect } from 'react';
import CreateProjectPopup from '../components/CreateProjectPopup';
import ProjectCard from '../components/ProjectCard';
import { apiService, type Project, type ApiResponse } from '../service';


export default function HomePage() {
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Project[]> = await apiService.getProjects();

      if (apiService.isSuccess(response)) {
        setProjects(response.data);
      } else {
        setError(apiService.getErrorMessage(response));
      }
    } catch (err) {
      setError('Failed to fetch projects. Please try again later.');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    // Refresh the projects list when a new project is created
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BU Project Portal</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your business unit projects</p>
          </div>
          <button
            onClick={() => setIsCreatePopupOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Project
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading state
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading projects...</p>
              </div>
            </div>
          ) : error ? (
            // Error state
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-red-600 font-medium mb-2">Error loading projects</p>
                <p className="text-gray-600 text-sm">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : projects.length === 0 ? (
            // Empty state
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-center">
                <div className="text-gray-400 mb-2">📁</div>
                <p className="text-gray-600 font-medium mb-2">No projects found</p>
                <p className="text-gray-500 text-sm mb-4">Get started by creating your first project</p>
                <button
                  onClick={() => setIsCreatePopupOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            // Projects list
            projects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={{
                  id: project.projectId,
                  name: project.projectName,
                  description: project.projectDesc,
                  status: project.status,
                  teams: project.teamNameList,
                  progress: project.progress
                }}
              />
            ))
          )}
        </div>

        {/* Create Project Popup */}
        {isCreatePopupOpen && (
          <CreateProjectPopup
            isOpen={isCreatePopupOpen}
            onClose={() => setIsCreatePopupOpen(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}
      </div>
    </div>
  );
}
