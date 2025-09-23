import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/email._service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectName, teams, currentUrl } = body;

        if (!projectName || !teams || !Array.isArray(teams) || !currentUrl) {
            return NextResponse.json(
                { error: 'Missing required fields: projectName, teams, currentUrl' },
                { status: 400 }
            );
        }

        // Send emails to all PO domains
        const emailPromises = teams.map((team: { teamName: string; PODomain: string }) =>
            emailService.sendProjectAssignmentEmail(
                projectName,
                team.teamName,
                team.PODomain,
                currentUrl
            )
        );

        await Promise.all(emailPromises);

        return NextResponse.json({
            success: true,
            message: 'Assignment emails sent successfully'
        });

    } catch (error) {
        console.error('Error sending assignment emails:', error);
        return NextResponse.json(
            { error: 'Failed to send assignment emails' },
            { status: 500 }
        );
    }
}