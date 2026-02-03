import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, MonitorSmartphone, Type, Timer, Camera, Palette } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '~/src/components/ui/dialog';
import { Slider } from '~/src/components/ui/slider';
import { Switch } from '~/src/components/ui/switch';
import { Button } from '~/src/components/ui/button';
import { cn } from '~/src/lib/utils';
import type { Settings, Theme, FontFamily } from '~/src/types';

interface SettingsCapsuleProps {
    settings: Settings;
    onSettingsChange: (settings: Partial<Settings>) => void;
    trigger?: React.ReactNode;
}

const themes: { id: Theme; label: string; color: string }[] = [
    { id: 'dark', label: 'Dark', color: 'bg-zinc-900 border-zinc-700' },
    { id: 'light', label: 'Light', color: 'bg-white border-zinc-300' },
    { id: 'high-contrast', label: 'High Contrast', color: 'bg-black border-white' },
    { id: 'broadcast', label: 'Broadcast', color: 'bg-black border-zinc-800 ring-white' },
];

const fonts: { id: FontFamily; label: string; sample: string }[] = [
    { id: 'sans', label: 'Sans', sample: 'Aa' },
    { id: 'serif', label: 'Serif', sample: 'Aa' },
    { id: 'mono', label: 'Mono', sample: 'Aa' },
];

export const SettingsCapsule: React.FC<SettingsCapsuleProps> = ({
    settings,
    onSettingsChange,
    trigger,
}) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <SettingsIcon size={20} />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <SettingsIcon size={16} />
                        Teleprompter Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Toggle Switches Section */}
                    <div className="space-y-4">
                        {/* Smart Pacing */}
                        <SettingRow
                            icon={<Timer size={18} />}
                            label="Smart Pacing"
                            description="Auto-speed via [mm:ss] markers"
                            active={settings.useSmartPacing}
                        >
                            <Switch
                                checked={settings.useSmartPacing}
                                onCheckedChange={(checked) =>
                                    onSettingsChange({ useSmartPacing: checked })
                                }
                            />
                        </SettingRow>

                        {/* Mirror Mode */}
                        <SettingRow
                            icon={<MonitorSmartphone size={18} />}
                            label="Mirror Mode"
                            description="Flip text for beam splitter"
                            active={settings.isMirrored}
                        >
                            <Switch
                                checked={settings.isMirrored}
                                onCheckedChange={(checked) =>
                                    onSettingsChange({ isMirrored: checked })
                                }
                            />
                        </SettingRow>

                        {/* Webcam */}
                        <SettingRow
                            icon={<Camera size={18} />}
                            label="Webcam Background"
                            description="Show camera behind text"
                            active={settings.enableWebcam}
                        >
                            <Switch
                                checked={settings.enableWebcam}
                                onCheckedChange={(checked) =>
                                    onSettingsChange({ enableWebcam: checked })
                                }
                            />
                        </SettingRow>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Sliders Section */}
                    <div className="space-y-5">
                        {/* Speed */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Scroll Speed</span>
                                <span className="font-mono text-primary">
                                    {settings.scrollSpeed.toFixed(1)}x
                                </span>
                            </div>
                            <Slider
                                value={[settings.scrollSpeed]}
                                min={0.5}
                                max={10}
                                step={0.5}
                                onValueChange={([value]) =>
                                    onSettingsChange({ scrollSpeed: value })
                                }
                            />
                        </div>

                        {/* Font Size */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Type size={14} /> Text Size
                                </span>
                                <span className="font-mono text-primary">{settings.fontSize}px</span>
                            </div>
                            <Slider
                                value={[settings.fontSize]}
                                min={32}
                                max={140}
                                step={4}
                                onValueChange={([value]) =>
                                    onSettingsChange({ fontSize: value })
                                }
                            />
                        </div>

                        {/* Margins */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Side Margins</span>
                                <span className="font-mono text-primary">{settings.paddingX}%</span>
                            </div>
                            <Slider
                                value={[settings.paddingX]}
                                min={5}
                                max={35}
                                step={1}
                                onValueChange={([value]) =>
                                    onSettingsChange({ paddingX: value })
                                }
                            />
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Theme Selection */}
                    <div className="space-y-3">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Palette size={14} /> Color Theme
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                            {themes.map((theme) => (
                                <motion.button
                                    key={theme.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onSettingsChange({ theme: theme.id })}
                                    className={cn(
                                        "h-12 rounded-lg border-2 flex items-center justify-center transition-all",
                                        theme.color,
                                        settings.theme === theme.id
                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                            : "opacity-60 hover:opacity-100"
                                    )}
                                    title={theme.label}
                                >
                                    {settings.theme === theme.id && (
                                        <motion.div
                                            layoutId="theme-indicator"
                                            className="w-2 h-2 rounded-full bg-current"
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-3">
                        <span className="text-sm text-muted-foreground">Font Style</span>
                        <div className="grid grid-cols-3 gap-2">
                            {fonts.map((font) => (
                                <Button
                                    key={font.id}
                                    variant={settings.fontFamily === font.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onSettingsChange({ fontFamily: font.id })}
                                    className={cn(
                                        "font-medium",
                                        font.id === 'serif' && "font-serif",
                                        font.id === 'mono' && "font-mono"
                                    )}
                                >
                                    {font.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Editor Text Color */}
                    <div className="space-y-3">
                        <span className="text-sm text-muted-foreground">Editor Text Color</span>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { color: '#ffffff', label: 'White' },
                                { color: '#a1a1aa', label: 'Silver' },
                                { color: '#f59e0b', label: 'Amber' },
                                { color: '#10b981', label: 'Emerald' },
                                { color: '#06b6d4', label: 'Cyan' },
                                { color: '#ef4444', label: 'Red' },
                            ].map((c) => (
                                <button
                                    key={c.color}
                                    onClick={() => onSettingsChange({ editorTextColor: c.color })}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all",
                                        settings.editorTextColor === c.color
                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                                            : "opacity-80 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: c.color, borderColor: 'rgba(255,255,255,0.1)' }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Helper component for toggle rows
interface SettingRowProps {
    icon: React.ReactNode;
    label: string;
    description: string;
    active: boolean;
    children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({
    icon,
    label,
    description,
    active,
    children,
}) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div
                className={cn(
                    "p-2 rounded-lg transition-colors",
                    active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                )}
            >
                {icon}
            </div>
            <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
            </div>
        </div>
        {children}
    </div>
);

export default SettingsCapsule;
