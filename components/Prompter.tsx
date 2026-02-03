import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { PrompterSettings, Theme, FontFamily } from '../types';
import { ControlBar } from './ControlBar';
import { WebcamBackground } from './WebcamBackground';

interface PrompterProps {
  text: string;
  onExit: () => void;
}

export const Prompter: React.FC<PrompterProps> = ({ text, onExit }) => {
  const [settings, setSettings] = useState<PrompterSettings>({
    scrollSpeed: 2.5,
    fontSize: 80,
    isMirrored: false,
    isPlaying: false,
    paddingX: 15,
    fontFamily: 'sans',
    theme: 'dark',
    useSmartPacing: true,
    enableWebcam: false
  });

  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const scrollAccumulatorRef = useRef(0); 

  // Cached node lists for performance
  const markerNodesRef = useRef<HTMLElement[]>([]);

  // --- AUTO HIDE CONTROLS LOGIC ---
  const handleActivity = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (settings.isPlaying) {
        controlsTimeoutRef.current = window.setTimeout(() => setIsControlsVisible(false), 2000); 
    }
  }, [settings.isPlaying]);

  useEffect(() => {
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    handleActivity();
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [handleActivity]);


  const updateSettings = (newSettings: Partial<PrompterSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetScroll = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      scrollAccumulatorRef.current = 0;
      updateSettings({ isPlaying: false });
      startTimeRef.current = null;
      setIsControlsVisible(true);
    }
  };

  const getThemeClasses = (theme: Theme) => {
    switch(theme) {
        case 'light': return 'bg-zinc-50 text-zinc-900 selection:bg-zinc-200';
        case 'high-contrast': return 'bg-black text-yellow-400 selection:bg-yellow-900';
        case 'broadcast': return 'bg-[#000033] text-white selection:bg-blue-800'; 
        case 'dark': default: return 'bg-zinc-950 text-white selection:bg-zinc-800'; 
    }
  };

  const getFontFamily = (font: FontFamily) => {
      switch(font) {
          case 'serif': return '"Playfair Display", serif';
          case 'mono': return '"Roboto Mono", monospace';
          case 'sans': default: return '"Inter", sans-serif';
      }
  };

  // 1. Cache Nodes 
  useEffect(() => {
    if (scrollContainerRef.current) {
         markerNodesRef.current = Array.from(scrollContainerRef.current.querySelectorAll('[data-timestamp]')) as HTMLElement[];
    }
  }, [text, settings.fontSize, settings.fontFamily, settings.paddingX]);


  // 2. Logic: Parse timestamps
  useEffect(() => {
     if (settings.isPlaying && !startTimeRef.current) {
        startTimeRef.current = Date.now();
     } else if (!settings.isPlaying) {
         startTimeRef.current = null;
     }
  }, [settings.isPlaying]);

  // 3. Animation Loop
  useEffect(() => {
    let lastFrameTime = performance.now();

    const animate = (time: number) => {
      const deltaTime = time - lastFrameTime;
      lastFrameTime = time;

      if (settings.isPlaying && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;

        let targetSpeed = settings.scrollSpeed;

        if (settings.useSmartPacing) {
            const markers = markerNodesRef.current;
            const nextMarker = markers.find(m => (m.offsetTop - clientHeight/2) > scrollTop + 10);
            
            if (nextMarker) {
                const targetTime = parseInt(nextMarker.getAttribute('data-timestamp') || '0', 10);
                const targetPixelPos = nextMarker.offsetTop - (clientHeight / 2);
                
                const prevMarkerIndex = markers.indexOf(nextMarker) - 1;
                const prevMarker = prevMarkerIndex >= 0 ? markers[prevMarkerIndex] : null;

                const prevTime = prevMarker ? parseInt(prevMarker.getAttribute('data-timestamp') || '0', 10) : 0;
                const prevPixelPos = prevMarker ? prevMarker.offsetTop - (clientHeight / 2) : 0;

                const segmentPixels = targetPixelPos - prevPixelPos;
                const segmentSeconds = targetTime - prevTime;

                if (segmentSeconds > 0 && segmentPixels > 0) {
                     const idealPPS = segmentPixels / segmentSeconds;
                     const baseSpeed = idealPPS / 60;
                     targetSpeed = baseSpeed * 1.1; 
                }
            }
        }

        const pixelsToScroll = targetSpeed * (deltaTime / 16.67); 
        scrollAccumulatorRef.current += pixelsToScroll;
        const integerMove = Math.floor(scrollAccumulatorRef.current);
        
        if (integerMove > 0) {
            container.scrollTop += integerMove;
            scrollAccumulatorRef.current -= integerMove;
        }

        if (scrollHeight - (scrollTop + clientHeight) <= 1) {
          updateSettings({ isPlaying: false });
          setIsControlsVisible(true);
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [settings.isPlaying, settings.scrollSpeed, settings.useSmartPacing, settings.fontSize]);


  // Pre-process HTML string to inject specific classes for Markers without breaking user's HTML
  const processedHtml = useMemo(() => {
    // We need to inject our timestamp styling into the [mm:ss] texts
    // This simple regex replacement should work on the HTML string
    // It finds [mm:ss] and wraps it
    return text.replace(/\[(\d{1,2}:\d{2})\]/g, (match, timeStr) => {
        const [min, sec] = timeStr.split(':').map(Number);
        const totalSeconds = (min * 60) + sec;
        return `<span class="inline-flex items-center justify-center px-1.5 py-0.5 mx-2 text-[0.4em] align-middle rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 select-none opacity-80" data-timestamp="${totalSeconds}">${match}</span>`;
    });
  }, [text]);

  
  return (
    <div 
        className={`relative w-full h-full overflow-hidden flex flex-col group transition-colors duration-500 ${getThemeClasses(settings.theme)} ${!isControlsVisible && settings.isPlaying ? 'cursor-none' : ''}`}
    >
      <WebcamBackground isActive={settings.enableWebcam} />

      {/* Guides & Overlay */}
      <div className={`absolute top-1/2 left-0 -translate-y-1/2 z-30 pointer-events-none transition-opacity duration-500 ${isControlsVisible ? 'opacity-100' : 'opacity-30'}`}>
         <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-red-500 border-b-[10px] border-b-transparent ml-4 drop-shadow-lg"></div>
      </div>
      <div className={`absolute top-1/2 right-0 -translate-y-1/2 z-30 pointer-events-none transition-opacity duration-500 ${isControlsVisible ? 'opacity-100' : 'opacity-30'}`}>
         <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[16px] border-r-red-500 border-b-[10px] border-b-transparent mr-4 drop-shadow-lg"></div>
      </div>
      <div className="absolute top-1/2 left-0 w-full z-20 pointer-events-none flex items-center justify-center">
         <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
      </div>
      
      {/* Gradients */}
      <div className={`absolute top-0 left-0 w-full h-1/3 z-10 pointer-events-none bg-gradient-to-b ${settings.enableWebcam ? 'from-black/80' : 'from-zinc-950'} via-transparent to-transparent`}></div>
      <div className={`absolute bottom-0 left-0 w-full h-1/3 z-10 pointer-events-none bg-gradient-to-t ${settings.enableWebcam ? 'from-black/80' : 'from-zinc-950'} via-transparent to-transparent`}></div>

      {/* --- SCROLL AREA --- */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto no-scrollbar relative cursor-none z-10" 
        style={{ scrollBehavior: 'auto' }} 
      >
        <div className="h-[50vh]"></div>
        
        <div 
            className="max-w-[90%] md:max-w-[1400px] mx-auto transition-all duration-300 ease-in-out outline-none"
            style={{
                fontSize: `${settings.fontSize}px`,
                paddingLeft: `${settings.paddingX}%`,
                paddingRight: `${settings.paddingX}%`,
                transform: settings.isMirrored ? 'scaleX(-1)' : 'none',
                fontFamily: getFontFamily(settings.fontFamily),
                fontWeight: 700, 
                lineHeight: 1.5,
                textAlign: settings.isMirrored ? 'right' : 'left'
            }}
        >
           <div 
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
           />
           
           {!text && (
               <div className="h-40 flex items-center justify-center opacity-30 text-[0.3em]">
                   NO SCRIPT DATA
               </div>
           )}
        </div>

        <div className="h-[50vh]"></div>
      </div>

      <ControlBar 
        settings={settings} 
        updateSettings={updateSettings} 
        onExit={onExit}
        onResetScroll={resetScroll}
        isVisible={isControlsVisible}
        onToggleVisibility={() => setIsControlsVisible(!isControlsVisible)}
      />
    </div>
  );
};