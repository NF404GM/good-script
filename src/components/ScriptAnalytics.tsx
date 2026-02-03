import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, BarChart3, Users, Clock, Activity,
    BookOpen, Terminal, ChevronRight, Zap
} from 'lucide-react';
import { analyzeScript, ScriptStats } from '~/src/utils/scriptAnalytics';
import { cn } from '~/src/lib/utils';

interface ScriptAnalyticsProps {
    isOpen: boolean;
    onClose: () => void;
    html: string;
}

export const ScriptAnalytics: React.FC<ScriptAnalyticsProps> = ({ isOpen, onClose, html }) => {
    const stats = useMemo(() => analyzeScript(html), [html]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-zinc-950 border-l border-white/5 z-[100] shadow-2xl flex flex-col"
        >
            {/* Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <BarChart3 size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Script Analytics</h2>
                        <p className="text-[10px] text-zinc-500 font-medium">Performance & Balance Insights</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">

                {/* 1. Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        label="Total Words"
                        value={stats.totalWords.toLocaleString()}
                        icon={<Terminal size={14} />}
                        color="text-blue-400"
                    />
                    <StatCard
                        label="Dialogue Share"
                        value={`${Math.round((stats.dialogueWords / stats.totalWords) * 100) || 0}%`}
                        icon={<Activity size={14} />}
                        color="text-emerald-400"
                    />
                </div>

                {/* 2. Readability */}
                <section>
                    <SectionLabel icon={<BookOpen size={14} />} label="Readability Index" />
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-400 font-medium">Flesch-Kincaid Score</span>
                            <span className="text-sm font-bold text-white">{stats.readability.score}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.readability.score}%` }}
                                className="h-full bg-primary"
                            />
                        </div>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                            <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-1 block">Analysis</span>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                                This script is currently at a <b>{stats.readability.level}</b> level.
                                Aiming for a standard 8th-grade level ensures
                                maximum audience retention.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3. Character Balance */}
                <section>
                    <SectionLabel icon={<Users size={14} />} label="Dialogue Balance" />
                    <div className="space-y-3 mt-2">
                        {Object.entries(stats.characterStats)
                            .sort((a, b) => b[1].words - a[1].words)
                            .map(([name, data]) => (
                                <div key={name} className="group">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                            <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">{name}</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-mono">{data.words} words</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${data.percentage}%` }}
                                            className="h-full bg-zinc-400 group-hover:bg-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            ))}
                        {Object.keys(stats.characterStats).length === 0 && (
                            <p className="text-[10px] text-zinc-600 italic">No characters detected in this draft yet...</p>
                        )}
                    </div>
                </section>

                {/* 4. Pacing Pulse */}
                <section>
                    <SectionLabel icon={<Clock size={14} />} label="Narrative Pacing" />
                    <div className="mt-2 bg-white/5 border border-white/5 rounded-2xl p-4">
                        <PacingGraph data={stats.pacing.sceneDensity} />
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-center">
                                <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-tighter mb-1">Avg Scene</div>
                                <div className="text-sm font-bold text-white">{stats.pacing.averageWordsPerScene} <span className="text-[10px] text-zinc-500 font-normal">words</span></div>
                            </div>
                            <div className="w-px h-8 bg-white/5" />
                            <div className="text-center">
                                <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-tighter mb-1">Scenes</div>
                                <div className="text-sm font-bold text-white">{stats.pacing.sceneDensity.length}</div>
                            </div>
                        </div>
                    </div>
                </section>

            </div>

            {/* Footer */}
            <footer className="p-6 border-t border-white/5 shrink-0">
                <button
                    onClick={onClose}
                    className="w-full h-12 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors"
                >
                    Return to Writing
                    <ChevronRight size={16} />
                </button>
            </footer>
        </motion.div>
    );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
        <div className={cn("flex items-center gap-2 mb-1", color)}>
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</span>
        </div>
        <div className="text-xl font-bold text-white">{value}</div>
    </div>
);

const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <div className="flex items-center gap-2 text-zinc-500 mb-1">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
);

const PacingGraph: React.FC<{ data: number[] }> = ({ data }) => {
    if (data.length < 2) {
        return <div className="h-24 flex items-center justify-center text-[10px] text-zinc-600 italic">Add more scenes to generate pacing map...</div>;
    }

    const max = Math.max(...data);
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (val / max) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="h-24 w-full relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="pacingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                    d={`M 0,100 L ${points} L 100,100`}
                    fill="url(#pacingGradient)"
                />
                <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    points={points}
                />
            </svg>
        </div>
    );
};
