interface Team {
  id: string;
  name: string;
  projectName: string;
  progress: number;
  totalTickets: number;
  completedTickets: number;
  status: string;
}

interface TeamHeaderProps {
  team: Team;
}

export default function TeamHeader({ team }: TeamHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'bg-green-100 text-green-800';
      case 'Behind Schedule':
        return 'bg-red-100 text-red-800';
      case 'Ahead of Schedule':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{team.name} Team</h1>
          <p className="text-gray-600">Contributing to: {team.projectName}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{team.progress}%</div>
          <div className="text-sm text-gray-500">Team Progress</div>
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
          className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
          style={{ width: `${team.progress}%` }}
        />
      </div>
    </div>
  );
}
