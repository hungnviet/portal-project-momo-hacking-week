interface Team {
  id: string;
  name: string;
  description: string;
  projectName: string;
  progress: number;
  totalTickets: number;
  completedTickets: number;
  status: string;
  tickets?: Array<{
    id: string;
    title: string;
    status: string;
    assignee: string;
    priority: string;
    startdate: string;
    duedate: string;
    jiraUrl?: string;
    sheetUrl?: string;
    type: 'jira' | 'sheet';
    rowNumber?: number;
  }>;
}

interface TeamHeaderProps {
  team: Team;
}

export default function TeamHeader({ team }: TeamHeaderProps) {
  const copyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here if you have a notification system
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-green-100 text-green-800';
      case 'Behind Schedule':
        return 'bg-red-100 text-red-800';
      case 'Ahead of Schedule':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateSLA = () => {
    if (!team.tickets || team.tickets.length === 0) {
      return null;
    }

    // Find the latest due date among all tickets
    let latestDueDate: Date | null = null;

    for (const ticket of team.tickets) {
      if (ticket.duedate) {
        const dueDate = new Date(ticket.duedate);
        // Skip invalid dates
        if (isNaN(dueDate.getTime())) continue;

        if (!latestDueDate || dueDate > latestDueDate) {
          latestDueDate = dueDate;
        }
      }
    }

    if (!latestDueDate) {
      return null;
    }

    // Calculate time difference
    const now = new Date();
    const timeDiff = latestDueDate.getTime() - now.getTime();

    // If the date has passed, return negative values
    const isPastDue = timeDiff < 0;
    const absDiff = Math.abs(timeDiff);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      days,
      hours,
      minutes,
      isPastDue,
      formattedTime: `${days}d ${hours}h ${minutes}m`
    };
  };

  const slaInfo = calculateSLA();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
            <button
              onClick={copyCurrentUrl}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Copy current URL"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">{team.description}</p>
        </div>
        <div className="text-right flex gap-6">
          <div>
            <div className="text-2xl font-bold" style={{ color: '#eb2f96' }}>{team.progress}%</div>
            <div className="text-sm text-gray-500">Team Progress</div>
          </div>
          {slaInfo && (
            <div>
              <div className={`text-2xl font-bold ${slaInfo.isPastDue ? 'text-red-600' : 'text-green-600'}`}>
                {slaInfo.isPastDue ? '-' : ''}{slaInfo.formattedTime}
              </div>
              <div className="text-sm text-gray-500">
                SLA {slaInfo.isPastDue ? '(Overdue)' : '(Remaining)'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(team.status)}`}>
            {team.status}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">{team.completedTickets}</span> of{' '}
          <span className="font-medium">{team.totalTickets}</span> tasks completed
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{ backgroundColor: '#eb2f96', width: `${team.progress}%` }}
        />
      </div>
    </div>
  );
}
