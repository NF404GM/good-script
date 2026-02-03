import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
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
        return new Promise((resolve, reject) => {
            const id = generateRoomId();
            const peerId = `goodscript-${id}`;

            try {
                const peer = new Peer(peerId, {
                    debug: 2,
                });

                peer.on('open', (id) => {
                    console.log('Host peer opened:', id);
                    peerRef.current = peer;
                    setRoomId(id.replace('goodscript-', ''));
                    setState(prev => ({ ...prev, peerId: id, isConnected: true }));
                    setError(null);
                    resolve(id.replace('goodscript-', ''));
                });

                peer.on('connection', (conn) => {
                    console.log('Client connected:', conn.peer);
                    connectionsRef.current.push(conn);
                    setState(prev => ({ ...prev, clientCount: connectionsRef.current.length }));

                    conn.on('data', (data) => {
                        const message = data as PeerMessage;
                        console.log('Host received message:', message);
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
                    console.error('Peer error:', err);
                    setError(err.message);
                    reject(err);
                });

                peer.on('disconnected', () => {
                    setState(prev => ({ ...prev, isConnected: false }));
                });

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to start host';
                setError(message);
                reject(err);
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

        setState({ isConnected: false, peerId: null, clientCount: 0 });
        setRoomId(null);
        setError(null);
    }, []);

    // Connect to host (phone)
    const connectToHost = useCallback(async (hostRoomId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const hostPeerId = `goodscript-${hostRoomId.toUpperCase()}`;
            const clientId = `goodscript-client-${Date.now()}`;

            try {
                const peer = new Peer(clientId, {
                    debug: 2,
                });

                peer.on('open', () => {
                    console.log('Client peer opened, connecting to host:', hostPeerId);

                    const conn = peer.connect(hostPeerId);

                    conn.on('open', () => {
                        console.log('Connected to host');
                        peerRef.current = peer;
                        connectionsRef.current = [conn];
                        setState({ isConnected: true, peerId: clientId, clientCount: 0 });
                        setRoomId(hostRoomId.toUpperCase());
                        setError(null);
                        resolve();
                    });

                    conn.on('data', (data) => {
                        const message = data as PeerMessage;
                        console.log('Client received message:', message);
                        if (messageCallbackRef.current) {
                            messageCallbackRef.current(message);
                        }
                    });

                    conn.on('close', () => {
                        setState(prev => ({ ...prev, isConnected: false }));
                    });

                    conn.on('error', (err) => {
                        console.error('Connection error:', err);
                        setError('Failed to connect to host');
                        reject(err);
                    });
                });

                peer.on('error', (err) => {
                    console.error('Peer error:', err);
                    setError(err.message);
                    reject(err);
                });

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to connect';
                setError(message);
                reject(err);
            }
        });
    }, []);

    // Disconnect (for client)
    const disconnect = useCallback(() => {
        stopHost();
    }, [stopHost]);

    // Send message to all connections
    const sendMessage = useCallback((message: Omit<PeerMessage, 'timestamp'>) => {
        const fullMessage: PeerMessage = {
            ...message,
            timestamp: Date.now(),
        };

        connectionsRef.current.forEach(conn => {
            if (conn.open) {
                conn.send(fullMessage);
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
