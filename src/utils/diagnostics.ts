/**
 * Global diagnostics and polyfills for Good Script
 * This file should be imported as early as possible.
 */

// 1. Polyfill crypto.randomUUID for non-secure contexts (HTTP on Local IP)
if (typeof window !== 'undefined') {
    if (!window.crypto) {
        // @ts-ignore
        window.crypto = {};
    }

    if (!window.crypto.randomUUID) {
        console.warn('crypto.randomUUID is not available (not a secure context). Polyfilling...');
        // @ts-ignore
        window.crypto.randomUUID = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
    }
}

// 2. Network Reachability Log
if (typeof window !== 'undefined') {
    console.log('--- Network Diagnostics ---');
    console.log('Location:', window.location.href);
    console.log('Hostname:', window.location.hostname);
    console.log('Protocol:', window.location.protocol);
    console.log('User Agent:', navigator.userAgent);
    console.log('---------------------------');
}

export const checkReachability = async (url: string): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return true;
    } catch (e) {
        return false;
    }
};
