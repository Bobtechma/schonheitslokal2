import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { appointmentId } = request.body;
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).json({ error: 'Missing authorization header' });
    }

    if (!appointmentId) {
        return response.status(400).json({ error: 'Missing appointmentId' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !smtpUser || !smtpPass) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // 1. Verify the requester is an admin/owner
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return response.status(401).json({ error: 'Invalid token' });
        }

        const userRole = user.app_metadata?.role || user.user_metadata?.role;
        if (userRole !== 'admin' && userRole !== 'owner') {
            return response.status(403).json({ error: 'Unauthorized: Admin privileges required' });
        }

        // 2. Fetch the appointment details
        // Helper admin client to bypass RLS if needed, though admin/owner should have access
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const { data: apt, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select(`
                id,
                client:clients(full_name, email)
            `)
            .eq('id', appointmentId)
            .single();

        if (fetchError || !apt) {
            return response.status(404).json({ error: 'Appointment not found' });
        }

        // Handle array or object result for joined relation
        const clientData = Array.isArray(apt.client) ? apt.client[0] : apt.client;

        if (!clientData || !clientData.email) {
            return response.status(400).json({ error: 'Client has no email address' });
        }

        const clientName = clientData.full_name || 'Kunde';
        const clientEmail = clientData.email;
        const reviewLink = "https://www.google.com/search?hl=pt-BR&gl=br&q=SCH%C3%96NHEITS+LOKAL,+Kalkbreitestrasse+129,+8003+Z%C3%BCrich,+Su%C3%AD%C3%A7a&ludocid=6949607348882687054&lsig=AB86z5UT8JPNffsFXNTBULEJ6a7n#lrd=0x47900ba66e443055:0x6071f7102e98c44e,3";

        // 3. Send Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        await transporter.sendMail({
            from: `"Schönheitslokal" <${smtpUser}>`,
            to: clientEmail,
            subject: 'Vielen Dank für Ihren Besuch - Schönheitslokal',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ec4899;">Vielen Dank für Ihren Besuch!</h2>
                    <p>Hallo ${clientName},</p>
                    <p>Wir hoffen, Sie waren mit Ihrer Behandlung bei uns zufrieden.</p>
                    <p>Ihre Meinung ist uns sehr wichtig! Wir würden uns freuen, wenn Sie sich einen Moment Zeit nehmen würden, um uns auf Google zu bewerten.</p>
                    <p>
                        <a href="${reviewLink}" style="background-color: #ec4899; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Jetzt bewerten auf Google
                        </a>
                    </p>
                    <p>Falls der Link nicht funktioniert: <a href="${reviewLink}">${reviewLink}</a></p>
                    <p>Herzliche Grüsse,<br>Ihr Schönheitslokal Team</p>
                </div>
            `
        });

        // 4. Update status
        await supabaseAdmin
            .from('appointments')
            .update({ review_email_sent: true })
            .eq('id', appointmentId);

        return response.status(200).json({ success: true, message: 'Review email sent successfully' });

    } catch (error) {
        console.error('Error sending manual review email:', error);
        return response.status(500).json({ error: 'Failed to send email', details: (error as any).message });
    }
}
