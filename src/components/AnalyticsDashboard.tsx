'use client';

import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  teams: string[];
  progress: number;
  taskStats?: {
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    statusBreakdown: { [status: string]: number };
    hasTasks: boolean;
  } | null;
}

interface AnalyticsDashboardProps {
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsDashboard({ projects, isOpen, onClose }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'teams' | 'tasks'>('overview');

  if (!isOpen) return null;

  // Calculate overall statistics
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const planningProjects = projects.filter(p => p.status === 'Planning').length;
  
  const totalTasks = projects.reduce((sum, p) => sum + (p.taskStats?.totalTasks || 0), 0);
  const doneTasks = projects.reduce((sum, p) => sum + (p.taskStats?.doneTasks || 0), 0);
  const inProgressTasks = projects.reduce((sum, p) => sum + (p.taskStats?.inProgressTasks || 0), 0);
  const pendingTasks = totalTasks - doneTasks - inProgressTasks;

  const allTeams = projects.flatMap(p => p.teams);
  const uniqueTeams = [...new Set(allTeams)];
  const totalTeams = uniqueTeams.length;

  const averageProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0;

  // Project status distribution for pie chart
  const projectStatusData = [
    { name: 'Completed', value: completedProjects, color: '#10B981', percentage: Math.round((completedProjects / totalProjects) * 100) },
    { name: 'In Progress', value: inProgressProjects, color: '#3B82F6', percentage: Math.round((inProgressProjects / totalProjects) * 100) },
    { name: 'Planning', value: planningProjects, color: '#F59E0B', percentage: Math.round((planningProjects / totalProjects) * 100) }
  ];

  // Task status distribution
  const taskStatusData = [
    { name: 'Done', value: doneTasks, color: '#10B981', percentage: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 },
    { name: 'In Progress', value: inProgressTasks, color: '#3B82F6', percentage: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0 },
    { name: 'Pending', value: pendingTasks, color: '#6B7280', percentage: totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0 }
  ];

  // Team workload (teams with most projects)
  const teamWorkload = uniqueTeams.map(team => ({
    name: team,
    projects: projects.filter(p => p.teams.includes(team)).length,
    tasks: projects.filter(p => p.teams.includes(team)).reduce((sum, p) => sum + (p.taskStats?.totalTasks || 0), 0)
  })).sort((a, b) => b.projects - a.projects);

  // Project progress distribution
  const progressRanges = [
    { name: '0%', count: projects.filter(p => p.progress === 0).length },
    { name: '1-25%', count: projects.filter(p => p.progress > 0 && p.progress <= 25).length },
    { name: '26-50%', count: projects.filter(p => p.progress > 25 && p.progress <= 50).length },
    { name: '51-75%', count: projects.filter(p => p.progress > 50 && p.progress <= 75).length },
    { name: '76-99%', count: projects.filter(p => p.progress > 75 && p.progress < 100).length },
    { name: '100%', count: projects.filter(p => p.progress === 100).length }
  ];

  const maxProgressCount = Math.max(...progressRanges.map(r => r.count));

  const PieChart = ({ data, title }: { data: any[], title: string }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {data.map((item, index) => {
                const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                const strokeDashoffset = -cumulativePercentage;
                cumulativePercentage += item.percentage;
                
                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          </div>
          <div className="ml-6 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-700">
                  {item.name}: {item.value} ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const BarChart = ({ data, title, color = '#3B82F6' }: { data: any[], title: string, color?: string }) => {
    const maxValue = Math.max(...data.map(item => item.count || item.projects || item.tasks));
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-16 text-sm text-gray-600 text-right mr-3">
                {item.name}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div 
                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ 
                    width: `${((item.count || item.projects || item.tasks) / maxValue) * 100}%`,
                    backgroundColor: color
                  }}
                >
                  <span className="text-white text-xs font-medium">
                    {item.count || item.projects || item.tasks}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 mt-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'projects', label: 'Projects' },
              { id: 'teams', label: 'Teams' },
              { id: 'tasks', label: 'Tasks' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{totalProjects}</div>
                  <div className="text-sm text-blue-700">Total Projects</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="text-2xl font-bold text-green-600">{totalTasks}</div>
                  <div className="text-sm text-green-700">Total Tasks</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">{totalTeams}</div>
                  <div className="text-sm text-purple-700">Active Teams</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
                  <div className="text-2xl font-bold text-yellow-600">{averageProgress}%</div>
                  <div className="text-sm text-yellow-700">Avg Progress</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChart data={projectStatusData} title="Project Status Distribution" />
                <PieChart data={taskStatusData} title="Task Status Distribution" />
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              <BarChart 
                data={progressRanges} 
                title="Project Progress Distribution" 
                color="#8B5CF6"
              />
              
              {/* Project Details Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {project.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {project.taskStats?.totalTasks || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {project.teams.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="space-y-6">
              <BarChart 
                data={teamWorkload.slice(0, 10)} 
                title="Team Workload (Top 10 by Projects)" 
                color="#10B981"
              />
              
              {/* Team Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Team Statistics</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamWorkload.map((team, index) => (
                      <div key={team.name} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 truncate">{team.name}</h4>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Projects:</span>
                            <span className="font-medium text-green-700">{team.projects}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tasks:</span>
                            <span className="font-medium text-green-700">{team.tasks}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* Task Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{doneTasks}</div>
                      <div className="text-sm text-green-700">Completed Tasks</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
                      <div className="text-sm text-blue-700">In Progress</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-6v6m6-2a2 2 0 002-2V7a2 2 0 00-2-2h-2m0 0V3a2 2 0 00-2 2v2m0 0h2m0 0v2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{pendingTasks}</div>
                      <div className="text-sm text-gray-700">Pending Tasks</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Completion Rate */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Rate</h3>
                <div className="w-full bg-gray-200 rounded-full h-8">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-8 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ width: `${totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0}%` }}
                  >
                    {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{doneTasks} completed</span>
                  <span>{totalTasks} total</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
