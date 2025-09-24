import Link from 'next/link';
import { useState } from 'react';
import { useTaskStatus } from '../contexts/TaskStatusContext';

interface Team {
  id: string;
  name: string;
  progress: number;
  ticketCount: number;
  completedTickets: number;
  projectId: number; // Add projectId to get tasks
  taskStats?: {
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    statusBreakdown: { [status: string]: number };
  } | null;
}

interface TeamSectionProps {
  team: Team;
  projectName: string;
}

export default function TeamSection({ team, projectName }: TeamSectionProps) {
  const [showTasks, setShowTasks] = useState(false);
  const { getNotDoneTasksByTeam } = useTaskStatus();

  // Helper function to check if task is overdue
  const isOverdue = (duedate: string | undefined): boolean => {
    if (!duedate) return false;
    const today = new Date();
    const due = new Date(duedate);
    return due < today;
  };

  // Helper function to format date
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get not-done tasks for this team
  const notDoneTasks = getNotDoneTasksByTeam(team.projectId, parseInt(team.id));

  const encodedTeamName = encodeURIComponent(team.name);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Team Header - clickable to go to team detail page */}
      <Link href={`/${projectName}/${encodedTeamName}`}>
        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
          </div>

          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-500">Progress</span>
              <span className="text-sm font-medium text-gray-900">{team.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{ backgroundColor: '#eb2f96', width: `${team.progress}%` }}
              />
            </div>
          </div>

          {/* Enhanced task statistics */}
          {team.taskStats ? (
            <div className="grid grid-cols-3 gap-1 text-xs mb-3">
              <div className="text-center p-1 bg-green-50 rounded flex flex-row items-center justify-center gap-2">
                <div className="font-semibold text-green-700 text-sm">{team.taskStats.doneTasks}</div>
                <div className="text-green-600 text-xs">Done</div>
              </div>
              <div className="text-center p-1 bg-blue-50 rounded flex flex-row items-center justify-center gap-2">
                <div className="font-semibold text-blue-700 text-sm">{team.taskStats.inProgressTasks}</div>
                <div className="text-blue-600 text-xs">In Progress</div>
              </div>
              <div className="text-center p-1 bg-gray-50 rounded flex flex-row items-center justify-center gap-2">
                <div className="font-semibold text-gray-700 text-sm">{team.taskStats.totalTasks}</div>
                <div className="text-gray-600 text-xs">Total</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>Tickets: {team.completedTickets}/{team.ticketCount}</span>
              <span className="text-yellow-600 text-xs">Basic data</span>
            </div>
          )}

          <div className="flex justify-end text-sm text-gray-500">
            <span>→ View Details</span>
          </div>
        </div>
      </Link>

      {/* Tasks Toggle Button */}
      {notDoneTasks.length > 0 && (
        <div className="border-t border-gray-200">
            <span className="flex items-center gap-2">
              <span className="font-medium text-gray-700">
                Task In Progress
              </span>
            </span>
        </div>
      )}

      {/* Tasks List */}
      {true && notDoneTasks.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-h-96 overflow-y-auto">
            {notDoneTasks.map((task, index) => (
              <div
                key={task.taskId}
                className={`p-3 border-b border-gray-200 last:border-b-0 ${
                  isOverdue(task.duedate) ? 'bg-red-50 border-red-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${
                      isOverdue(task.duedate) ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      {task.title || 'Untitled Task'}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {task.assignee || 'Unassigned'}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(task.updated)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status.toLowerCase().includes('progress') 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                    {task.duedate && (
                      <div className={`text-xs mt-1 flex items-center ${
                        isOverdue(task.duedate) ? 'text-red-600 font-medium' : 'text-gray-500'
                      }`}>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due: {formatDate(task.duedate)}
                        {isOverdue(task.duedate) && (
                          <span className="ml-1 text-red-600 font-bold">⚠ OVERDUE</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
