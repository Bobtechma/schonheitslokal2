import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { number, text } = request.body;
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Supabase configuration missing');
        return response.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        // Instead of sending directly (which fails from Vercel to localhost),
        // we queue the message in the database.
        // The Admin Dashboard (running locally) will pick it up and send it.
        const { data, error } = await supabase
            .from('whatsapp_queue')
            .insert([
                { 
                    number: String(number).replace(/\D/g, ''), 
                    message: text,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Failed to queue WhatsApp message:', error);
            return response.status(500).json({ error: 'Failed to queue message', details: error.message });
        }

        return response.status(200).json({ 
            success: true, 
            message: 'Message queued for local delivery',
            queuedId: data.id 
        });
    } catch (error) {
        console.error('Error in WhatsApp handler:', error);
        return response.status(500).json({ error: 'Internal server error', details: (error as any).message });
    }
}
