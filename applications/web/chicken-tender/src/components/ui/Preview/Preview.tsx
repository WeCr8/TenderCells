import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../Button/Button';
import LoadingSpinner from '../LoadingSpinner';

export interface PreviewDevice {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  userAgent?: string;
}

export interface PreviewProps {
  /** Content to preview */
  children?: React.ReactNode;
  /** URL to preview in iframe */
  src?: string;
  /** Available devices */
  devices?: PreviewDevice[];
  /** Default device */
  defaultDevice?: string;
  /** Show device controls */
  showControls?: boolean;
  /** Show zoom controls */
  showZoom?: boolean;
  /** Show rotation control */
  showRotation?: boolean;
  /** Show fullscreen control */
  showFullscreen?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Background color */
  background?: 'white' | 'gray' | 'dark' | 'transparent';
  /** Custom class name */
  className?: string;
  /** Callback when device changes */
  onDeviceChange?: (device: PreviewDevice) => void;
  /** Callback when orientation changes */
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  /** Callback when zoom changes */
  onZoomChange?: (zoom: number) => void;
}

const defaultDevices: PreviewDevice[] = [
  {
    name: 'Desktop',
    width: 1200,
    height: 800,
    icon: <Monitor className="w-4 h-4" />,
  },
  {
    name: 'Tablet',
    width: 768,
    height: 1024,
    icon: <Tablet className="w-4 h-4" />,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  },
  {
    name: 'Mobile',
    width: 375,
    height: 667,
    icon: <Smartphone className="w-4 h-4" />,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  },
];

export const Preview: React.FC<PreviewProps> = ({
  children,
  src,
  devices = defaultDevices,
  defaultDevice = 'Desktop',
  showControls = true,
  showZoom = true,
  showRotation = true,
  showFullscreen = true,
  loading = false,
  error,
  background = 'gray',
  className,
  onDeviceChange,
  onOrientationChange,
  onZoomChange,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<PreviewDevice>(() => {
    return devices.find(d => d.name === defaultDevice) || devices[0];
  });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(!!src);
  const [iframeError, setIframeError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Background configurations
  const backgroundConfig = {
    white: 'bg-white',
    gray: 'bg-gray-100',
    dark: 'bg-gray-900',
    transparent: 'bg-transparent',
  };

  // Calculate preview dimensions
  const getPreviewDimensions = () => {
    const { width, height } = selectedDevice;
    const isLandscape = orientation === 'landscape';
    
    return {
      width: isLandscape ? height : width,
      height: isLandscape ? width : height,
    };
  };

  const { width: previewWidth, height: previewHeight } = getPreviewDimensions();

  // Handle device change
  const handleDeviceChange = (device: PreviewDevice) => {
    setSelectedDevice(device);
    onDeviceChange?.(device);
  };

  // Handle orientation change
  const handleOrientationToggle = () => {
    const newOrientation = orientation === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(newOrientation);
    onOrientationChange?.(newOrientation);
  };

  // Handle zoom change
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(0.25, Math.min(2, newZoom));
    setZoom(clampedZoom);
    onZoomChange?.(clampedZoom);
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(null);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError('Failed to load preview content');
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          {/* Device selection */}
          <div className="flex items-center space-x-2">
            {devices.map((device) => (
              <Button
                key={device.name}
                variant={selectedDevice.name === device.name ? 'primary' : 'ghost'}
                size="sm"
                icon={device.icon}
                onClick={() => handleDeviceChange(device)}
                className="flex-shrink-0"
              >
                {device.name}
              </Button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Zoom controls */}
            {showZoom && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleZoomChange(zoom - 0.25)}
                  disabled={zoom <= 0.25}
                >
                  -
                </Button>
                <span className="text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleZoomChange(zoom + 0.25)}
                  disabled={zoom >= 2}
                >
                  +
                </Button>
              </div>
            )}

            {/* Rotation control */}
            {showRotation && selectedDevice.name !== 'Desktop' && (
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleOrientationToggle}
                title="Rotate device"
              />
            )}

            {/* Fullscreen control */}
            {showFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                icon={isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                onClick={handleFullscreenToggle}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              />
            )}
          </div>
        </div>
      )}

      {/* Preview area */}
      <div className={clsx('flex-1 flex items-center justify-center p-8', backgroundConfig[background])}>
        {loading ? (
          <LoadingSpinner size="lg" text="Loading preview..." />
        ) : error || iframeError ? (
          <div className="text-center">
            <div className="text-red-500 text-lg font-medium mb-2">Preview Error</div>
            <div className="text-gray-600">{error || iframeError}</div>
          </div>
        ) : (
          <div
            ref={previewRef}
            className="relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            style={{
              width: previewWidth * zoom,
              height: previewHeight * zoom,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            {/* Device frame */}
            <div className="absolute inset-0 border border-gray-300 rounded-lg pointer-events-none" />

            {/* Content */}
            <div
              className="w-full h-full overflow-auto"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: previewWidth,
                height: previewHeight,
              }}
            >
              {src ? (
                <>
                  {iframeLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white">
                      <LoadingSpinner size="md" text="Loading content..." />
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    src={src}
                    className="w-full h-full border-0"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    title="Preview content"
                  />
                </>
              ) : (
                <div className="w-full h-full">
                  {children}
                </div>
              )}
            </div>

            {/* Device info overlay */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {selectedDevice.name} • {previewWidth} × {previewHeight}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};