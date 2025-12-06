import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, html, text, from } = request.body;

    // Get SMTP credentials from environment variables
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;

    if (!smtpUser || !smtpPass) {
        return response.status(500).json({ error: 'SMTP credentials not configured' });
    }

    try {
        // Create reusable transporter object using the default SMTP transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: from || `"Schönheitslokal" <${smtpUser}>`, // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            html: html, // html body
        });

        console.log('Message sent: %s', info.messageId);
        return response.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        return response.status(500).json({ error: 'Failed to send email', details: (error as any).message });
    }
}
