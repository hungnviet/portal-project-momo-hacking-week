'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import TicketCard from '../../../components/TicketCard';
import TeamHeader from '../../../components/TeamHeader';
import TigerLoader from '../../../components/TigerLoader';
import { apiService, type TeamApiResponse, type TaskData, type ApiResponse, type Project, type ProjectDetails, type AddTaskRequest, type AddTaskResponse } from '../../../service';
import { url } from 'inspector';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Fetch team details on component mount
  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all projects to find the matching project and team IDs
      const decodedProjectName = decodeURIComponent(projectName);
      const decodedTeamName = decodeURIComponent(teamName);

      // Fetch all projects to find the one with matching name
      const projectsResponse = await apiService.getProjects();

      if (!apiService.isSuccess(projectsResponse)) {
        setError(apiService.getErrorMessage(projectsResponse));
        return;
      }

      // Find the project with matching name
      const matchingProject = projectsResponse.data.find(
        (p: any) => p.projectName === decodedProjectName
      );

      if (!matchingProject) {
        setError(`Project "${decodedProjectName}" not found`);
        return;
      }

      // Now fetch detailed project data to get team information
      const projectDetailResponse = await apiService.getProject(matchingProject.projectId);

      if (!apiService.isSuccess(projectDetailResponse)) {
        setError(apiService.getErrorMessage(projectDetailResponse));
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
      setProjectId(projectId);

      const response: ApiResponse<TeamApiResponse> = await apiService.getTeamDetails(teamId, projectId);

      if (apiService.isSuccess(response)) {
        const transformedData = transformApiResponseToTeamData(response.data, decodedTeamName, matchingTeam.teamDesc, decodedProjectName, matchingProject.projectDesc);
        setTeamData(transformedData);
      } else {
        setError(apiService.getErrorMessage(response));
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
        duedate: ticket.duedate,
        ticketPriority: ticket.priority,
        ticketStatus: ticket.status,
        startdate: ticket.startdate,
        type: ticket.type as 'jira' | 'sheet',
        url: ticket.url
      }));

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectDescription: teamData.projectDescription,
          teamDescription: teamData.description,
          tasksTable: tasksTable,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  useEffect(() => {
    if (projectName && teamName) {
      fetchTeamDetails();
    }
  }, [projectName, teamName]);

  const handleAddLink = async () => {
    if (linkInput.trim() && teamData && teamId && projectId) {
      try {
        // Basic URL validation
        let url: URL;
        try {
          url = new URL(linkInput.trim());
        } catch (urlError) {
          alert('Please enter a valid URL');
          return;
        }

        // Additional validation based on task type
        if (teamData.trackMethod === 'jira') {
          // Basic validation for Jira URLs (should contain atlassian.net)
          if (!url.hostname.includes('atlassian.net')) {
            const proceed = confirm(
              'This doesn\'t appear to be a Jira URL (should contain atlassian.net). Do you want to add it anyway?'
            );
            if (!proceed) return;
          }
        } else {
          // Basic validation for Google Sheets URLs
          if (!url.hostname.includes('docs.google.com') || !url.pathname.includes('spreadsheets')) {
            const proceed = confirm(
              'This doesn\'t appear to be a Google Sheets URL. Do you want to add it anyway?'
            );
            if (!proceed) return;
          }
        }

        setAddingTask(true);

        // Determine task type based on the team's track method
        const taskType = teamData.trackMethod === 'jira' ? 'jira' : 'sheet';

        // Call the addTask API
        const response = await apiService.addTask(teamId, projectId, {
          type: taskType,
          url: linkInput.trim()
        });

        if (apiService.isSuccess(response)) {
          console.log('Task added successfully:', response.data);

          // Refresh the team data to show the new task
          await fetchTeamDetails();
        } else {
          // Handle error case
          const errorMessage = apiService.getErrorMessage(response);
          console.error('Failed to add task:', errorMessage);
          alert(`Failed to add task: ${errorMessage}`);
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
    }
  };

  const handleCloseModal = () => {
    setLinkInput('');
    setShowAddModal(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/${projectName}`}
              className="flex items-center gap-2 hover:underline"
              style={{ color: '#eb2f96' }}
            >
              ← Back to {decodeURIComponent(projectName)}
            </Link>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <TigerLoader size="lg" className="mx-auto mb-4" />
              <p className="text-gray-600">Loading team details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/${projectName}`}
              className="flex items-center gap-2 hover:underline"
              style={{ color: '#eb2f96' }}
            >
              ← Back to {decodeURIComponent(projectName)}
            </Link>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-red-600 font-medium mb-2">Error loading team details</p>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-white px-4 py-2 rounded transition-colors"
                style={{ backgroundColor: '#eb2f96' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d61c6a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eb2f96'}
              >
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/${projectName}`}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              ← Back to {decodeURIComponent(projectName)}
            </Link>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-gray-600">No team data found</p>
            </div>
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
            href={`/${projectName}`}
            className="flex items-center gap-2 hover:underline"
            style={{ color: '#eb2f96' }}
          >
            ← Back to {decodeURIComponent(projectName)}
          </Link>
        </div>

        {/* Team Header */}
        <TeamHeader team={{ ...teamData, tickets: teamData.tickets }} />

        {/* Generate Summary Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Project Summary</h2>
            <button
              onClick={generateSummary}
              disabled={generatingSummary}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#eb2f96',
                '--tw-ring-color': '#eb2f96'
              } as React.CSSProperties}
              onMouseEnter={(e) => !generatingSummary && (e.currentTarget.style.backgroundColor = '#d61c6a')}
              onMouseLeave={(e) => !generatingSummary && (e.currentTarget.style.backgroundColor = '#eb2f96')}
            >
              {generatingSummary ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Summary
                </>
              )}
            </button>
          </div>

          {summary && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Generated Summary</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</div>
            </div>
          )}

          {!summary && !generatingSummary && (
            <p className="text-gray-500 text-sm">Click "Generate Summary" to create an AI-powered project report based on your current tasks and progress.</p>
          )}
        </div>

        {/* Tickets Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Tasks & Tickets ({teamData.completedTickets}/{teamData.totalTickets} completed)
            </h2>
            <div className="flex gap-2">
              {teamData.trackMethod === 'jira' ? (
                <>
                  <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#f0f9ff', color: '#0369a1' }}>
                    Jira Tickets
                  </span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: '#eb2f96',
                      '--tw-ring-color': '#eb2f96'
                    } as React.CSSProperties}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d61c6a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eb2f96'}
                  >
                    <svg
                      className="-ml-1 mr-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Ticket
                  </button>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Sheet Rows
                  </span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <svg
                      className="-ml-1 mr-1 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Row
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {teamData.trackMethod === 'jira' ? (
              // For Jira teams: always show tickets (or empty state if none)
              teamData.tickets.length > 0 ? (
                teamData.tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No tickets yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first Jira ticket using the button above.
                  </p>
                </div>
              )
            ) : (
              // For Sheet teams: show tickets if any, otherwise show empty state
              teamData.tickets.length > 0 ? (
                teamData.tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No tasks yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first Google Sheet using the button above.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add {teamData.trackMethod === 'jira' ? 'Jira Ticket' : 'Google Sheet'} Link
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label htmlFor="link-input" className="block text-sm font-semibold text-gray-800 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:placeholder-gray-400"
                  style={{ '--tw-ring-color': '#eb2f96', borderColor: '#eb2f96' } as React.CSSProperties}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={!linkInput.trim() || addingTask}
                  className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  style={{
                    backgroundColor: '#eb2f96',
                    '--tw-ring-color': '#eb2f96'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#d61c6a')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#eb2f96')}
                >
                  {addingTask ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
