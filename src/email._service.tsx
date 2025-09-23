import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

class EmailService {
    async sendMail({ to, subject, text, html }: EmailOptions) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async sendProjectAssignmentEmail(projectName: string, teamName: string, poDomain: string, currentUrl: string) {
        const to = `${poDomain}@mservice.com.vn`;
        const subject = `Project Assignment: ${projectName}`;
        const projectNameEncoded = encodeURIComponent(projectName);
        const teamNameEncoded = encodeURIComponent(teamName);
        const planningUrl = `${currentUrl}/${projectNameEncoded}/${teamNameEncoded}`;

        const text = `You have been assigned to Project: ${projectName}:
Please go to this link and planning: ${planningUrl}`;

        const html = `
            <h2>Project Assignment Notification</h2>
            <p>You have been assigned to Project: <strong>${projectName}</strong></p>
            <p>Please go to this link for planning:</p>
            <p><a href="${planningUrl}" target="_blank">${planningUrl}</a></p>
        `;

        return await this.sendMail({ to, subject, text, html });
    }
}

export const emailService = new EmailService();

