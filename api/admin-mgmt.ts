import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { action } = request.body;
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).json({ error: 'Missing authorization header' });
    }

    if (!action) {
        return response.status(400).json({ error: 'Action is required' });
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

        const requesterRole = user.app_metadata?.role || user.user_metadata?.role;
        if (requesterRole !== 'admin' && requesterRole !== 'owner') {
            return response.status(403).json({ error: 'Unauthorized: Admin privileges required' });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 2. Route actions
        if (action === 'createUser') {
            const { email, password, fullName, role } = request.body;
            if (!email || !password || !fullName || !role) {
                return response.status(400).json({ error: 'Email, password, fullName and role are required' });
            }

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: fullName, role },
                app_metadata: { role }
            });

            if (createError) throw createError;
            return response.status(200).json({ success: true, user: newUser.user });
        } 
        
        if (action === 'deleteUser') {
            const { userId } = request.body;
            if (!userId) {
                return response.status(400).json({ error: 'Missing userId' });
            }

            if (user.id === userId) {
                return response.status(400).json({ error: 'Cannot delete your own account' });
            }

            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (deleteError) throw deleteError;

            return response.status(200).json({ success: true, message: 'User deleted successfully' });
        } 
        
        if (action === 'deleteClient') {
            const { clientId } = request.body;
            if (!clientId) {
                return response.status(400).json({ error: 'Missing clientId' });
            }

            const { error: deleteError } = await supabaseAdmin
                .from('clients')
                .delete()
                .eq('id', clientId);

            if (deleteError) throw deleteError;

            return response.status(200).json({ success: true, message: 'Client deleted successfully' });
        } 
        
        if (action === 'updateUserRole') {
            const { userId, role } = request.body;
            if (!userId || !role) {
                return response.status(400).json({ error: 'User ID and Role are required' });
            }

            const validRoles = ['client', 'admin', 'owner', 'partner'];
            if (!validRoles.includes(role)) {
                return response.status(400).json({ error: 'Invalid role' });
            }

            if (user.id === userId && role !== requesterRole) {
                return response.status(400).json({ error: 'Cannot change your own role' });
            }

            const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: { role },
                app_metadata: { role }
            });

            if (updateAuthError) throw updateAuthError;

            const { error: updateDbError } = await supabaseAdmin
                .from('clients')
                .update({ role })
                .eq('user_id', userId);

            if (updateDbError) throw updateDbError;

            return response.status(200).json({ success: true });
        }

        return response.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error(`Error executing action ${action}:`, error);
        return response.status(500).json({ error: `Failed to execute action ${action}`, details: (error as any).message });
    }
}
