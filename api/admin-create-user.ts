import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password, fullName, role } = request.body;
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).json({ error: 'Missing authorization header' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
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

        // 2. Create the new user using Service Role
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName,
                role: role // Store role in user_metadata as well
            },
            app_metadata: {
                role: role // Store role in app_metadata (secure)
            }
        });

        if (createError) {
            throw createError;
        }

        // 3. Create a record in the 'clients' table if it's a client (optional, but good for consistency)
        // Or maybe we don't need to, as the system seems to rely on 'clients' table for booking.
        // However, for 'admin' or 'owner' users, they might not need a 'clients' record.
        // The prompt implies creating users for system access (permissions).

        return response.status(200).json({ success: true, user: newUser.user });

    } catch (error) {
        console.error('Error creating user:', error);
        return response.status(500).json({ error: 'Failed to create user', details: (error as any).message });
    }
}
