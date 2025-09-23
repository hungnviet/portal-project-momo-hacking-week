'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import TicketCard from '../../../components/TicketCard';
import TeamHeader from '../../../components/TeamHeader';
import TigerLoader from '../../../components/TigerLoader';
import Header from '../../../components/Header';
import { type TeamApiResponse, type TaskData, type ApiResponse, type Project, type ProjectDetails, type AddTaskRequest, type AddTaskResponse } from '../../../service';
import { CachedApiService } from '../../../services/cachedApiService';

// Interface for the component's team data structure
interface TeamData {
  id: string;
  name: string;
  description: string;
  projectName: string;
  projectDescription: string;
  progress: number;
  totalTickets: number;
  completedTickets: number;
  status: string;
  trackMethod: 'jira' | 'sheet';
  assignee?: string;
  tickets: Array<{
    id: string;
    title: string;
    status: string;
    assignee: string;
    priority: string;
    startdate: string;
    duedate: string;
    url: string;
    type: 'jira' | 'sheet';
  }>;
}

/**
 * Transform API task data to component ticket structure
 */
const transformTaskToTicket = (task: TaskData, index: number) => {
  const isJira = task.type === 'jira';

  return {
    id: task.id,
    title: task.ticketName,
    status: task.ticketStatus,
    assignee: task.assignee, // Use team assignee as fallback
    priority: task.ticketPriority || 'Medium', // Use API priority or default
    startdate: task.startdate || '', // Use API startdate or today
    duedate: task.duedate || '', // Use API duedate or today
    url: task.url,
    type: isJira ? 'jira' as const : 'sheet' as const,
  };
};

/**
 * Transform API response to component data structure
 */
const transformApiResponseToTeamData = (
  apiData: TeamApiResponse,
  teamName: string,
  teamDescription: string,
  projectName: string,
  projectDescription: string,
): TeamData => {
  const tickets = apiData.taskList.map((task, index) =>
    transformTaskToTicket(task, index)
  );
  const completedTickets = tickets.filter(t =>
    t.status?.toLowerCase().includes('done') ||
    t.status?.toLowerCase().includes('complete') ||
    t.status?.toLowerCase().includes('closed')
  ).length;

  // Determine track method based on the majority of task types
  const trackMethod = apiData.type === 1 ? 'jira' : 'sheet';

  // Determine status based on progress
  let status = 'Not Started';
  if (apiData.progress > 0 && apiData.progress < 100) {
    status = 'In Progress';
  } else if (apiData.progress === 100) {
    status = 'Completed';
  }

  return {
    id: apiData.teamId.toString(),
    name: teamName,
    description: teamDescription,
    projectName: projectName,
    projectDescription: projectDescription,
    progress: apiData.progress,
    totalTickets: tickets.length,
    completedTickets,
    status,
    trackMethod,
    assignee: apiData.assignee,
    tickets
  };
};

export default function TeamDetailPage() {
  const params = useParams();
  const projectName = params.project_name as string;
  const teamName = params.team_name as string;

  // State management
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [generatingSummary, setGeneratingSummary] = useState<boolean>(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [linkInput, setLinkInput] = useState<string>('');
  const [addingTask, setAddingTask] = useState<boolean>(false);

  // IDs for adding tasks
  const [teamId, setTeamId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    message: string;
    isUser: boolean;
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  useEffect(() => {
    if (projectName && teamName) {
      fetchTeamData();
    }
  }, [projectName, teamName]);

  const fetchTeamData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const decodedProjectName = decodeURIComponent(projectName);
      const decodedTeamName = decodeURIComponent(teamName);

      // First, get all projects to find the matching one
      const projectsResponse = await CachedApiService.getProjects(forceRefresh);
      if (!CachedApiService.isSuccess(projectsResponse)) {
        setError(CachedApiService.getErrorMessage(projectsResponse));
        return;
      }

      const matchingProject = projectsResponse.data.find(
        (p: Project) => p.projectName === decodedProjectName
      );

      if (!matchingProject) {
        setError(`Project "${decodedProjectName}" not found`);
        return;
      }

      // Get project details to find the team
      const projectDetailResponse = await CachedApiService.getProject(matchingProject.projectId, forceRefresh);

      if (!CachedApiService.isSuccess(projectDetailResponse)) {
        setError(CachedApiService.getErrorMessage(projectDetailResponse));
        return;
      }

      // Find the team with matching name within the project
      const matchingTeam = projectDetailResponse.data.teamList.find(
        (team: any) => team.teamName === decodedTeamName
      );

      if (!matchingTeam) {
        setError(`Team "${decodedTeamName}" not found in project "${decodedProjectName}"`);
        return;
      }

      // Now we have the actual IDs, make the team details API call
      const teamId = matchingTeam.teamId;
      const projectId = matchingProject.projectId;

      // Store the IDs for later use in addTask
      setTeamId(teamId);
      setProjectId(parseInt(projectId.toString()));

      const response: ApiResponse<TeamApiResponse> = await CachedApiService.getTeamDetails(teamId, projectId, forceRefresh);

      if (CachedApiService.isSuccess(response)) {
        const transformedData = transformApiResponseToTeamData(response.data, decodedTeamName, matchingTeam.teamDesc, decodedProjectName, matchingProject.projectDesc);
        setTeamData(transformedData);
      } else {
        setError(CachedApiService.getErrorMessage(response));
      }
    } catch (err) {
      setError('Failed to fetch team details. Please try again later.');
      console.error('Error fetching team details:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!teamData) return;

    try {
      setGeneratingSummary(true);

      // Transform team data into the format expected by the API
      const tasksTable = teamData.tickets.map(ticket => ({
        id: ticket.id,
        ticketName: ticket.title,
        assignee: ticket.assignee,
        ticketStatus: ticket.status,
        ticketPriority: ticket.priority,
        startdate: ticket.startdate,
        duedate: ticket.duedate,
        url: ticket.url,
        type: ticket.type
      }));

      const requestData = {
        projectDescription: teamData.projectDescription,
        teamDescription: teamData.description,
        tasksTable: tasksTable
      };

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.summary || 'No summary generated');

    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary('Error generating summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleRefreshData = () => {
    fetchTeamData(true);
  };

  const handleAddLink = async () => {
    if (!linkInput.trim() || !teamId || !projectId || !teamData) return;

    try {
      setAddingTask(true);

      const addTaskRequest: AddTaskRequest = {
        type: teamData.trackMethod,
        url: linkInput.trim()
      };

      const response = await fetch('/api/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addTaskRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AddTaskResponse = await response.json();

      if (result.taskId) {
        // Refresh data to show the new task
        await fetchTeamData(true);
        alert('Task added successfully!');
      } else {
        alert('Failed to add task');
      }

    } catch (error) {
      console.error('Error adding task:', error);
      alert('An error occurred while adding the task. Please try again.');
    } finally {
      setAddingTask(false);
      // Reset and close modal
      setLinkInput('');
      setShowAddModal(false);
    }
  };

  const handleCloseModal = () => {
    setLinkInput('');
    setShowAddModal(false);
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      message: chatInput.trim(),
      isUser: true,
      timestamp: new Date()
    };

    // Add user message to chat
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        message: "đợi em xí , em đang kẹt",
        isUser: false,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, botResponse]);
      setIsChatLoading(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        <Header
          title="Team Details"
          subtitle="Loading team information"
          showBackButton={true}
          backHref={`/${projectName}`}
          isRefreshing={true}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 animate-pulse blur-xl"></div>
              <TigerLoader size="lg" className="relative z-10" />
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Team Details</h3>
              <p className="text-gray-600">Please wait while we fetch team information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100/30">
        <Header
          title="Team Not Found"
          subtitle="Unable to load team details"
          showBackButton={true}
          backHref={`/${projectName}`}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Team</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!teamData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50/30">
        <Header
          title="Team Not Found"
          subtitle="No team data available"
          showBackButton={true}
          backHref={`/${projectName}`}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-300 to-pink-400 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Data Found</h3>
              <p className="text-gray-600">Unable to locate team information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50/30">
      <Header
        title={teamData.name}
        showBackButton={true}
        backHref={`/${projectName}`}
        onRefresh={handleRefreshData}
        isRefreshing={loading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Header */}
        <div className="mb-8 fade-in">
          <TeamHeader team={{ ...teamData, tickets: teamData.tickets }} />
        </div>

        {/* Generate Summary Section */}
        <div className="glass-card p-6 mb-8 fade-in-delay-1">
          <div className="flex gap-6">
            {/* Project Summary Section - 2/3 width */}
            <div className="flex-1 w-2/3">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Project Summary
                  </h2>
                </div>
                <button
                  onClick={generateSummary}
                  disabled={generatingSummary}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingSummary ? (
                    <>
                      <svg className="animate-spin w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Summary
                    </>
                  )}
                </button>
              </div>

              {summary && (
                <div className="mt-4 p-6 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-200/50">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Generated Summary
                  </h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{summary}</div>
                </div>
              )}

              {!summary && !generatingSummary && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">Click "Generate Summary" to create an AI-powered project report based on your current tasks and progress.</p>
                </div>
              )}
            </div>

            {/* Chat Box Section - 1/3 width */}
            <div className="w-1/3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Ask Ngũ Hổ Tướng
                </h2>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50/30 rounded-xl border border-orange-200/50 p-4 h-80 flex flex-col">
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m-4-3v3m0 0v3m0-3h3m-3 0H6m6-3v3m0 0v3m0-3h3m-3 0h-3" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-sm">Start a conversation with our AI assistant to get help with your project.</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            msg.isUser 
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                              : 'bg-white border border-orange-200 text-gray-800'
                          }`}>
                            <p>{msg.message}</p>
                            <p className={`text-xs mt-1 ${msg.isUser ? 'text-orange-100' : 'text-gray-500'}`}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-orange-200 text-gray-800 max-w-xs px-3 py-2 rounded-lg text-sm">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    disabled={isChatLoading}
                    placeholder="Ask about your project..."
                    className="flex-1 px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button 
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isChatLoading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="glass-card p-6 fade-in-delay-2">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-6v6m6-2a2 2 0 002-2V7a2 2 0 00-2-2h-2m0 0V3a2 2 0 00-2 2v2m0 0h2m0 0v2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Tasks & Tickets
              </h2>
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {teamData.completedTickets}/{teamData.totalTickets} completed
              </div>
            </div>
            <div className="flex items-center gap-2">
              {teamData.trackMethod === 'jira' ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Jira Tickets
                  </span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Ticket
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    Sheet Rows
                  </span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Sheet
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tickets Grid */}
          <div className="space-y-4">
            {teamData.tickets.length > 0 ? (
              teamData.tickets.map((ticket, index) => (
                <div key={ticket.id} className={`fade-in-delay-${Math.min(index + 3, 6)}`}>
                  <TicketCard ticket={ticket} />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-6v6m6-2a2 2 0 002-2V7a2 2 0 00-2-2h-2m0 0V3a2 2 0 00-2 2v2m0 0h2m0 0v2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {teamData.trackMethod === 'jira' ? 'Jira tickets' : 'Google sheets'} found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Get started by adding your first {teamData.trackMethod === 'jira' ? 'Jira ticket' : 'Google Sheet'} using the button above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Add {teamData.trackMethod === 'jira' ? 'Jira Ticket' : 'Google Sheet'} Link
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="link-input" className="block text-sm font-semibold text-gray-900 mb-3">
                  {teamData.trackMethod === 'jira' ? 'Jira Ticket URL' : 'Google Sheet URL'}
                </label>
                <input
                  id="link-input"
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder={teamData.trackMethod === 'jira'
                    ? 'https://company.atlassian.net/browse/TICKET-123'
                    : 'https://docs.google.com/spreadsheets/d/...'
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={!linkInput.trim() || addingTask}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                >
                  {addingTask ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Link'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}