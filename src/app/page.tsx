'use client';

import { useState } from 'react';
import CreateProjectPopup from '../components/CreateProjectPopup';
import ProjectCard from '../components/ProjectCard';

// Mock data for projects
const mockProjects = [
  {
    id: '1',
    name: 'Mobile App Redesign',
    description: 'Complete redesign of the mobile application with new UI/UX',
    status: 'In Progress',
    teams: ['Technology', 'Media', 'Design'],
    progress: 65
  },
  {
    id: '2',
    name: 'Marketing Campaign Q4',
    description: 'Launch new marketing campaign for Q4 products',
    status: 'Planning',
    teams: ['Media', 'Marketing'],
    progress: 25
  }
];

export default function HomePage() {
  const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BU Project Portal</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your business unit projects</p>
          </div>
          <button 
            onClick={() => setIsCreatePopupOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Project
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {/* Create Project Popup */}
        {isCreatePopupOpen && (
          <CreateProjectPopup 
            isOpen={isCreatePopupOpen}
            onClose={() => setIsCreatePopupOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
