// ViewportModeGate.tsx
import React, { useState } from 'react';
import Viewport3D from './Viewport3D';
import Viewport2D from './Viewport2D';

export type ViewportMode = '3d' | '2d' | '3D' | '2D';

interface ViewportModeGateProps {
  defaultMode?: ViewportMode;
  mode?: ViewportMode;
  onModeChange?: (mode: ViewportMode) => void;
  devices?: any[];
  onDeviceAdd?: (device: any) => void;
  onDeviceUpdate?: (device: any) => void;
  onDeviceDelete?: (deviceId: string) => void;
}

export default function ViewportModeGate({
  defaultMode = '3d',
  mode: controlledMode,
  onModeChange,
  devices = [],
  onDeviceAdd,
  onDeviceUpdate,
  onDeviceDelete,
}: ViewportModeGateProps) {
  const [internalMode, setInternalMode] = useState<ViewportMode>(defaultMode);

  const mode = controlledMode !== undefined ? controlledMode : internalMode;

  const handleModeChange = (newMode: ViewportMode) => {
    if (controlledMode === undefined) {
      setInternalMode(newMode);
    }
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  if (mode === '2d' || mode === '2D') {
    return (
      <Viewport2D
        devices={devices}
        onDeviceAdd={onDeviceAdd}
        onDeviceUpdate={onDeviceUpdate}
        onDeviceDelete={onDeviceDelete}
      />
    );
  }

  return <Viewport3D devices={devices} />;
}
