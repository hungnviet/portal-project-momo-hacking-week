// General ticket info interface for list view
export interface JiraTicketGeneralInfo {
  id: string;
  ticketName: string;
  ticketDescription?: string;
  ticketStatus: string;
  ticketPriority: string;
  assignee?: string;
  startdate: string;
  duedate: string;
  updated: string;
  // Additional useful fields
  ticketKey: string;
  projectName: string;
  ticketType: string;
  url: string;
}

/**
 * Fetches general information for a list of Jira tickets
 * @param listUrl - Array of Jira ticket URLs
 * @returns Promise<JiraTicketGeneralInfo[]> - Array of general ticket information
 */
export async function getListGeneralInfoOfJiraTicket(listUrl: string[]): Promise<JiraTicketGeneralInfo[]> {
  if (!listUrl || listUrl.length === 0) {
    console.log('📝 No URLs provided');
    return [];
  }

  console.log(`🔍 Fetching general info for ${listUrl.length} Jira tickets`);

  // Process tickets in parallel with a concurrency limit to avoid overwhelming the API
  const concurrencyLimit = 5; // Fetch max 5 tickets at once
  const results: JiraTicketGeneralInfo[] = [];

  for (let i = 0; i < listUrl.length; i += concurrencyLimit) {
    const batch = listUrl.slice(i, i + concurrencyLimit);
    console.log(`📦 Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(listUrl.length / concurrencyLimit)}`);

    const batchPromises = batch.map(async (url, index) => {
      try {
        const ticketInfo = await fetchSingleTicketGeneralInfo(url);
        if (ticketInfo) {
          console.log(`✅ Fetched: ${ticketInfo.ticketKey} - ${ticketInfo.ticketName}`);
          return ticketInfo;
        } else {
          console.warn(`⚠️ Failed to fetch ticket from: ${url}`);
          return null;
        }
      } catch (error) {
        console.error(`❌ Error fetching ticket ${index + 1} in batch:`, error instanceof Error ? error.message : 'Unknown error');
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Filter out null results and add to main results
    const validResults = batchResults.filter((result): result is JiraTicketGeneralInfo => result !== null);
    results.push(...validResults);

    // Small delay between batches to be nice to the API
    if (i + concurrencyLimit < listUrl.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`🎯 Successfully fetched ${results.length}/${listUrl.length} tickets`);
  return results;
}

/**
 * Fetches general info for a single Jira ticket
 * @param jiraUrl - Single Jira ticket URL
 * @returns Promise<JiraTicketGeneralInfo | null>
 */
async function fetchSingleTicketGeneralInfo(jiraUrl: string): Promise<JiraTicketGeneralInfo | null> {
  try {
    // Parse the Jira URL
    const urlParts = parseJiraUrl(jiraUrl);
    if (!urlParts) {
      throw new Error('Invalid Jira URL format');
    }

    const { baseUrl, issueKey } = urlParts;

    // Get authentication details from environment
    const jiraAuth = process.env.JIRA_AUTH_TOKEN;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraApiToken = process.env.JIRA_API_TOKEN;

    if (!jiraAuth && (!jiraEmail || !jiraApiToken)) {
      throw new Error('Jira authentication credentials missing');
    }

    // Prepare authentication header
    let authHeader: string;
    if (jiraAuth) {
      authHeader = `Basic ${jiraAuth}`;
    } else {
      const credentials = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64');
      authHeader = `Basic ${credentials}`;
    }

    // Construct API URL with specific fields for general info only
    const apiUrl = `${baseUrl}/rest/api/3/issue/${issueKey}`;
    const params = new URLSearchParams({
      fields: [
        'id',
        'key',
        'summary',
        'description',
        'status',
        'priority',
        'assignee',
        'created',
        'project',
        'issuetype',
        'startdate',
        'started',
        'workStarted',
        'duedate',
        'updated'
      ].join(',')
    });

    const fullUrl = `${apiUrl}?${params.toString()}`;

    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for batch processing

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      },
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} - ${response.statusText}`);
    }

    const rawData = await response.json();

    // Transform to general info format
    const generalInfo: JiraTicketGeneralInfo = {
      id: rawData.id,
      ticketKey: rawData.key,
      ticketName: rawData.fields.summary || 'No title',
      ticketDescription: extractTextFromDescription(rawData.fields.description),
      ticketStatus: rawData.fields.status?.name || 'Unknown',
      ticketPriority: rawData.fields.priority?.name || 'None',
      assignee: rawData.fields.assignee?.displayName,
      startdate: rawData.fields.startdate || rawData.fields.started || '',
      duedate: rawData.fields.duedate || '',
      updated: rawData.fields.updated || '',
      projectName: rawData.fields.project?.name || 'Unknown Project',
      ticketType: rawData.fields.issuetype?.name || 'Unknown',
      url: jiraUrl
    };

    return generalInfo;

  } catch (error) {
    console.error(`Error fetching general info for ${jiraUrl}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Parse Jira URL to extract base URL and issue key
 * @param jiraUrl - Full Jira URL
 * @returns Object with baseUrl and issueKey or null if invalid
 */
function parseJiraUrl(jiraUrl: string): { baseUrl: string; issueKey: string } | null {
  try {
    const url = new URL(jiraUrl);

    // Extract base URL (protocol + host)
    const baseUrl = `${url.protocol}//${url.host}`;

    // Extract issue key from path
    // Supports formats like: /browse/PROJ-123, /projects/PROJ/issues/PROJ-123
    const pathMatch = url.pathname.match(/\/(?:browse|issues)\/([A-Z0-9]+-\d+)/i);
    if (!pathMatch) {
      return null;
    }

    const issueKey = pathMatch[1];

    return { baseUrl, issueKey };
  } catch (error) {
    return null;
  }
}

/**
 * Extract plain text from Jira's ADF (Atlassian Document Format) description
 * @param description - ADF description object
 * @returns Plain text string
 */
function extractTextFromDescription(description: any): string {
  if (!description) return '';

  if (typeof description === 'string') {
    return description;
  }

  // Handle ADF format
  if (description.type === 'doc' && description.content) {
    let text = '';

    function extractText(node: any): void {
      if (node.type === 'text') {
        text += node.text;
      } else if (node.content) {
        node.content.forEach(extractText);
      }
    }

    description.content.forEach(extractText);
    return text.trim();
  }

  return JSON.stringify(description);
}