'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTaskStatus } from '../contexts/TaskStatusContext';

interface BurndownChartProps {
    projectId: number;
    teamId?: number; // Make teamId optional for project-level charts
    className?: string;
}

interface ChartDataPoint {
    date: string;
    ideal: number;
    actual: number;
    completed: number;
    remaining: number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        name: string;
        color: string;
        dataKey: string;
    }>;
    label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200/50 backdrop-blur-sm">
                <p className="font-semibold text-gray-900 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-700 capitalize">
                            {entry.name}: <span className="font-medium">{entry.value} tasks</span>
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function BurndownChart({ projectId, teamId, className = '' }: BurndownChartProps) {
    const { tasks, loading, error } = useTaskStatus();

    const chartData = useMemo(() => {
        if (!tasks.length) return [];

        // Filter tasks for this project (and optionally specific team)
        const filteredTasks = tasks.filter(task => {
            if (teamId !== undefined) {
                // Filter for specific team within project
                return task.projectId === projectId && task.teamId === teamId;
            } else {
                // Filter for all tasks in project
                return task.projectId === projectId;
            }
        });

        if (filteredTasks.length === 0) return [];

        // Get all relevant dates from tasks
        const taskDates = new Set<string>();
        const today = new Date();

        filteredTasks.forEach(task => {
            if (task.startdate) {
                taskDates.add(task.startdate);
            }
            if (task.duedate) {
                taskDates.add(task.duedate);
            }
            if (task.updated) {
                taskDates.add(task.updated.split('T')[0]); // Extract date part
            }
        });

        // Add today's date
        const todayStr = today.toISOString().split('T')[0];
        taskDates.add(todayStr);

        // Sort dates and create date range
        const sortedDates = Array.from(taskDates).sort();
        const startDate = new Date(sortedDates[0]);
        const endDate = new Date(Math.max(
            new Date(sortedDates[sortedDates.length - 1]).getTime(),
            today.getTime()
        ));

        // Generate all dates in range
        const dateRange: Date[] = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dateRange.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const totalTasks = filteredTasks.length;
        const totalDays = dateRange.length - 1; // Excluding start date

        // Calculate burndown data for each date
        const data: ChartDataPoint[] = dateRange.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const displayDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            // Calculate ideal burndown (linear)
            const idealRemaining = Math.max(0, totalTasks - (index / totalDays) * totalTasks);

            // Calculate actual completed tasks by this date
            const completedByDate = filteredTasks.filter(task => {
                const isCompleted = task.status.toLowerCase() === 'done' ||
                    task.status.toLowerCase() === 'completed' ||
                    task.status.toLowerCase() === 'closed';

                if (!isCompleted) return false;

                // If task has update date, use that; otherwise assume it was completed by due date or today
                const completionDate = task.updated ?
                    new Date(task.updated.split('T')[0]) :
                    (task.duedate ? new Date(task.duedate) : new Date());

                return completionDate <= date;
            }).length;

            const actualRemaining = Math.max(0, totalTasks - completedByDate);

            return {
                date: displayDate,
                ideal: Math.round(idealRemaining),
                actual: Math.round(actualRemaining),
                completed: completedByDate,
                remaining: actualRemaining
            };
        });

        return data;
    }, [tasks, projectId, teamId]);

    if (loading) {
        return (
            <div className={`glass-card p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Burndown Chart
                    </h2>
                </div>
                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-2"></div>
                        <p className="text-gray-600">Loading burndown data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`glass-card p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Burndown Chart
                    </h2>
                </div>
                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-red-600 font-medium mb-2">Unable to load burndown data</p>
                        <p className="text-gray-500 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className={`glass-card p-6 ${className}`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Burndown Chart
                    </h2>
                </div>
                <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            No tasks found for this {teamId ? "team" : "project"} to generate a burndown chart.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate current performance indicators
    const latestData = chartData[chartData.length - 1];
    const isAheadOfSchedule = latestData ? latestData.actual < latestData.ideal : false;
    const tasksCompleted = latestData ? latestData.completed : 0;
    const totalTasks = chartData.length > 0 ? chartData[0].ideal + chartData[0].completed : 0;
    const completionPercentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    return (
        <div className={`glass-card p-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Burndown Chart
                        </h2>
                        <p className="text-sm text-gray-600">
                            Track {teamId ? "your team's" : "project"} progress against the ideal timeline
                        </p>
                    </div>
                </div>

                {/* Performance Indicators */}
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{completionPercentage}%</p>
                            <p className="text-xs text-gray-500">Complete</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${isAheadOfSchedule
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                            : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200'
                            }`}>
                            {isAheadOfSchedule ? '✓ On Track' : '⚠ Behind Schedule'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            fontSize={12}
                            tick={{ fill: '#6b7280' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            fontSize={12}
                            tick={{ fill: '#6b7280' }}
                            label={{ value: 'Tasks Remaining', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Ideal burndown line */}
                        <Line
                            type="monotone"
                            dataKey="ideal"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            name="ideal"
                        />

                        {/* Actual burndown line */}
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                            name="actual"
                        />

                        {/* Reference line for zero */}
                        <ReferenceLine y={0} stroke="#374151" strokeDasharray="2 2" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-200/50">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-500 border-2 border-dashed"></div>
                    <span className="text-sm text-gray-600">Ideal Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Actual Progress</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tasks: {tasksCompleted}/{totalTasks} completed</span>
                </div>
            </div>
        </div>
    );
}