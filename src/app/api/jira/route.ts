import { NextRequest, NextResponse } from 'next/server';
import { getListGeneralInfoOfJiraTicket } from '@/lib/get-general-info-of-list-jira-ticket';

/**
 * GET /api/jira
 * 
 * Endpoint to fetch general information for a predefined list of Jira tickets
 * No parameters required - uses hardcoded ticket URLs
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`🔍 API Request: Fetching general info for hardcoded Jira tickets`);

    // Hardcoded list of Jira ticket URLs
    const ticketUrls = [
      'https://nvk01052004.atlassian.net/browse/MBA-6',
      'https://nvk01052004.atlassian.net/browse/MBA-3',
      'https://nvk01052004.atlassian.net/browse/MBA-5',
      'https://nvk01052004.atlassian.net/browse/MBA-1',
      'https://nvk01052004.atlassian.net/browse/MBA-2',
      'https://nvk01052004.atlassian.net/browse/MBA-3',
      // Add more ticket URLs as needed
    ];

    console.log(`� Processing ${ticketUrls.length} predefined tickets`);

    // Fetch general information for all tickets
    const ticketsData = await getListGeneralInfoOfJiraTicket(ticketUrls);

    if (!ticketsData || ticketsData.length === 0) {
      return NextResponse.json(
        { 
          error: 'No ticket data retrieved',
          message: 'Could not retrieve data for any of the predefined tickets',
          totalRequested: ticketUrls.length,
          possibleReasons: [
            'Invalid authentication credentials',
            'Tickets do not exist or are not accessible',
            'Network connectivity issues',
            'Jira instance is not accessible'
          ]
        },
        { status: 404 }
      );
    }

    console.log(`✅ API Success: Retrieved ${ticketsData.length}/${ticketUrls.length} tickets`);

    // Calculate summary statistics
    const statusCount = ticketsData.reduce((acc, ticket) => {
      acc[ticket.ticketStatus] = (acc[ticket.ticketStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityCount = ticketsData.reduce((acc, ticket) => {
      acc[ticket.ticketPriority] = (acc[ticket.ticketPriority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const projectCount = ticketsData.reduce((acc, ticket) => {
      acc[ticket.projectName] = (acc[ticket.projectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return successful response with all ticket data
    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${ticketsData.length} Jira tickets`,
      data: ticketsData,
      metadata: {
        fetchedAt: new Date().toISOString(),
        totalRequested: ticketUrls.length,
        totalRetrieved: ticketsData.length,
        successRate: `${Math.round((ticketsData.length / ticketUrls.length) * 100)}%`,
        summary: {
          byStatus: statusCount,
          byPriority: priorityCount,
          byProject: projectCount,
          assignedTickets: ticketsData.filter(t => t.assignee).length,
          unassignedTickets: ticketsData.filter(t => !t.assignee).length
        }
      }
    });

  } catch (error) {
    console.error('❌ API Error in /api/jira:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { 
            error: 'Authentication Error',
            message: error.message,
            hint: 'Check your JIRA_AUTH_TOKEN or JIRA_EMAIL + JIRA_API_TOKEN environment variables'
          },
          { status: 401 }
        );
      }

      if (error.message.includes('permission') || error.message.includes('Access denied')) {
        return NextResponse.json(
          { 
            error: 'Permission Error',
            message: error.message,
            hint: 'Ensure your Jira account has permission to view these tickets'
          },
          { status: 403 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while fetching the Jira tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

