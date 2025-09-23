import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  progress: number;
  ticketCount: number;
  completedTickets: number;
  status: string;
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

  const encodedTeamName = encodeURIComponent(team.name);

  return (
    <Link href={`/${projectName}/${encodedTeamName}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
            {team.status}
          </span>
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
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-700">{team.taskStats.doneTasks}</div>
              <div className="text-green-600">Done</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-700">{team.taskStats.inProgressTasks}</div>
              <div className="text-blue-600">In Progress</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-semibold text-gray-700">{team.taskStats.totalTasks}</div>
              <div className="text-gray-600">Total</div>
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
  );
}
