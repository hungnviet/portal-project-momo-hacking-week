// Internal functions for fetching data from external sources

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  status: {
    name: string;
  };
  assignee: {
    displayName: string;
  } | null;
  priority: {
    name: string;
  };
  duedate: string | null;
}

export interface SheetRow {
  taskId: string;
  taskDesc: string;
  status: string;
  assignee: string;
  dueDate: string;
}

/**
 * Fetch Jira ticket data from Jira URL
 * @param jiraUrl - The Jira ticket URL
 * @returns Promise<JiraTicket | null>
 */
export async function fetchJiraTicket(jiraUrl: string): Promise<JiraTicket | null> {
  try {
    // Extract ticket key from URL (e.g., PROJ-123)
    const ticketKeyMatch = jiraUrl.match(/([A-Z]+-\d+)/);
    if (!ticketKeyMatch) {
      throw new Error('Invalid Jira URL format');
    }
    
    const ticketKey = ticketKeyMatch[1];
    const jiraBaseUrl = process.env.JIRA_BASE_URL;
    const jiraAuth = process.env.JIRA_AUTH_TOKEN; // Base64 encoded email:token
    
    if (!jiraBaseUrl || !jiraAuth) {
      throw new Error('Jira configuration missing');
    }

    const apiUrl = `${jiraBaseUrl}/rest/api/3/issue/${ticketKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${jiraAuth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      key: data.key,
      summary: data.fields.summary,
      status: {
        name: data.fields.status.name
      },
      assignee: data.fields.assignee ? {
        displayName: data.fields.assignee.displayName
      } : null,
      priority: {
        name: data.fields.priority.name
      },
      duedate: data.fields.duedate
    };
  } catch (error) {
    console.error('Error fetching Jira ticket:', error);
    return null;
  }
}

/**
 * Fetch Google Sheets row data from sheet URL
 * @param sheetUrl - The Google Sheets URL with row reference
 * @returns Promise<SheetRow | null>
 */
export async function fetchSheetRow(sheetUrl: string): Promise<SheetRow | null> {
  try {
    // Extract sheet ID and range from URL
    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL format');
    }
    
    const sheetId = sheetIdMatch[1];
    const googleApiKey = process.env.GOOGLE_SHEETS_API_KEY;
    
    if (!googleApiKey) {
      throw new Error('Google Sheets API key missing');
    }

    // Extract range from URL if present, default to A:E (assuming task data in columns A-E)
    const rangeMatch = sheetUrl.match(/range=([^&]+)/);
    const range = rangeMatch ? decodeURIComponent(rangeMatch[1]) : 'Sheet1!A:E';
    
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${googleApiKey}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      throw new Error('No data found in sheet');
    }

    // Extract row number from URL or use first data row
    const rowMatch = sheetUrl.match(/row=(\d+)/);
    const rowIndex = rowMatch ? parseInt(rowMatch[1]) - 1 : 1; // -1 for 0-based index, default to row 2 (after header)
    
    const rowData = data.values[rowIndex];
    if (!rowData) {
      throw new Error('Row not found');
    }

    // Assuming columns: A=taskId, B=taskDesc, C=status, D=assignee, E=dueDate
    return {
      taskId: rowData[0] || '',
      taskDesc: rowData[1] || '',
      status: rowData[2] || '',
      assignee: rowData[3] || '',
      dueDate: rowData[4] || ''
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return null;
  }
}

/**
 * Get progress percentage based on task statuses
 * @param tasks - Array of tasks with status information
 * @returns number - Progress percentage (0-100)
 */
export function calculateProgress(tasks: Array<{ status: string }>): number {
  if (tasks.length === 0) return 0;
  
  const completedStatuses = ['Done', 'Completed', 'Closed', 'Resolved'];
  const completedTasks = tasks.filter(task => 
    completedStatuses.some(status => 
      task.status.toLowerCase().includes(status.toLowerCase())
    )
  );
  
  return Math.round((completedTasks.length / tasks.length) * 100);
}

/**
 * Parse task URL to determine type and extract data
 * @param url - Task URL (Jira or Google Sheets)
 * @returns Object with type and parsed data
 */
export function parseTaskUrl(url: string): { type: 'jiraTicket' | 'rowSheet'; data: any } {
  if (url.includes('atlassian.net') || url.includes('jira')) {
    return { type: 'jiraTicket', data: { url } };
  } else if (url.includes('docs.google.com/spreadsheets')) {
    return { type: 'rowSheet', data: { url } };
  } else {
    throw new Error('Unsupported URL type');
  }
}
