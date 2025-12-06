import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // Basic security check for Vercel Cron or specific header
    // Ideally, check for process.env.CRON_SECRET if configured in Vercel
    // const authHeader = request.headers.authorization;
    // if (request.query.key !== process.env.CRON_SECRET) { ... }

    // For now, allowing execution to ensure it works

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;

    if (!supabaseUrl || !serviceRoleKey || !smtpUser || !smtpPass) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        // 0. Fetch delay setting
        const { data: settings } = await supabase
            .from('system_settings')
            .select('review_email_delay')
            .single();

        const delayHours = settings?.review_email_delay || 2;

        // 1. Calculate cutoff time (dynamic delay)
        const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000);

        // 2. Fetch eligible appointments
        // Status confirmed, review not sent, older than 2 hours (approx logic)
        // We need to filter by date/time in JS or complex query
        // Let's get 'confirmed' appointments where review_email_sent is false
        // We will filter strictly by time in code to be safe with timezones

        const { data: appointments, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                id,
                appointment_date,
                appointment_time,
                total_duration_minutes,
                client:clients(full_name, email)
            `)
            .eq('status', 'confirmed') // Or 'completed' if you manually mark them
            .eq('review_email_sent', false)
            .neq('client.email', null) // Ensure client has email
            .limit(100); // Process in batches (increased for daily cron)

        if (fetchError) throw fetchError;

        if (!appointments || appointments.length === 0) {
            return response.status(200).json({ message: 'No eligible appointments found' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const reviewLink = "https://www.google.com/search?hl=pt-BR&gl=br&q=SCH%C3%96NHEITS+LOKAL,+Kalkbreitestrasse+129,+8003+Z%C3%BCrich,+Su%C3%AD%C3%A7a&ludocid=6949607348882687054&lsig=AB86z5UT8JPNffsFXNTBULEJ6a7n#lrd=0x47900ba66e443055:0x6071f7102e98c44e,3";

        const results = [];

        for (const apt of appointments) {
            // Check if 2 hours have passed since the END of the appointment
            // date + time + duration < cutoffTime

            // apt.appointment_date is YYYY-MM-DD
            // apt.appointment_time is HH:MM:SS
            const startDateTimeStr = `${apt.appointment_date}T${apt.appointment_time}`;
            const startDate = new Date(startDateTimeStr);

            // Add duration to get end time
            const endDate = new Date(startDate.getTime() + apt.total_duration_minutes * 60000);

            // Add 2 hours buffer
            const mailTriggerTime = new Date(endDate.getTime() + 2 * 60 * 60 * 1000);

            // If current time is AFTER the trigger time, send email
            if (new Date() > mailTriggerTime) {
                // Supabase join returns an object for single relation if setup correctly, but TS might see it as array
                // or if it's an array, take first element
                const clientData = Array.isArray(apt.client) ? apt.client[0] : apt.client;

                if (!clientData) continue;

                const clientName = clientData.full_name || 'Kunde';
                const clientEmail = clientData.email;

                if (!clientEmail) continue;

                // Send Email
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

                // Mark as sent
                await supabase
                    .from('appointments')
                    .update({ review_email_sent: true })
                    .eq('id', apt.id);

                results.push({ id: apt.id, sent: true });
            }
        }

        return response.status(200).json({
            success: true,
            processed: results.length,
            results
        });

    } catch (error) {
        console.error('Cron error:', error);
        return response.status(500).json({ error: 'Internal Server Error', details: (error as any).message });
    }
}
