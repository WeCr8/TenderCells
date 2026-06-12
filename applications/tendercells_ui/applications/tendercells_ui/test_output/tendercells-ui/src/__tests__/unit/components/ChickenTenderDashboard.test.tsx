import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/utils/testHelpers';
import ChickenTenderDashboard from '@/pages/ChickenTenderDashboard';

// Mock child components
vi.mock('@/components/viewport/Viewport3D', () => ({
  default: () => <div data-testid="viewport-3d">3D Viewport</div>,
}));

vi.mock('@/components/telemetry/TelemetryPanel', () => ({
  default: () => <div data-testid="telemetry-panel">Telemetry Panel</div>,
}));

vi.mock('@/components/toolbar/BottomToolbar', () => ({
  default: () => <div data-testid="bottom-toolbar">Bottom Toolbar</div>,
}));

describe('ChickenTenderDashboard', () => {
  it('renders dashboard title', () => {
    render(<ChickenTenderDashboard />);
    expect(screen.getByText('Chicken Tender Dashboard')).toBeInTheDocument();
  });

  it('renders 3D viewport', () => {
    render(<ChickenTenderDashboard />);
    expect(screen.getByTestId('viewport-3d')).toBeInTheDocument();
  });

  it('renders telemetry panel', () => {
    render(<ChickenTenderDashboard />);
    expect(screen.getByTestId('telemetry-panel')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    render(<ChickenTenderDashboard />);
    expect(screen.getByText('Control Doors')).toBeInTheDocument();
    expect(screen.getByText('Feeding Schedule')).toBeInTheDocument();
    expect(screen.getByText('Egg Collection')).toBeInTheDocument();
  });
});

