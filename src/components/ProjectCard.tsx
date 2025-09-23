import Link from 'next/link';

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
  } | null;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'In Progress':
        return {
          bg: 'bg-gradient-to-r from-blue-400 to-blue-300',
          text: 'text-white',
          dot: 'bg-blue-300',
          glow: 'shadow-blue-200'
        };
      case 'Planning':
        return {
          bg: 'bg-gradient-to-r from-pink-200 to-pink-100',
          text: 'text-pink-800',
          dot: 'bg-pink-300',
          glow: 'shadow-pink-200'
        };
      case 'Completed':
        return {
          bg: 'bg-gradient-to-r from-pink-400 to-pink-300',
          text: 'text-white',
          dot: 'bg-pink-300',
          glow: 'shadow-pink-200'
        };
      case 'On Hold':
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-blue-50',
          text: 'text-blue-800',
          dot: 'bg-blue-200',
          glow: 'shadow-blue-100'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-pink-100 to-blue-100',
          text: 'text-gray-800',
          dot: 'bg-pink-200',
          glow: 'shadow-pink-100'
        };
    }
  };

  const encodedProjectName = encodeURIComponent(project.name);
  const statusConfig = getStatusConfig(project.status);

  return (
    <Link href={`/${encodedProjectName}`}>
      <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-gray-200 p-6 hover-lift cursor-pointer overflow-hidden relative animate-fade-in-up">
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white/30 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Content */}
        <div className="relative">
          {/* Header with title and status */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-pink-800 transition-colors truncate mb-1">
                {project.name}
              </h3>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse-slow`}></div>
                <span className="text-sm text-gray-600 font-medium">
                  {project.status}
                </span>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} shadow-lg ${statusConfig.glow} group-hover:scale-105 transition-transform`}>
              {project.status}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          {/* Progress Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {project.progress}%
              </span>
            </div>

            {/* Progress bar with gradient */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${project.progress}%` }}
              />
            </div>

            {/* Task Statistics */}
            {project.taskStats && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100 group-hover:shadow-sm transition-shadow">
                  <div className="text-lg font-bold text-green-700">{project.taskStats.doneTasks}</div>
                  <div className="text-xs text-green-600 font-medium">Done</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100 group-hover:shadow-sm transition-shadow">
                  <div className="text-lg font-bold text-blue-700">{project.taskStats.inProgressTasks}</div>
                  <div className="text-xs text-blue-600 font-medium">In Progress</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-100 group-hover:shadow-sm transition-shadow">
                  <div className="text-lg font-bold text-gray-700">{project.taskStats.totalTasks}</div>
                  <div className="text-xs text-gray-600 font-medium">Total</div>
                </div>
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Teams</span>
            <div className="flex flex-wrap gap-2">
              {project.teams.map((team, index) => (
                <span
                  key={team}
                  className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200 group-hover:scale-105 transition-transform"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></div>
                  {team}
                </span>
              ))}
            </div>
          </div>

          {/* Hover indicator */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
