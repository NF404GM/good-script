import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '~/src/lib/supabase';
import type { Script } from '~/src/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface UseScriptSyncReturn {
    scripts: Script[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;
    isOnline: boolean;
    saveScript: (script: Script) => Promise<void>;
    deleteScript: (id: string) => Promise<void>;
    loadScripts: () => Promise<void>;
    syncStatus: 'offline' | 'syncing' | 'synced' | 'error';
}

export function useScriptSync(userId?: string): UseScriptSyncReturn {
    const [scripts, setScripts] = useState<Script[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(isSupabaseConfigured());

    const channelRef = useRef<RealtimeChannel | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate sync status
    const syncStatus = !isOnline ? 'offline' : isSyncing ? 'syncing' : error ? 'error' : 'synced';

    // Load scripts from Supabase or localStorage
    const loadScripts = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // Try Supabase first
        if (supabase && isOnline) {
            try {
                const { data, error: fetchError } = await supabase
                    .from('scripts')
                    .select('*')
                    .order('lastModified', { ascending: false });

                if (fetchError) throw fetchError;

                if (data) {
                    setScripts(data as Script[]);
                    // Also cache to localStorage for offline access
                    localStorage.setItem('goodscript_v2_scripts', JSON.stringify(data));
                }
            } catch (err) {
                console.error('Supabase fetch error:', err);
                setError('Failed to load from cloud. Using local cache.');

                // Fall back to localStorage
                const cached = localStorage.getItem('goodscript_v2_scripts');
                if (cached) {
                    try {
                        setScripts(JSON.parse(cached));
                    } catch {
                        setScripts([]);
                    }
                }
            }
        } else {
            // Use localStorage if Supabase not configured
            const cached = localStorage.getItem('goodscript_v2_scripts');
            if (cached) {
                try {
                    setScripts(JSON.parse(cached));
                } catch {
                    setScripts([]);
                }
            }
        }

        setIsLoading(false);
    }, [isOnline]);

    // Save script with debounce
    const saveScript = useCallback(async (script: Script) => {
        // Update local state immediately
        setScripts(prev => {
            const exists = prev.some(s => s.id === script.id);
            const updated = exists
                ? prev.map(s => s.id === script.id ? script : s)
                : [...prev, script];

            // Save to localStorage immediately
            localStorage.setItem('goodscript_v2_scripts', JSON.stringify(updated));
            return updated;
        });

        // Debounce Supabase sync
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            if (!supabase || !isOnline) return;

            setIsSyncing(true);
            try {
                const { error: upsertError } = await supabase
                    .from('scripts')
                    .upsert({
                        ...script,
                        userId: userId || null,
                    });

                if (upsertError) throw upsertError;
                setError(null);
            } catch (err) {
                console.error('Supabase save error:', err);
                setError('Failed to sync to cloud');
            } finally {
                setIsSyncing(false);
            }
        }, 1000); // 1 second debounce
    }, [isOnline, userId]);

    // Delete script
    const deleteScript = useCallback(async (id: string) => {
        // Update local state immediately
        setScripts(prev => {
            const updated = prev.filter(s => s.id !== id);
            localStorage.setItem('goodscript_v2_scripts', JSON.stringify(updated));
            return updated;
        });

        // Sync to Supabase
        if (supabase && isOnline) {
            setIsSyncing(true);
            try {
                const { error: deleteError } = await supabase
                    .from('scripts')
                    .delete()
                    .eq('id', id);

                if (deleteError) throw deleteError;
                setError(null);
            } catch (err) {
                console.error('Supabase delete error:', err);
                setError('Failed to delete from cloud');
            } finally {
                setIsSyncing(false);
            }
        }
    }, [isOnline]);

    // Set up real-time subscription
    useEffect(() => {
        if (!supabase || !isOnline) return;

        // Subscribe to changes
        channelRef.current = supabase
            .channel('scripts_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'scripts',
                },
                (payload) => {
                    console.log('Realtime update:', payload);

                    if (payload.eventType === 'INSERT') {
                        setScripts(prev => {
                            // Check if we already have this script (from our own insert)
                            if (prev.some(s => s.id === (payload.new as Script).id)) {
                                return prev;
                            }
                            return [...prev, payload.new as Script];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setScripts(prev =>
                            prev.map(s => s.id === (payload.new as Script).id ? payload.new as Script : s)
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setScripts(prev =>
                            prev.filter(s => s.id !== (payload.old as { id: string }).id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [isOnline]);

    // Initial load
    useEffect(() => {
        loadScripts();
    }, [loadScripts]);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(isSupabaseConfigured());
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        scripts,
        isLoading,
        isSyncing,
        error,
        isOnline,
        saveScript,
        deleteScript,
        loadScripts,
        syncStatus,
    };
}

export default useScriptSync;
