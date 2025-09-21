'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProjectProgress from '@/components/ProjectProgress';
import TeamSection from '@/components/TeamSection';
import ProjectComments from '@/components/ProjectComments';

// Mock data for project details
const getProjectDetails = (projectName: string) => {
  // In real app, this would fetch from API
  return {
    id: '1',
    name: decodeURIComponent(projectName),
    description: 'Complete redesign of the mobile application with new UI/UX to improve user experience and modernize the interface.',
    status: 'In Progress',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    progress: 65,
    owner: 'John Smith (BU Team)',
    teams: [
      {
        id: 'technology',
        name: 'Technology',
        progress: 70,
        ticketCount: 12,
        completedTickets: 8,
        status: 'On Track'
      },
      {
        id: 'media',
        name: 'Media',
        progress: 45,
        ticketCount: 8,
        completedTickets: 4,
        status: 'Behind Schedule'
      },
      {
        id: 'design',
        name: 'Design',
        progress: 80,
        ticketCount: 6,
        completedTickets: 5,
        status: 'Ahead of Schedule'
      }
    ]
  };
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectName = params.project_name as string;
  const project = getProjectDetails(projectName);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Owner: {project.owner}</span>
                <span>Status: {project.status}</span>
                <span>Start: {project.startDate}</span>
                <span>End: {project.endDate}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{project.progress}%</div>
              <div className="text-sm text-gray-500">Overall Progress</div>
            </div>
          </div>
          
          <ProjectProgress progress={project.progress} />
        </div>

        {/* Teams Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contributing Teams</h2>
            <div className="space-y-4">
              {project.teams.map((team) => (
                <TeamSection 
                  key={team.id} 
                  team={team} 
                  projectName={projectName}
                />
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Comments</h2>
            <ProjectComments projectId={project.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
