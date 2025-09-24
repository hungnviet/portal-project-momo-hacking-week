'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CacheManager, CACHE_KEYS } from '../utils/cache';

export interface TaskStatus {
    taskId: number;
    projectId: number;
    teamId: number;
    url: string;
    status: string;
    type: number;
    title?: string;
    assignee?: string;
    duedate?: string;
    startdate?: string;
    updated?: string;
}export interface ProjectProgress {
    projectId: number;
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    otherStatusTasks: number;
    progress: number; // percentage
    statusBreakdown: {
        [status: string]: number;
    };
}

export interface TeamProgress {
    teamId: number;
    projectId: number;
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    otherStatusTasks: number;
    progress: number; // percentage
    statusBreakdown: {
        [status: string]: number;
    };
}

interface TaskStatusContextType {
    tasks: TaskStatus[];
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;

    // Helper functions
    getProjectProgress: (projectId: number) => ProjectProgress | null;
    getTeamProgress: (projectId: number, teamId: number) => TeamProgress | null;
    getTasksByProject: (projectId: number) => TaskStatus[];
    getTasksByTeam: (projectId: number, teamId: number) => TaskStatus[];
    getNotDoneTasksByTeam: (projectId: number, teamId: number) => TaskStatus[];

    // Refresh and cache functions
    refreshTasks: () => Promise<void>;
    clearCache: () => void;
}const TaskStatusContext = createContext<TaskStatusContextType | undefined>(undefined);

interface TaskStatusProviderProps {
    children: ReactNode;
}

export function TaskStatusProvider({ children }: TaskStatusProviderProps) {
    const [tasks, setTasks] = useState<TaskStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Fetch tasks from API
    const fetchTasks = async (forceRefresh: boolean = false) => {
        try {
            // Check cache first unless force refresh is requested
            if (!forceRefresh) {
                const cachedTasks = CacheManager.get<TaskStatus[]>(CACHE_KEYS.TASK_STATUS);
                if (cachedTasks) {
                    setTasks(cachedTasks);
                    const cacheInfo = CacheManager.getInfo(CACHE_KEYS.TASK_STATUS);
                    setLastUpdated(cacheInfo?.timestamp || new Date());
                    setLoading(false);
                    setError(null);
                    console.log('✅ Loaded task statuses from cache');
                    return;
                }
            }

            setLoading(true);
            setError(null);

            console.log('🔄 Fetching task statuses from API...');
            const response = await fetch('/api/tasks-status');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.status === 'success') {
                const taskData = result.data || [];
                setTasks(taskData);
                setLastUpdated(new Date());

                // Cache the data
                CacheManager.set(CACHE_KEYS.TASK_STATUS, taskData);

                console.log(`✅ Successfully loaded ${taskData.length} tasks from API`);
            } else {
                throw new Error(result.message || 'Failed to fetch tasks');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch task statuses';
            console.error('❌ Error fetching tasks:', errorMessage);
            setError(errorMessage);
            setTasks([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };    // Initial fetch on mount
    useEffect(() => {
        fetchTasks();
    }, []);

    // Helper function to calculate project progress
    const getProjectProgress = (projectId: number): ProjectProgress | null => {
        const projectTasks = tasks.filter(task => task.projectId === projectId);

        if (projectTasks.length === 0) {
            return null;
        }

        const totalTasks = projectTasks.length;
        const doneTasks = projectTasks.filter(task =>
            task.status.toLowerCase() === 'done' ||
            task.status.toLowerCase() === 'completed' ||
            task.status.toLowerCase() === 'closed'
        ).length;

        const inProgressTasks = projectTasks.filter(task =>
            task.status.toLowerCase().includes('progress') ||
            task.status.toLowerCase().includes('developing') ||
            task.status.toLowerCase() === 'in review'
        ).length;

        const otherStatusTasks = totalTasks - doneTasks - inProgressTasks;
        const progress = Math.round((doneTasks / totalTasks) * 100);

        // Create status breakdown
        const statusBreakdown: { [status: string]: number } = {};
        projectTasks.forEach(task => {
            const status = task.status;
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        });

        return {
            projectId,
            totalTasks,
            doneTasks,
            inProgressTasks,
            otherStatusTasks,
            progress,
            statusBreakdown
        };
    };

    // Helper function to calculate team progress
    const getTeamProgress = (projectId: number, teamId: number): TeamProgress | null => {
        const teamTasks = tasks.filter(task =>
            task.projectId === projectId && task.teamId === teamId
        );

        if (teamTasks.length === 0) {
            return null;
        }

        const totalTasks = teamTasks.length;
        const doneTasks = teamTasks.filter(task =>
            task.status.toLowerCase() === 'done' ||
            task.status.toLowerCase() === 'completed' ||
            task.status.toLowerCase() === 'closed'
        ).length;

        const inProgressTasks = teamTasks.filter(task =>
            task.status.toLowerCase().includes('progress') ||
            task.status.toLowerCase().includes('developing') ||
            task.status.toLowerCase() === 'in review'
        ).length;

        const otherStatusTasks = totalTasks - doneTasks - inProgressTasks;
        const progress = Math.round((doneTasks / totalTasks) * 100);

        // Create status breakdown
        const statusBreakdown: { [status: string]: number } = {};
        teamTasks.forEach(task => {
            const status = task.status;
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
        });

        return {
            teamId,
            projectId,
            totalTasks,
            doneTasks,
            inProgressTasks,
            otherStatusTasks,
            progress,
            statusBreakdown
        };
    };

    // Helper function to get tasks by project
    const getTasksByProject = (projectId: number): TaskStatus[] => {
        return tasks.filter(task => task.projectId === projectId);
    };

    // Helper function to get tasks by team
    const getTasksByTeam = (projectId: number, teamId: number): TaskStatus[] => {
        return tasks.filter(task => task.projectId === projectId && task.teamId === teamId);
    };

    // Helper function to get not-done tasks by team
    const getNotDoneTasksByTeam = (projectId: number, teamId: number): TaskStatus[] => {
        return tasks.filter(task => 
            task.projectId === projectId && 
            task.teamId === teamId &&
            !(task.status.toLowerCase() === 'done' ||
              task.status.toLowerCase() === 'completed' ||
              task.status.toLowerCase() === 'closed')
        );
    };

    // Refresh function
    const refreshTasks = async () => {
        await fetchTasks(true); // Force refresh
    };

    // Clear cache function
    const clearCache = () => {
        CacheManager.remove(CACHE_KEYS.TASK_STATUS);
        console.log('🧹 Task status cache cleared');
    };

    const contextValue: TaskStatusContextType = {
        tasks,
        loading,
        error,
        lastUpdated,
        getProjectProgress,
        getTeamProgress,
        getTasksByProject,
        getTasksByTeam,
        getNotDoneTasksByTeam,
        refreshTasks,
        clearCache
    };

    return (
        <TaskStatusContext.Provider value={contextValue}>
            {children}
        </TaskStatusContext.Provider>
    );
}

// Custom hook to use the TaskStatus context
export function useTaskStatus() {
    const context = useContext(TaskStatusContext);
    if (context === undefined) {
        throw new Error('useTaskStatus must be used within a TaskStatusProvider');
    }
    return context;
}