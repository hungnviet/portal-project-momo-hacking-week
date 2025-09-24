'use client';

import { useState, useEffect } from 'react';
import CreateProjectPopup from '../components/CreateProjectPopup';
import ProjectCard from '../components/ProjectCard';
import TigerLoader from '../components/TigerLoader';
import Header from '../components/Header';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { type Project, type ApiResponse } from '../service';
import { CachedApiService } from '../services/cachedApiService';
import { useTaskStatus } from '../contexts/TaskStatusContext';

export default function HomePage() {
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use task status context
  const {
    getProjectProgress,
    loading: taskStatusLoading,
    error: taskStatusError,
    lastUpdated,
    refreshTasks
  } = useTaskStatus();

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const response: ApiResponse<Project[]> = await CachedApiService.getProjects(forceRefresh);

      if (CachedApiService.isSuccess(response)) {
        setProjects(response.data);
      } else {
        setError(CachedApiService.getErrorMessage(response));
      }
    } catch (err) {
      setError('Failed to fetch projects. Please try again later.');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    // Refresh the projects list when a new project is created (force refresh)
    fetchProjects(true);
  };

  const handleRefreshData = async () => {
    // Refresh both projects and task status
    await Promise.all([
      fetchProjects(true),
      refreshTasks()
    ]);
  };

  // Function to calculate project status based on task completion and due date
  const calculateProjectStatus = (project: Project, taskProgress: any) => {
    const currentDate = new Date();
    const dueDate = new Date(project.dueDate);
    
    // Check if project has tasks
    const hasTasks = taskProgress && taskProgress.totalTasks > 0;
    
    if (!hasTasks) {
      // No tasks = Planning phase
      return 'Planning';
    }
    
    // Check if all tasks are done
    if (taskProgress.doneTasks === taskProgress.totalTasks) {
      return 'Completed';
    }
    
    // Check if current date is past due date
    if (currentDate > dueDate) {
      return 'Overdue';
    }
    
    // Otherwise, it's in progress
    return 'In Progress';
  };

  // Function to get enhanced project data with real progress and calculated status
  const getEnhancedProjectData = (project: Project) => {
    const taskProgress = getProjectProgress(parseInt(project.projectId));

    // Calculate the actual status based on tasks and dates
    const calculatedStatus = calculateProjectStatus(project, taskProgress);

    // Calculate progress based on tasks only
    let effectiveProgress = 0;
    if (taskProgress && taskProgress.totalTasks > 0) {
      // Progress is calculated as (done tasks / total tasks) * 100
      effectiveProgress = Math.round((taskProgress.doneTasks / taskProgress.totalTasks) * 100);
    }

    return {
      id: project.projectId,
      name: project.projectName,
      description: project.projectDesc,
      status: calculatedStatus,
      teams: project.teamNameList,
      progress: effectiveProgress,
      startDate: project.startDate,
      dueDate: project.dueDate,
      // Additional data from task analysis
      taskStats: taskProgress ? {
        totalTasks: taskProgress.totalTasks,
        doneTasks: taskProgress.doneTasks,
        inProgressTasks: taskProgress.inProgressTasks,
        statusBreakdown: taskProgress.statusBreakdown,
        hasTasks: taskProgress.totalTasks > 0
      } : {
        totalTasks: 0,
        doneTasks: 0,
        inProgressTasks: 0,
        statusBreakdown: {},
        hasTasks: false
      }
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50/30">
      {/* Modern Header */}
      <Header
        onRefresh={handleRefreshData}
        isRefreshing={loading || taskStatusLoading}
        lastUpdated={lastUpdated || undefined}
      >
        {/* Analytics Button */}
        <button
          onClick={() => setIsAnalyticsOpen(true)}
          className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group mr-3"
        >
          <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2a2 2 0 00-2-2V9a2 2 0 002-2h2a2 2 0 002 2v2" />
          </svg>
          <span className="hidden sm:inline">View Analytics</span>
          <span className="sm:hidden">Analytics</span>
        </button>

        {/* Create Project Button */}
        <button
          onClick={() => setIsCreatePopupOpen(true)}
          className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-pink-400 to-pink-300 hover:from-pink-500 hover:to-pink-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="hidden sm:inline">Create Request</span>
          <span className="sm:hidden">Create</span>
        </button>
      </Header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          // Loading state with modern design
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300 to-pink-400 rounded-full opacity-20 animate-pulse blur-xl"></div>
              <TigerLoader size="lg" className="relative z-10" />
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Projects</h3>
              <p className="text-gray-600">Please wait while we fetch your project data...</p>
            </div>
          </div>
        ) : taskStatusLoading ? (
          // Task status loading state with modern design
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full opacity-20 animate-pulse blur-xl"></div>
              <TigerLoader size="lg" className="relative z-10" />
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Calculating Progress</h3>
              <p className="text-gray-600">Projects loaded, analyzing task progress...</p>
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        ) : error ? (
          // Error state with modern design
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-pink-400 rounded-full opacity-20 blur-xl"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Projects</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-300 hover:from-pink-500 hover:to-pink-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        ) : taskStatusError ? (
          // Task status error state with modern design
          <div>
            <div className="mb-8 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-300 to-pink-400 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-1">Progress Calculation Unavailable</h3>
                  <p className="text-yellow-800 mb-2">Unable to load task statuses: {taskStatusError}</p>
                  <p className="text-yellow-700 text-sm">Showing projects with basic information only.</p>
                </div>
              </div>
            </div>

            {/* Projects Grid with fallback data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <div key={project.projectId} style={{ animationDelay: `${index * 100}ms` }}>
                  <ProjectCard
                    project={{
                      id: project.projectId,
                      name: project.projectName,
                      description: project.projectDesc,
                      status: project.status,
                      teams: project.teamNameList,
                      progress: project.progress
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : projects.length === 0 ? (
          // Empty state with modern design
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-slate-400 rounded-full opacity-10 blur-xl"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full flex items-center justify-center border border-gray-200">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first project and begin managing your team's work efficiently.</p>
              <button
                onClick={() => setIsCreatePopupOpen(true)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 group"
              >
                <svg className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Project
              </button>
            </div>
          </div>
        ) : (
          // Projects grid with enhanced data
          <div>
            {/* Stats Summary */}
            <div className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-indigo-600">{projects.length}</div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-green-600">
                  {projects.filter(p => {
                    const enhanced = getEnhancedProjectData(p);
                    return enhanced.status === 'Completed';
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => {
                    const enhanced = getEnhancedProjectData(p);
                    return enhanced.status === 'In Progress';
                  }).length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-red-600">
                  {projects.filter(p => {
                    const enhanced = getEnhancedProjectData(p);
                    return enhanced.status === 'Overdue';
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl font-bold text-yellow-600">
                  {projects.filter(p => {
                    const enhanced = getEnhancedProjectData(p);
                    return enhanced.status === 'Planning';
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Planning</div>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <div key={project.projectId} style={{ animationDelay: `${index * 100}ms` }}>
                  <ProjectCard project={getEnhancedProjectData(project)} />
                </div>
              ))}
            </div>

            {/* Last Updated Info */}
            {lastUpdated && (
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Progress data last updated: {lastUpdated.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Create Project Popup */}
        {isCreatePopupOpen && (
          <CreateProjectPopup
            isOpen={isCreatePopupOpen}
            onClose={() => setIsCreatePopupOpen(false)}
            onProjectCreated={handleProjectCreated}
          />
        )}

        {/* Analytics Dashboard */}
        <AnalyticsDashboard
          projects={projects.map(project => getEnhancedProjectData(project))}
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
        />
      </div>
    </div>
  );
}