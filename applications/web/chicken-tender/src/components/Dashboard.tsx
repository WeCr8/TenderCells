import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import LiveFeed from './LiveFeed';
import EnvironmentControl from './EnvironmentControl';
import BottomToolbar from './toolbar/BottomToolbar';
import { LAYOUT_DIMENSIONS } from '../../constants/breakpoints';
import { Button } from './ui/Button/Button';

export default function Dashboard() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine breakpoint
  const isMobile = windowWidth < 900;
  const isTablet = windowWidth >= 900 && windowWidth < 1200;
  const isDesktop = windowWidth >= 1200;
  const isDesktopXL = windowWidth >= 1600;

  // Get layout dimensions based on breakpoint
  const getLayoutDimensions = () => {
    if (isDesktopXL) return LAYOUT_DIMENSIONS.desktopXL;
    if (isDesktop) return LAYOUT_DIMENSIONS.desktopL;
    if (isTablet) return LAYOUT_DIMENSIONS.tabletL;
    return LAYOUT_DIMENSIONS.mobile;
  };

  const dims = getLayoutDimensions();
  const isPortraitTablet = windowWidth < 900 && window.innerHeight > window.innerWidth;

  // Mobile layout: single column
  if (isMobile && !isPortraitTablet) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
        {/* Main tab bar */}
        <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
          {['Overview', 'Coop', 'Sensors', 'Hogs'].map((tab) => (
            <button
              key={tab}
              className="px-4 py-2 border-b-2 border-primary-500 font-medium text-sm whitespace-nowrap min-h-[44px]"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-4">
          {/* Coop viewport - Responsive size */}
          <div
            className="w-full mb-4 mx-auto"
            style={{
              minHeight: `${dims.viewportMinHeight}px`,
              maxHeight: `${dims.viewportMaxHeight || 260}px`,
              aspectRatio: `${dims.viewportAspectRatio}`,
            }}
          >
            <LiveFeed />
          </div>

          {/* Telemetry tiles grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Temperature', value: '72°F', critical: true },
              { label: 'Humidity', value: '54%', critical: true },
              { label: 'Ammonia', value: 'OK', critical: true },
              { label: 'Active', value: '24', critical: false },
              { label: 'Chickens', value: '24', critical: false },
              { label: 'Feed', value: 'OK', critical: true },
              { label: 'Water', value: 'OK', critical: true },
            ]
              .filter((_, index) => index < (dims.maxTelemetryItems || 7))
              .map((item) => (
                <div
                  key={item.label}
                  className="p-3 bg-white rounded border border-gray-200 min-h-[72px] flex flex-col justify-center"
                  style={{ borderColor: item.critical ? '#f59e0b' : undefined }}
                >
                  <div className="text-xs text-gray-600 mb-1">{item.label}</div>
                  <div className="text-sm font-medium">{item.value}</div>
                </div>
              ))}
          </div>
        </div>
        
        {/* Bottom toolbar for mobile */}
        <div className="flex-shrink-0 border-t border-gray-200">
          <BottomToolbar />
        </div>
      </div>
    );
  }

  // Tablet portrait: 2-row layout
  if (isPortraitTablet) {
    const tabletPDims = LAYOUT_DIMENSIONS.tabletP;
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
        {/* Row 1: Coop viewport full width */}
        <div
          className="w-full"
          style={{
            height: `${tabletPDims.viewportHeight}px`,
            aspectRatio: `${tabletPDims.viewportAspectRatio}`,
          }}
        >
          <LiveFeed />
        </div>

        {/* Row 2: Telemetry / Network */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            <EnvironmentControl />
            <div className="p-4 bg-white rounded border border-gray-200">
              <div className="font-medium mb-1 text-sm">Network Status</div>
              <div className="text-xs text-gray-600">Connected</div>
            </div>
          </div>
        </div>
        
        {/* Bottom toolbar for tablet portrait */}
        <div className="flex-shrink-0 border-t border-gray-200">
          <BottomToolbar />
        </div>
      </div>
    );
  }

  // Desktop/Tablet landscape: 3-column layout matching unified_ui.py
  // Note: Left nav is handled by Layout.tsx, so we only need viewport + right panel here
  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden w-full">
      {/* Gap - Left */}
      <div style={{ width: `${dims.gap}px`, flexShrink: 0 }} />

      {/* Main Viewport - Takes remaining space minus right panel and gaps */}
      <div 
        className="flex-1 flex flex-col min-w-0"
        style={{
          width: `calc(100% - ${dims.rightPanel}px - ${dims.gap * 2}px)`,
        }}
      >
        <div
          className="w-full mb-2 flex-shrink-0"
          style={{
            height: `${dims.viewportHeight}px`,
            minHeight: `${dims.viewportHeight}px`,
            maxHeight: `${dims.viewportHeight}px`,
          }}
        >
          <LiveFeed />
        </div>
        {/* Bottom toolbar */}
        <div className="flex-shrink-0">
          <BottomToolbar />
        </div>
      </div>

      {/* Gap - Right */}
      <div style={{ width: `${dims.gap}px`, flexShrink: 0 }} />

      {/* Right Panel - Telemetry */}
      <div
        className="flex-shrink-0 border-l border-gray-200 overflow-auto bg-white"
        style={{ width: `${dims.rightPanel}px` }}
      >
        <EnvironmentControl />
      </div>
    </div>
  );
}