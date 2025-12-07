import React, { useState, useEffect } from 'react';
import { Play, Battery, Power } from 'lucide-react';

interface HeaderProps {
  title?: string;
  status?: string;
  time?: string;
  batteryLevel?: number;
}

export default function Header({ 
  title = "CHICKEN TENDERS", 
  status = "Idle",
  time,
  batteryLevel = 100,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(
    time || new Date().toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    })
  );

  // Update time every minute
  useEffect(() => {
    if (!time) {
      const interval = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString("en-US", { 
          hour: "numeric", 
          minute: "2-digit",
          hour12: true 
        }));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [time]);

  const handleEstop = (type: 'soft' | 'hard') => {
    // E-STOP functionality
    if (type === 'hard') {
      // Hard E-STOP - immediate shutdown
      if (window.confirm('HARD E-STOP: This will immediately stop all operations. Continue?')) {
        console.log('HARD E-STOP activated');
        // TODO: Implement hard E-STOP logic
        alert('HARD E-STOP ACTIVATED - All systems stopped');
      }
    } else {
      // Soft E-STOP - graceful shutdown
      if (window.confirm('SOFT E-STOP: This will gracefully stop all operations. Continue?')) {
        console.log('SOFT E-STOP activated');
        // TODO: Implement soft E-STOP logic
        alert('SOFT E-STOP ACTIVATED - Operations stopping gracefully');
      }
    }
  };

  return (
    <header className="bg-primary-700 text-white border-b border-primary-600">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Left: Title - Matching unified_ui.py TopNavBar */}
          <div className="text-sm sm:text-base md:text-lg font-semibold tracking-wide">
            TENDER CELLS | {title}
          </div>

          {/* Center: Status, Time, Battery - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded text-xs">
              <Play className="w-3 h-3" />
              <span>{status}</span>
            </div>
            <div className="text-xs">{currentTime}</div>
            <div className="flex items-center gap-1">
              <Battery className="w-4 h-4" />
              <span className="text-xs">{batteryLevel}%</span>
            </div>
          </div>

          {/* Right: E-STOP Buttons - Matching image */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleEstop('soft')}
              className="bg-red-600 border border-red-500 text-white hover:bg-red-700 px-3 py-1.5 rounded text-xs sm:text-sm font-bold min-w-[70px] sm:min-w-[80px] transition-colors active:bg-red-800"
              aria-label="Soft E-STOP"
            >
              E-STOP
            </button>
            <button 
              onClick={() => handleEstop('hard')}
              className="bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded text-xs sm:text-sm font-bold min-w-[70px] sm:min-w-[80px] transition-colors active:bg-red-800 flex items-center justify-center gap-1"
              aria-label="Hard E-STOP"
            >
              <Power className="w-3 h-3" />
              <span>E-STOP</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}