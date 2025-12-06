import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = request.body;
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).json({ error: 'Missing authorization header' });
    }

    if (!userId) {
        return response.status(400).json({ error: 'Missing userId' });
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

        // Prevent self-deletion
        if (user.id === userId) {
            return response.status(400).json({ error: 'Cannot delete your own account' });
        }

        // 2. Delete the user using Service Role
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            throw deleteError;
        }

        return response.status(200).json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        return response.status(500).json({ error: 'Failed to delete user', details: (error as any).message });
    }
}
