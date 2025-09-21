'use client';

import { useState } from 'react';

interface Team {
  id: string;
  name: string;
  poDomain: string;
  description: string;
  trackingMethod: 'Jira' | 'Sheet';
}

interface CreateProjectPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectPopup({ isOpen, onClose }: CreateProjectPopupProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    teams: [] as Team[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would create the project via API
    console.log('Creating project:', formData);
    onClose();
  };

  const addTeam = () => {
    const newTeam: Team = {
      id: Date.now().toString(),
      name: '',
      poDomain: '',
      description: '',
      trackingMethod: 'Jira'
    };
    setFormData(prev => ({
      ...prev,
      teams: [...prev.teams, newTeam]
    }));
  };

  const updateTeam = (teamId: string, field: keyof Omit<Team, 'id'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.map(team =>
        team.id === teamId ? { ...team, [field]: value } : team
      )
    }));
  };

  const removeTeam = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      teams: prev.teams.filter(team => team.id !== teamId)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                rows={3}
                placeholder="Enter project description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contributing Teams
                </label>
                <button
                  type="button"
                  onClick={addTeam}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  + Add Team
                </button>
              </div>
              <div className="space-y-3">
                {formData.teams.map((team) => (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Team {formData.teams.indexOf(team) + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTeam(team.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        placeholder="Team Name"
                        value={team.name}
                        onChange={(e) => updateTeam(team.id, 'name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                      />
                      <input
                        type="text"
                        placeholder="PO Domain"
                        value={team.poDomain}
                        onChange={(e) => updateTeam(team.id, 'poDomain', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                      />
                      <select
                        value={team.trackingMethod}
                        onChange={(e) => updateTeam(team.id, 'trackingMethod', e.target.value as 'Jira' | 'Sheet')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="Jira">Jira</option>
                        <option value="Sheet">Sheet</option>
                      </select>
                      <textarea
                        placeholder="Description"
                        value={team.description}
                        onChange={(e) => updateTeam(team.id, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                {formData.teams.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No teams added yet. Click "Add Team" to get started.</p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Project
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
