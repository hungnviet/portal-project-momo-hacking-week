'use client';

import { useState } from 'react';
import { apiService, CreateProjectRequest, CreateProjectResponse, ApiResponse } from '../service';
import NotificationPopup from './NotificationPopup';

interface Team {
  id: string;
  teamName: string;
  PODomain: string;
  teamDesc: string;
  trackingMethod: 'Jira' | 'Sheet';
}

interface CreateProjectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: () => void; // Callback to refresh the parent component
}

export default function CreateProjectPopup({ isOpen, onClose, onProjectCreated }: CreateProjectPopupProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    teams: [] as Team[]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      // Prepare the request data to match CreateProjectRequest interface
      const projectRequest: CreateProjectRequest = {
        projectName: formData.name,
        projectDesc: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        teams: formData.teams.map(team => ({
          teamName: team.teamName,
          teamDesc: team.teamDesc,
          PODomain: team.PODomain,
          type: team.trackingMethod === 'Sheet' ? 0 : 1 // Convert string to numeric: Sheet=0, Jira=1
        }))
      };

      const response = await apiService.createProject(projectRequest);

      if (apiService.isSuccess(response)) {
        console.log('Project created successfully:', response.data);

        // Show success notification
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Project Created Successfully!',
          message: `Project "${formData.name}" has been created successfully and is now available in your project list.`
        });

        // Reset form
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          teams: []
        });

        // Call the refresh callback to reload projects in parent component
        if (onProjectCreated) {
          onProjectCreated();
        }
      } else {
        const errorMessage = apiService.getErrorMessage(response);
        setError(errorMessage);

        // Show error notification
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Failed to Create Project',
          message: errorMessage || 'An unexpected error occurred while creating the project. Please try again.'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      setError(errorMessage);

      // Show error notification
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Failed to Create Project',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTeam = () => {
    const newTeam: Team = {
      id: Date.now().toString(),
      teamName: '',
      PODomain: '',
      teamDesc: '',
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

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
    // Close the popup after successful creation
    if (notification.type === 'success') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-200 focus:border-gray-300 placeholder:text-gray-400 text-gray-900"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-200 focus:border-gray-300 placeholder:text-gray-400 text-gray-900"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-200 focus:border-gray-300 text-gray-900"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-200 focus:border-gray-300 text-gray-900"
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
                          value={team.teamName}
                          onChange={(e) => updateTeam(team.id, 'teamName', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 placeholder:text-gray-400 text-gray-900"
                        />
                        <input
                          type="text"
                          placeholder="PO Domain"
                          value={team.PODomain}
                          onChange={(e) => updateTeam(team.id, 'PODomain', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 placeholder:text-gray-400 text-gray-900"
                        />
                        <select
                          value={team.trackingMethod}
                          onChange={(e) => updateTeam(team.id, 'trackingMethod', e.target.value as 'Jira' | 'Sheet')}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 text-gray-900 bg-white"
                        >
                          <option value="Jira">Jira</option>
                          <option value="Sheet">Sheet</option>
                        </select>
                        <textarea
                          placeholder="Description"
                          value={team.teamDesc}
                          onChange={(e) => updateTeam(team.id, 'teamDesc', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-200 focus:border-gray-300 placeholder:text-gray-400 text-gray-900"
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
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#eb2f96' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#d61c6a')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#eb2f96')}
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
        autoClose={false}
      />
    </>
  );
}
