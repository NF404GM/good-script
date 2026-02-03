type LogEntry = {
    message: string;
    type: 'log' | 'warn' | 'error';
    timestamp: number;
};

let logs: LogEntry[] = [];
const listeners: Set<(logs: LogEntry[]) => void> = new Set();

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

const addLog = (message: any, type: 'log' | 'warn' | 'error') => {
    const entry: LogEntry = {
        message: typeof message === 'string' ? message : JSON.stringify(message, null, 2),
        type,
        timestamp: Date.now()
    };
    logs.push(entry);
    if (logs.length > 50) logs.shift();
    listeners.forEach(l => l([...logs]));
};

// Override console methods
console.log = (...args) => {
    originalLog(...args);
    addLog(args.map(a => String(a)).join(' '), 'log');
};

console.warn = (...args) => {
    originalWarn(...args);
    addLog(args.map(a => String(a)).join(' '), 'warn');
};

console.error = (...args) => {
    originalError(...args);
    addLog(args.map(a => String(a)).join(' '), 'error');
};

export const onLogUpdate = (callback: (logs: LogEntry[]) => void) => {
    listeners.add(callback);
    callback([...logs]);
    return () => listeners.delete(callback);
};

export const getLogs = () => [...logs];
export const clearLogs = () => {
    logs = [];
    listeners.forEach(l => l([]));
};
