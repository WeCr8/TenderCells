// deviceColors.ts - Shared color scheme for devices across 2D and 3D views

export interface DeviceColorScheme {
  primary: string;
  secondary: string;
  border: string;
  icon: string;
}

export const DEVICE_COLORS: Record<string, DeviceColorScheme> = {
  sensor: {
    primary: "#4a90e2", // Blue
    secondary: "#6ba3e8",
    border: "#2850a7",
    icon: "📡",
  },
  camera: {
    primary: "#e74c3c", // Red
    secondary: "#ec7063",
    border: "#c0392b",
    icon: "📹",
  },
  feeder: {
    primary: "#2d7738", // Green
    secondary: "#4a5d3a",
    border: "#1a4d1f",
    icon: "🍽️",
  },
  water: {
    primary: "#16a085", // Teal
    secondary: "#48c9b0",
    border: "#138d75",
    icon: "💧",
  },
  door: {
    primary: "#f39c12", // Orange
    secondary: "#f8c471",
    border: "#d68910",
    icon: "🚪",
  },
  robot: {
    primary: "#9b59b6", // Purple
    secondary: "#bb8fce",
    border: "#7d3c98",
    icon: "🤖",
  },
};

export const getDeviceColor = (type: string): DeviceColorScheme => {
  return DEVICE_COLORS[type] || {
    primary: "#95a5a6",
    secondary: "#b2babb",
    border: "#7f8c8d",
    icon: "⚙️",
  };
};




