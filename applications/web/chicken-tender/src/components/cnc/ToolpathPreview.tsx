import React, { useRef, useEffect, useState } from 'react';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Grid3X3,
  Eye,
  EyeOff,
  Ruler
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import type { GCodeFile, MachineStatus, JobProgress, Position } from '../../types/cnc';

interface ToolpathPreviewProps {
  file: GCodeFile | null;
  machineStatus: MachineStatus | null;
  progress: JobProgress | null;
  className?: string;
}

interface ViewSettings {
  showGrid: boolean;
  showAxes: boolean;
  showDimensions: boolean;
  showToolpath: boolean;
  showRapidMoves: boolean;
}

export default function ToolpathPreview({
  file,
  machineStatus,
  progress,
  className = ''
}: ToolpathPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    showGrid: true,
    showAxes: true,
    showDimensions: true,
    showToolpath: true,
    showRapidMoves: false
  });

  useEffect(() => {
    if (file) {
      drawToolpath();
    }
  }, [file, zoom, pan, viewSettings, machineStatus, progress]);

  const drawToolpath = () => {
    const canvas = canvasRef.current;
    if (!canvas || !file) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Set up coordinate system
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.translate(centerX + pan.x, centerY + pan.y);
    ctx.scale(zoom, -zoom); // Flip Y axis for standard CNC coordinates

    // Calculate scale based on bounding box
    const bbox = file.boundingBox;
    const width = bbox.max.x - bbox.min.x;
    const height = bbox.max.y - bbox.min.y;
    const maxDimension = Math.max(width, height, 1);
    const scale = Math.min(canvas.width, canvas.height) / (maxDimension * 2);

    ctx.scale(scale, scale);

    // Draw grid
    if (viewSettings.showGrid) {
      drawGrid(ctx, bbox);
    }

    // Draw axes
    if (viewSettings.showAxes) {
      drawAxes(ctx, bbox);
    }

    // Draw toolpath
    if (viewSettings.showToolpath) {
      drawGCodePath(ctx, file.content);
    }

    // Draw current position
    if (machineStatus) {
      drawCurrentPosition(ctx, machineStatus.position.work);
    }

    // Draw work envelope
    drawWorkEnvelope(ctx, bbox);

    ctx.restore();

    // Draw dimensions (in screen coordinates)
    if (viewSettings.showDimensions) {
      drawDimensions(ctx, bbox, scale, zoom, pan, centerX, centerY);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, bbox: { min: Position; max: Position }) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5 / zoom;
    
    const gridSize = 10;
    const minX = Math.floor(bbox.min.x / gridSize) * gridSize;
    const maxX = Math.ceil(bbox.max.x / gridSize) * gridSize;
    const minY = Math.floor(bbox.min.y / gridSize) * gridSize;
    const maxY = Math.ceil(bbox.max.y / gridSize) * gridSize;

    ctx.beginPath();
    for (let x = minX; x <= maxX; x += gridSize) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    for (let y = minY; y <= maxY; y += gridSize) {
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
    ctx.stroke();
  };

  const drawAxes = (ctx: CanvasRenderingContext2D, bbox: { min: Position; max: Position }) => {
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1 / zoom;

    // X axis
    ctx.beginPath();
    ctx.moveTo(bbox.min.x, 0);
    ctx.lineTo(bbox.max.x, 0);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(0, bbox.min.y);
    ctx.lineTo(0, bbox.max.y);
    ctx.stroke();

    // Origin
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, 2 / zoom, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawGCodePath = (ctx: CanvasRenderingContext2D, gcode: string) => {
    const lines = gcode.split('\n');
    let currentX = 0, currentY = 0, currentZ = 0;
    let isFirstMove = true;

    ctx.lineWidth = 1.5 / zoom;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toUpperCase();
      
      if (line.startsWith('G0') || line.startsWith('G1')) {
        const xMatch = line.match(/X([-+]?\d*\.?\d+)/);
        const yMatch = line.match(/Y([-+]?\d*\.?\d+)/);
        const zMatch = line.match(/Z([-+]?\d*\.?\d+)/);

        const newX = xMatch ? parseFloat(xMatch[1]) : currentX;
        const newY = yMatch ? parseFloat(yMatch[1]) : currentY;
        const newZ = zMatch ? parseFloat(zMatch[1]) : currentZ;

        if (line.startsWith('G0')) {
          // Rapid move
          if (viewSettings.showRapidMoves) {
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([5 / zoom, 5 / zoom]);
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            ctx.lineTo(newX, newY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else {
          // Feed move
          const isCompleted = progress ? i <= progress.currentLine : false;
          ctx.strokeStyle = isCompleted ? '#10b981' : '#3b82f6';
          
          if (!isFirstMove) {
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            ctx.lineTo(newX, newY);
            ctx.stroke();
          }
        }

        currentX = newX;
        currentY = newY;
        currentZ = newZ;
        isFirstMove = false;
      }
    }
  };

  const drawCurrentPosition = (ctx: CanvasRenderingContext2D, position: Position) => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(position.x, position.y, 3 / zoom, 0, 2 * Math.PI);
    ctx.fill();

    // Position crosshairs
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(position.x - 5 / zoom, position.y);
    ctx.lineTo(position.x + 5 / zoom, position.y);
    ctx.moveTo(position.x, position.y - 5 / zoom);
    ctx.lineTo(position.x, position.y + 5 / zoom);
    ctx.stroke();
  };

  const drawWorkEnvelope = (ctx: CanvasRenderingContext2D, bbox: { min: Position; max: Position }) => {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([10 / zoom, 5 / zoom]);
    
    ctx.beginPath();
    ctx.rect(bbox.min.x, bbox.min.y, bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawDimensions = (
    ctx: CanvasRenderingContext2D,
    bbox: { min: Position; max: Position },
    scale: number,
    zoom: number,
    pan: { x: number; y: number },
    centerX: number,
    centerY: number
  ) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

    ctx.fillStyle = '#374151';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';

    const width = bbox.max.x - bbox.min.x;
    const height = bbox.max.y - bbox.min.y;

    // Width dimension
    ctx.fillText(
      `${width.toFixed(2)}mm`,
      centerX + pan.x,
      20
    );

    // Height dimension
    ctx.save();
    ctx.translate(20, centerY + pan.y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${height.toFixed(2)}mm`, 0, 0);
    ctx.restore();

    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setPan(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(10, prev * delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleViewSetting = (setting: keyof ViewSettings) => {
    setViewSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Toolpath Preview</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Grid3X3 className="w-4 h-4" />}
            onClick={() => toggleViewSetting('showGrid')}
            className={viewSettings.showGrid ? 'bg-gray-100' : ''}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Ruler className="w-4 h-4" />}
            onClick={() => toggleViewSetting('showDimensions')}
            className={viewSettings.showDimensions ? 'bg-gray-100' : ''}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={viewSettings.showRapidMoves ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            onClick={() => toggleViewSetting('showRapidMoves')}
            className={viewSettings.showRapidMoves ? 'bg-gray-100' : ''}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<ZoomIn className="w-4 h-4" />}
            onClick={() => setZoom(prev => Math.min(10, prev * 1.2))}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<ZoomOut className="w-4 h-4" />}
            onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={resetView}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Maximize2 className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ height: '500px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
        
        {!file && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Maximize2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No toolpath to display</p>
              <p className="text-sm">Select a G-code file to view the toolpath</p>
            </div>
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-3 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span>Toolpath</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-emerald-500"></div>
              <span>Completed</span>
            </div>
            {viewSettings.showRapidMoves && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t"></div>
                <span>Rapid</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Current</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Info */}
      {file && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">File:</span>
            <p className="font-medium truncate">{file.name}</p>
          </div>
          <div>
            <span className="text-gray-600">Lines:</span>
            <p className="font-medium">{file.lineCount}</p>
          </div>
          <div>
            <span className="text-gray-600">Est. Time:</span>
            <p className="font-medium">{Math.floor(file.estimatedTime / 60)}m</p>
          </div>
          <div>
            <span className="text-gray-600">Material:</span>
            <p className="font-medium">{file.material}</p>
          </div>
        </div>
      )}
    </div>
  );
}