import { createClient } from '@supabase/supabase-js';

/**
 * Server-side admin role verification
 * Queries the users table to check if user has admin role
 * @param {string} userId - User's UUID from auth
 * @returns {Promise<boolean>} - True if user is admin
 */
export async function checkAdminRole(userId) {
  if (!userId) {
    console.warn('checkAdminRole: No userId provided');
    return false;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error('checkAdminRole: Missing required environment variables');
    return false;
  }

  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    );

    // Direct lookup by ID - simple and fast
    const { data, error } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('checkAdminRole: Error fetching user role:', error);
      return false;
    }

    if (!data) {
      console.warn(`checkAdminRole: User not found with ID: ${userId}`);
      return false;
    }

    const isAdmin = data.role === 'admin';
    console.log(`checkAdminRole: User ${userId} role="${data.role}" - ${isAdmin ? 'ADMIN' : 'NOT ADMIN'}`);

    return isAdmin;

  } catch (error) {
    console.error('checkAdminRole: Unexpected error:', error);
    return false;
  }
}
