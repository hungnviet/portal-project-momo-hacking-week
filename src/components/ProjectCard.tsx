import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  teams: string[];
  progress: number;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-pink-100 text-pink-800';
      case 'Planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'On Hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const encodedProjectName = encodeURIComponent(project.name);

  return (
    <Link href={`/${encodedProjectName}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Progress</span>
            <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ backgroundColor: '#eb2f96', width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.teams.map((team) => (
            <span
              key={team}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              {team}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
