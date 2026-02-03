import { createClient } from '@supabase/supabase-js';
import type { Script } from '~/src/types';

// Supabase configuration - use environment variables
const supabaseUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

// Create client (will be null if credentials not configured)
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Type definitions for database tables
export interface Database {
    public: {
        Tables: {
            scripts: {
                Row: Script;
                Insert: Omit<Script, 'id' | 'lastModified' | 'createdAt'> & {
                    id?: string;
                    lastModified?: number;
                    createdAt?: number;
                };
                Update: Partial<Script>;
            };
        };
    };
}

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    return supabase !== null;
};

// Helper to get current user ID (for future auth integration)
export const getCurrentUserId = async (): Promise<string | null> => {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
};

export default supabase;
