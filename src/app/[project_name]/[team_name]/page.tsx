'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import TicketCard from '../../../components/TicketCard';
import TeamHeader from '../../../components/TeamHeader';

// Mock data for team details
const getTeamDetails = (projectName: string, teamName: string) => {
  // In real app, this would fetch from API
  // Determine track method based on team name (or could be based on other logic)
  const trackMethod = teamName.toLowerCase().includes('sheet') ? 'sheet' : 'jira';

  // Check if this is an empty team (for demonstration)
  const isEmpty = teamName.toLowerCase().includes('empty') || teamName.toLowerCase().includes('new');

  if (trackMethod === 'jira') {
    return {
      id: teamName,
      name: decodeURIComponent(teamName),
      projectName: decodeURIComponent(projectName),
      progress: isEmpty ? 0 : 70,
      totalTickets: isEmpty ? 0 : 12,
      completedTickets: isEmpty ? 0 : 8,
      status: isEmpty ? 'Not Started' : 'On Track',
      trackMethod: 'jira',
      tickets: isEmpty ? [] : [
        {
          id: 'TECH-001',
          title: 'Setup API endpoints for user authentication',
          status: 'Completed',
          assignee: 'Sarah Wilson',
          priority: 'High',
          dueDate: '2024-02-15',
          jiraUrl: 'https://company.atlassian.net/browse/TECH-001',
          type: 'jira'
        },
        {
          id: 'TECH-002',
          title: 'Implement mobile responsive design',
          status: 'In Progress',
          assignee: 'Mike Chen',
          priority: 'Medium',
          dueDate: '2024-02-20',
          jiraUrl: 'https://company.atlassian.net/browse/TECH-002',
          type: 'jira'
        },
        {
          id: 'TECH-003',
          title: 'Database optimization',
          status: 'To Do',
          assignee: 'Alex Johnson',
          priority: 'High',
          dueDate: '2024-02-25',
          jiraUrl: 'https://company.atlassian.net/browse/TECH-003',
          type: 'jira'
        }
      ]
    };
  } else {
    return {
      id: teamName,
      name: decodeURIComponent(teamName),
      projectName: decodeURIComponent(projectName),
      progress: isEmpty ? 0 : 65,
      totalTickets: isEmpty ? 0 : 10,
      completedTickets: isEmpty ? 0 : 6,
      status: isEmpty ? 'Not Started' : 'On Track',
      trackMethod: 'sheet',
      tickets: isEmpty ? [] :
        [
          {
            id: 'SHEET-001',
            title: 'Database migration planning',
            status: 'Completed',
            assignee: 'Alex Johnson',
            priority: 'High',
            dueDate: '2024-02-15',
            sheetUrl: 'https://docs.google.com/spreadsheets/d/abc123',
            type: 'sheet',
            rowNumber: 15
          },
          {
            id: 'SHEET-002',
            title: 'User research analysis',
            status: 'In Progress',
            assignee: 'Sarah Wilson',
            priority: 'Medium',
            dueDate: '2024-02-20',
            sheetUrl: 'https://docs.google.com/spreadsheets/d/abc123',
            type: 'sheet',
            rowNumber: 16
          },
          {
            id: 'SHEET-003',
            title: 'Feature requirement documentation',
            status: 'To Do',
            assignee: 'Mike Chen',
            priority: 'Low',
            dueDate: '2024-02-25',
            sheetUrl: 'https://docs.google.com/spreadsheets/d/abc123',
            type: 'sheet',
            rowNumber: 17
          }
        ]
    };
  }
};

export default function TeamDetailPage() {
  const params = useParams();
  const projectName = params.project_name as string;
  const teamName = params.team_name as string;
  const teamData = getTeamDetails(projectName, teamName);

  // State for popup modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  const handleAddLink = () => {
    if (linkInput.trim()) {
      // Here you would typically save the link to your backend
      console.log(`Adding ${teamData.trackMethod} link:`, linkInput);

      // For now, just open the link in a new tab
      window.open(linkInput, '_blank');

      // Reset and close modal
      setLinkInput('');
      setShowAddModal(false);
    }
  };

  const handleCloseModal = () => {
    setLinkInput('');
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href={`/${projectName}`}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to {decodeURIComponent(projectName)}
          </Link>
        </div>

        {/* Team Header */}
        <TeamHeader team={teamData} />

        {/* Tickets Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Tasks & Tickets ({teamData.completedTickets}/{teamData.totalTickets} completed)
            </h2>
            <div className="flex gap-2">
              {teamData.trackMethod === 'jira' ? (
                <>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Jira Tickets
                  </span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Sheet Rows
                </span>
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
              // For Sheet teams: show tickets if any, otherwise show the "Add Google Sheet" button
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
                    Get started by creating your first Google Sheet.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
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
                      Add Google Sheet
                    </button>
                  </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:placeholder-gray-400"
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
                  disabled={!linkInput.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
