import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getListGeneralInfoOfJiraTicket } from '@/lib/get-general-info-of-list-jira-ticket';
import { getMultipleSheetRowsData } from '@/lib/get-info-of-sheet-row';

interface TaskRecord {
    taskId: string;
    url: string;
    teamId: string;
    projectId: string;
    type: number; // 0 for sheet, 1 for jira
}

interface TaskStatusResponse {
    taskId: string;
    projectId: string;
    teamId: string;
    url: string;
    status: string;
    type: number;
}

export async function GET() {
    try {
        console.log('🔍 Fetching all tasks from database...');

        // Fetch all tasks from database
        const { data: tasks, error: tasksError } = await supabase
            .from('Task')
            .select('*');

        if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
            return NextResponse.json({
                status: 'error',
                errorCode: 'DB_ERROR',
                message: 'Failed to fetch tasks',
                data: null
            }, { status: 500 });
        }

        if (!tasks || tasks.length === 0) {
            console.log('📝 No tasks found in database');
            return NextResponse.json({
                status: 'success',
                message: 'No tasks found',
                data: []
            });
        }

        console.log(`📊 Found ${tasks.length} tasks in database`);

        // Separate tasks by type
        const jiraTasks = tasks.filter(task => task.url.includes('atlassian'));
        const sheetTasks = tasks.filter(task => task.url.includes('google'));

        console.log(`🎯 Jira tasks: ${jiraTasks.length}, Sheet tasks: ${sheetTasks.length}`);

        const taskStatusResults: TaskStatusResponse[] = [];

        // Fetch Jira task statuses
        if (jiraTasks.length > 0) {
            try {
                console.log('🔄 Fetching Jira task statuses...');
                const jiraUrls = jiraTasks.map(task => task.url);
                const jiraTicketsData = await getListGeneralInfoOfJiraTicket(jiraUrls);

                // Map Jira data to response format
                jiraTasks.forEach(task => {
                    const jiraData = jiraTicketsData.find(ticket => ticket.url === task.url);
                    taskStatusResults.push({
                        taskId: task.taskId,
                        projectId: task.projectId,
                        teamId: task.teamId,
                        url: task.url,
                        status: jiraData?.ticketStatus || 'Unknown',
                        type: task.type
                    });
                });
            } catch (jiraError) {
                console.error('❌ Error fetching Jira tasks:', jiraError);
                // Add failed Jira tasks with error status
                jiraTasks.forEach(task => {
                    taskStatusResults.push({
                        taskId: task.taskId,
                        projectId: task.projectId,
                        teamId: task.teamId,
                        url: task.url,
                        status: 'Error fetching status',
                        type: task.type
                    });
                });
            }
        }

        // Fetch Sheet task statuses
        if (sheetTasks.length > 0) {
            try {
                console.log('📋 Fetching Sheet task statuses...');
                const sheetUrls = sheetTasks.map(task => task.url);
                const sheetRowsData = await getMultipleSheetRowsData(sheetUrls);

                // Map Sheet data to response format
                sheetTasks.forEach(task => {
                    const sheetData = sheetRowsData.find(row => row.url === task.url);

                    // Try to find status field (common field names for status)
                    let status = 'Unknown';
                    if (sheetData) {
                        // Check common status field names (case-insensitive)
                        const statusFields = ['status', 'Status', 'STATUS', 'state', 'State', 'progress', 'Progress', 'ticketStatus'];
                        for (const fieldName of statusFields) {
                            if (sheetData[fieldName]) {
                                status = String(sheetData[fieldName]);
                                break;
                            }
                        }

                        // If not found in main fields, check extra object
                        if (status === 'Unknown' && sheetData.extra && typeof sheetData.extra === 'object') {
                            const extraObj = sheetData.extra as { [key: string]: string };
                            for (const fieldName of statusFields) {
                                const lowerFieldName = fieldName.toLowerCase();
                                if (extraObj[lowerFieldName]) {
                                    status = extraObj[lowerFieldName];
                                    break;
                                }
                            }
                        }
                    }

                    taskStatusResults.push({
                        taskId: task.taskId,
                        projectId: task.projectId,
                        teamId: task.teamId,
                        url: task.url,
                        status: status,
                        type: task.type
                    });
                });
            } catch (sheetError) {
                console.error('❌ Error fetching Sheet tasks:', sheetError);
                // Add failed Sheet tasks with error status
                sheetTasks.forEach(task => {
                    taskStatusResults.push({
                        taskId: task.taskId,
                        projectId: task.projectId,
                        teamId: task.teamId,
                        url: task.url,
                        status: 'Error fetching status',
                        type: task.type
                    });
                });
            }
        }

        console.log(`✅ Successfully processed ${taskStatusResults.length} tasks`);

        return NextResponse.json({
            status: 'success',
            message: `Successfully fetched status for ${taskStatusResults.length} tasks`,
            data: taskStatusResults
        });

    } catch (error) {
        console.error('❌ Unexpected error in tasks-status API:', error);
        return NextResponse.json({
            status: 'error',
            errorCode: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred while fetching task statuses',
            data: null
        }, { status: 500 });
    }
}