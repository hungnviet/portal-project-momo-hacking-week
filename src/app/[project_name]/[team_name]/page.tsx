'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import TicketCard from '../../../components/TicketCard';
import TeamHeader from '../../../components/TeamHeader';

// Mock data for team details
const getTeamDetails = (projectName: string, teamName: string) => {
  // In real app, this would fetch from API
  return {
    id: teamName,
    name: decodeURIComponent(teamName),
    projectName: decodeURIComponent(projectName),
    progress: 70,
    totalTickets: 12,
    completedTickets: 8,
    status: 'On Track',
    tickets: [
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
        id: 'SHEET-001',
        title: 'Database migration planning',
        status: 'To Do',
        assignee: 'Alex Johnson',
        priority: 'High',
        dueDate: '2024-02-25',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/abc123',
        type: 'sheet',
        rowNumber: 15
      }
    ]
  };
};

export default function TeamDetailPage() {
  const params = useParams();
  const projectName = params.project_name as string;
  const teamName = params.team_name as string;
  const teamData = getTeamDetails(projectName, teamName);

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
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Jira Tickets
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Sheet Rows
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {teamData.tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
