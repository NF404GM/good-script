import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '~/src/lib/supabase';
import type { PeerMessage } from '~/src/types';

export interface Collaborator {
    id: string;
    name: string;
    color: string;
    cursorPos?: number;
    lastActive: number;
}

export const useCollaboration = (
    scriptId: string | null,
    onContentChange?: (html: string) => void,
    userName: string = 'Anonymous'
) => {
    const [collaborators, setCollaborators] = useState<Record<string, Collaborator>>({});
    const channelRef = useRef<any>(null);
    const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
    const [userColor] = useState(() => {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    });

    useEffect(() => {
        if (!scriptId || !supabase) return;

        const channelName = `collaboration:${scriptId}`;
        const channel = supabase.channel(channelName);

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const formatted: Record<string, Collaborator> = {};

                Object.keys(state).forEach(key => {
                    const presence = state[key][0] as any;
                    formatted[presence.userId] = {
                        id: presence.userId,
                        name: presence.name,
                        color: presence.color,
                        cursorPos: presence.cursorPos,
                        lastActive: Date.now(),
                    };
                });
                setCollaborators(formatted);
            })
            .on('broadcast', { event: 'cursor' }, ({ payload }) => {
                setCollaborators(prev => ({
                    ...prev,
                    [payload.userId]: {
                        ...prev[payload.userId],
                        cursorPos: payload.pos,
                        lastActive: Date.now(),
                    }
                }));
            })
            .on('broadcast', { event: 'content_change' }, ({ payload }) => {
                if (payload.userId !== userId) {
                    onContentChange?.(payload.html);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        userId,
                        name: userName,
                        color: userColor,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
        };
    }, [scriptId, userId, userName, userColor]);

    const updateCursor = useCallback((pos: number) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'cursor',
                payload: { userId, pos },
            });
        }
    }, [userId]);

    const broadcastContentChange = useCallback((html: string) => {
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'content_change',
                payload: { userId, html },
            });
        }
    }, [userId]);

    return {
        collaborators,
        updateCursor,
        broadcastContentChange,
        currentUserId: userId,
    };
};
