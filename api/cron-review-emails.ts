import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const smtpUser = process.env.VITE_SMTP_USER;
    const smtpPass = process.env.VITE_SMTP_PASS;
    const wpApiUrl = process.env.VITE_WHATSAPP_API_URL;
    const wpApiToken = process.env.VITE_WHATSAPP_API_TOKEN;

    if (!supabaseUrl || !serviceRoleKey || !smtpUser || !smtpPass) {
        return response.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        // 0. Fetch delay setting
        const { data: settingRow } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'review_email_delay')
            .maybeSingle();

        let delayHours = 2;
        if (settingRow && settingRow.value) {
            delayHours = Number(settingRow.value);
        }

        // 1. Fetch eligible appointments
        // Status 'confirmed' or 'completed', review not yet sent
        const { data: appointments, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                id,
                appointment_date,
                appointment_time,
                total_duration_minutes,
                client:clients(full_name, email, phone)
            `)
            .in('status', ['confirmed', 'completed'])
            .eq('review_email_sent', false)
            .limit(100);

        if (fetchError) throw fetchError;

        if (!appointments || appointments.length === 0) {
            return response.status(200).json({ message: 'No eligible appointments found', processed: 0 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const reviewLink = "https://g.page/r/CU7EmC4Q93FgEAE/review";

        const results: Array<{ id: string; sent: boolean; reason?: string }> = [];

        for (const apt of appointments) {
            try {
                // Parse appointment end time + delay
                const startDateTimeStr = `${apt.appointment_date}T${apt.appointment_time}`;
                const startDate = new Date(startDateTimeStr);
                const endDate = new Date(startDate.getTime() + apt.total_duration_minutes * 60000);
                const mailTriggerTime = new Date(endDate.getTime() + delayHours * 60 * 60 * 1000);

                // Only send if current time is AFTER the trigger time
                if (new Date() <= mailTriggerTime) {
                    continue; // Not time yet
                }

                // Extract client data (Supabase join can return object or array)
                const clientData = Array.isArray(apt.client) ? apt.client[0] : apt.client;

                if (!clientData) {
                    // Mark as sent so we don't retry endlessly
                    await supabase.from('appointments').update({ review_email_sent: true }).eq('id', apt.id);
                    results.push({ id: apt.id, sent: false, reason: 'No client data' });
                    continue;
                }

                const clientEmail = clientData.email;
                const clientName = clientData.full_name || 'Kunde';
                const clientPhone = clientData.phone;

                // Skip if no email, or dummy/temp email
                if (!clientEmail || clientEmail.endsWith('@temp.com') || clientEmail.startsWith('walkin_')) {
                    // Mark as sent so we don't retry forever
                    await supabase.from('appointments').update({ review_email_sent: true }).eq('id', apt.id);
                    results.push({ id: apt.id, sent: false, reason: 'Invalid or temp email' });
                    continue;
                }

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

                // Queue WhatsApp if phone exists
                if (clientPhone) {
                    try {
                        const phoneClean = clientPhone.replace(/\D/g, '');
                        const wpText = `Hallo *${clientName}*! 👋\n\n` +
                            `Wir hoffen, Sie hatten eine tolle Erfahrung im *Schönheitslokal*. 😍\n\n` +
                            `Könnten Sie uns helfen, indem Sie unseren Service bewerten? Es dauert nur eine Minute!\n` +
                            `👉 ${reviewLink}\n\n` +
                            `Ihre Meinung ist uns sehr wichtig. Vielen Dank! ✨`;

                        // Insert into the queue
                        await supabase
                            .from('whatsapp_queue')
                            .insert([
                                { 
                                    number: phoneClean, 
                                    message: wpText,
                                    status: 'pending'
                                }
                            ]);
                    } catch (wpError) {
                        console.error(`Failed to queue WhatsApp review for appointment ${apt.id}:`, wpError);
                    }
                }

                // Mark as sent
                await supabase
                    .from('appointments')
                    .update({ review_email_sent: true })
                    .eq('id', apt.id);

                results.push({ id: apt.id, sent: true });

            } catch (emailError) {
                // Log error but continue processing other appointments
                console.error(`Failed to send review email for appointment ${apt.id}:`, emailError);
                results.push({ id: apt.id, sent: false, reason: (emailError as any).message });
                // Don't mark as sent so we can retry next time
            }
        }

        return response.status(200).json({
            success: true,
            processed: results.filter(r => r.sent).length,
            skipped: results.filter(r => !r.sent).length,
            results
        });

    } catch (error) {
        console.error('Cron error:', error);
        return response.status(500).json({ error: 'Internal Server Error', details: (error as any).message });
    }
}
