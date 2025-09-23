'use client';

import { useState } from 'react';
import { CreateProjectRequest, CreateProjectResponse, ApiResponse } from '../service';
import { CachedApiService } from '../services/cachedApiService';
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

      const response = await CachedApiService.createProject(projectRequest);

      if (CachedApiService.isSuccess(response)) {
        console.log('Project created successfully:', response.data);

        // Send emails to all PO domains via API route
        const currentUrl = window.location.origin;
        try {
          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectName: formData.name,
              teams: formData.teams.map(team => ({
                teamName: team.teamName,
                PODomain: team.PODomain
              })),
              currentUrl
            })
          });

          if (emailResponse.ok) {
            console.log('All assignment emails sent successfully');
          } else {
            console.error('Failed to send assignment emails');
          }
        } catch (emailError) {
          console.error('Error sending assignment emails:', emailError);
          // Don't fail the entire operation if email sending fails
        }

        // Show success notification
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Project Created Successfully!',
          message: `Project "${formData.name}" has been created successfully and assignment emails have been sent to all PO domains.`
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
        const errorMessage = CachedApiService.getErrorMessage(response);
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
      <div className="fixed inset-0 bg-white/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-up">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-400 to-blue-400 px-8 py-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-1">Create New Project</h2>
                <p className="text-indigo-100">Set up a new project and configure teams</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Project Information Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    Project Information
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">Basic details about your project</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Brief project description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Teams Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Contributing Teams
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">Add teams that will work on this project</p>
                    </div>
                    <button
                      type="button"
                      onClick={addTeam}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-300 to-pink-200 hover:from-pink-400 hover:to-pink-300 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group"
                    >
                      <svg className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Team
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.teams.map((team, index) => (
                    <div key={team.id} className="bg-gradient-to-r from-pink-50 to-blue-50 border border-pink-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-semibold text-gray-800 flex items-center">
                          <div className="w-3 h-3 bg-gradient-to-r from-pink-300 to-blue-300 rounded-full mr-2"></div>
                          Team {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeTeam(team.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Team Name *</label>
                          <input
                            type="text"
                            placeholder="Enter team name"
                            value={team.teamName}
                            onChange={(e) => updateTeam(team.id, 'teamName', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PO Domain *</label>
                          <input
                            type="email"
                            placeholder="po@domain.com"
                            value={team.PODomain}
                            onChange={(e) => updateTeam(team.id, 'PODomain', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Method</label>
                          <select
                            value={team.trackingMethod}
                            onChange={(e) => updateTeam(team.id, 'trackingMethod', e.target.value as 'Jira' | 'Sheet')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white"
                          >
                            <option value="Jira">Jira</option>
                            <option value="Sheet">Google Sheets</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            placeholder="Team description or role"
                            value={team.teamDesc}
                            onChange={(e) => updateTeam(team.id, 'teamDesc', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.teams.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-xl border-dashed">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-600 font-medium mb-2">No teams added yet</p>
                      <p className="text-gray-500 text-sm">Click "Add Team" to get started</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-red-900 font-medium">Error</h4>
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || formData.teams.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center group"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
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
