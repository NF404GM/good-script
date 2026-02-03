import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { supabase } from '~/src/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { PeerMessage, RemoteState } from '~/src/types';

// Generate a random 4-character room ID
const generateRoomId = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export interface UsePeerConnectionReturn {
    // State
    state: RemoteState;
    roomId: string | null;
    error: string | null;

    // Host methods
    startHost: () => Promise<string>;
    stopHost: () => void;

    // Client methods
    connectToHost: (roomId: string) => Promise<void>;
    disconnect: () => void;

    // Messaging
    sendMessage: (message: Omit<PeerMessage, 'timestamp'>) => void;
    onMessage: (callback: (message: PeerMessage) => void) => void;
}

export function usePeerConnection(): UsePeerConnectionReturn {
    const [state, setState] = useState<RemoteState>({
        isConnected: false,
        peerId: null,
        clientCount: 0,
    });
    const [roomId, setRoomId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const peerRef = useRef<Peer | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const connectionsRef = useRef<DataConnection[]>([]);
    const messageCallbackRef = useRef<((message: PeerMessage) => void) | null>(null);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopHost();
        };
    }, []);

    // Start as host (laptop)
    const startHost = useCallback(async (): Promise<string> => {
        return new Promise((resolve) => {
            const id = generateRoomId();
            const peerId = `goodscript-${id}`;
            let resolved = false;

            const safeResolve = () => {
                if (!resolved) {
                    resolved = true;
                    resolve(id);
                }
            };

            try {
                // Initialize Supabase Broadcast
                if (supabase) {
                    const channel = supabase.channel(`remote-${id}`, {
                        config: {
                            broadcast: { self: false },
                        },
                    });

                    channel
                        .on('broadcast', { event: 'command' }, ({ payload }) => {
                            console.log('Host received Supabase broadcast:', payload);
                            if (messageCallbackRef.current) {
                                console.log('Executing host message callback');
                                messageCallbackRef.current(payload as PeerMessage);
                            } else {
                                console.warn('Host message callback NOT REGISTERED');
                            }
                        })
                        .subscribe((status, err) => {
                            console.log('Host Supabase subscription status:', status, err);
                            if (status === 'SUBSCRIBED') {
                                console.log('Host successfully subscribed to Supabase');
                                channelRef.current = channel;
                                setRoomId(id);
                                setState(prev => ({ ...prev, isConnected: true }));
                                setError(null);
                                safeResolve();
                            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                                console.error('Supabase subscription failed:', status, err);
                                // Don't setError here yet, let PeerJS try
                            }
                        });
                } else {
                    console.warn('Supabase client not initialized - using PeerJS only');
                }

                // Initialize PeerJS as backup/parallel
                const peer = new Peer(peerId, {
                    debug: 2,
                    // Add some connection parameters to help PeerJS
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                        ]
                    }
                });

                peer.on('open', (openedId) => {
                    console.log('Host PeerJS opened:', openedId);
                    peerRef.current = peer;
                    const cleanId = openedId.replace('goodscript-', '');
                    setRoomId(cleanId);
                    setState(prev => ({ ...prev, peerId: openedId, isConnected: true }));
                    setError(null);
                    safeResolve();
                });

                peer.on('connection', (conn) => {
                    console.log('Client connected (PeerJS):', conn.peer);
                    connectionsRef.current.push(conn);
                    setState(prev => ({ ...prev, clientCount: connectionsRef.current.length }));

                    conn.on('data', (data) => {
                        const message = data as PeerMessage;
                        console.log('Host received PeerJS message:', message);
                        if (messageCallbackRef.current) {
                            messageCallbackRef.current(message);
                        }
                    });

                    conn.on('close', () => {
                        connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
                        setState(prev => ({ ...prev, clientCount: connectionsRef.current.length }));
                    });
                });

                peer.on('error', (err) => {
                    if (err.type === 'unavailable-id') {
                        console.log('PeerJS ID taken, generating new one...');
                        // This is rare since we use unique IDs, but handle it
                        peer.destroy();
                        startHost().then(safeResolve);
                        return;
                    }
                    console.warn('PeerJS error (falling back to Supabase):', err);
                });

            } catch (err) {
                console.error('Failed to start host transport:', err);
                // If everything failed, resolve anyway to show current state
                safeResolve();
            }
        });
    }, []);

    // Stop hosting
    const stopHost = useCallback(() => {
        connectionsRef.current.forEach(conn => conn.close());
        connectionsRef.current = [];

        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }

        if (channelRef.current) {
            channelRef.current.unsubscribe();
            channelRef.current = null;
        }

        setState({ isConnected: false, peerId: null, clientCount: 0 });
        setRoomId(null);
        setError(null);
    }, []);

    // Connect to host (phone)
    const connectToHost = useCallback(async (hostRoomId: string): Promise<void> => {
        return new Promise((resolve) => {
            const hostPeerId = `goodscript-${hostRoomId.toUpperCase()}`;
            const clientId = `goodscript-client-${Date.now()}`;
            const normalizedRoomId = hostRoomId.toUpperCase();
            let resolved = false;

            const safeResolve = () => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            };

            try {
                // 1. Try Supabase Broadcast (Very reliable)
                if (supabase) {
                    const channel = supabase.channel(`remote-${normalizedRoomId}`, {
                        config: {
                            broadcast: { self: false },
                        },
                    });

                    channel
                        .on('broadcast', { event: 'command' }, ({ payload }) => {
                            console.log('Client received Supabase broadcast:', payload);
                            if (messageCallbackRef.current) {
                                messageCallbackRef.current(payload as PeerMessage);
                            }
                        })
                        .subscribe((status, err) => {
                            console.log('Client Supabase subscription status:', status, err);
                            if (status === 'SUBSCRIBED') {
                                console.log('Client successfully subscribed to Supabase');
                                channelRef.current = channel;
                                setRoomId(normalizedRoomId);
                                setState({ isConnected: true, peerId: clientId, clientCount: 0 });
                                setError(null);
                                safeResolve();
                            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                                console.error('Supabase client subscription failed:', status, err);
                            }
                        });
                }

                // 2. Try PeerJS (Backup/Parallel)
                const peer = new Peer(clientId, {
                    debug: 1,
                    config: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                        ]
                    }
                });

                peer.on('open', () => {
                    console.log('Client PeerJS opened, connecting to host:', hostPeerId);
                    const conn = peer.connect(hostPeerId, {
                        reliable: true
                    });

                    conn.on('open', () => {
                        console.log('Connected to host via PeerJS');
                        peerRef.current = peer;
                        connectionsRef.current = [conn];
                        setRoomId(normalizedRoomId);
                        setState({ isConnected: true, peerId: clientId, clientCount: 0 });
                        setError(null);
                        safeResolve();
                    });

                    conn.on('data', (data) => {
                        const message = data as PeerMessage;
                        if (messageCallbackRef.current) {
                            messageCallbackRef.current(message);
                        }
                    });

                    conn.on('error', (err) => {
                        console.warn('Client PeerJS connection error:', err);
                    });
                });

            } catch (err) {
                console.error('Client transport failed:', err);
                // If everything failed, resolve anyway to avoid hanging
                safeResolve();
            }
        });
    }, []);

    // Disconnect (for client)
    const disconnect = useCallback(() => {
        stopHost();
    }, [stopHost]);

    // Send message to all available transports
    const sendMessage = useCallback((message: Omit<PeerMessage, 'timestamp'>) => {
        const fullMessage: PeerMessage = {
            ...message,
            timestamp: Date.now(),
        };

        console.log('--- Attempting to send message ---', fullMessage);

        // Send via Supabase (Primary)
        if (channelRef.current) {
            console.log('Sending via Supabase...');
            channelRef.current.send({
                type: 'broadcast',
                event: 'command',
                payload: fullMessage,
            }).then(resp => {
                console.log('Supabase send response:', resp);
                if (resp !== 'ok') console.warn('Supabase broadcast failed:', resp);
            });
        } else {
            console.warn('Supabase channel not ready for sending');
        }

        // Send via PeerJS (Secondary)
        if (connectionsRef.current.length === 0) {
            console.log('No PeerJS connections active');
        }
        connectionsRef.current.forEach(conn => {
            if (conn.open) {
                console.log('Sending via PeerJS to:', conn.peer);
                conn.send(fullMessage);
            } else {
                console.warn('PeerJS connection not open:', conn.peer);
            }
        });
    }, []);

    // Register message callback
    const onMessage = useCallback((callback: (message: PeerMessage) => void) => {
        messageCallbackRef.current = callback;
    }, []);

    return {
        state,
        roomId,
        error,
        startHost,
        stopHost,
        connectToHost,
        disconnect,
        sendMessage,
        onMessage,
    };
}

export default usePeerConnection;
