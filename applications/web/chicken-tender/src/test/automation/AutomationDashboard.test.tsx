import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AutomationDashboard from '../../components/automation/AutomationDashboard';
import type { AutomationStats, AutomationRule } from '../../types/automation';

const mockStats: AutomationStats = {
  totalRules: 12,
  activeRules: 8,
  executionsToday: 24,
  successRate: 96.5,
  lastExecution: new Date().toISOString(),
  upcomingTasks: 6
};

const mockRules: AutomationRule[] = [
  {
    id: 'rule1',
    name: 'Morning Feeding',
    description: 'Automatic feeding schedule',
    type: 'feeding',
    status: 'active',
    trigger: {
      type: 'time',
      conditions: [{ parameter: 'time', operator: 'equals', value: '06:00' }]
    },
    actions: [],
    executionCount: 45,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

describe('AutomationDashboard', () => {
  it('renders dashboard with stats', () => {
    render(
      <AutomationDashboard
        stats={mockStats}
        rules={mockRules}
      />
    );

    expect(screen.getByText('Automation Center')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Total rules
    expect(screen.getByText('97%')).toBeInTheDocument(); // Success rate
  });

  it('shows loading state', () => {
    render(
      <AutomationDashboard
        stats={mockStats}
        rules={[]}
        loading={true}
      />
    );

    expect(screen.getAllByRole('generic')).toHaveLength(4); // Loading cards
  });

  it('handles search functionality', () => {
    render(
      <AutomationDashboard
        stats={mockStats}
        rules={mockRules}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search automation rules...');
    fireEvent.change(searchInput, { target: { value: 'Morning' } });

    expect(screen.getByText('Morning Feeding')).toBeInTheDocument();
  });

  it('calls onAddRule when add button is clicked', () => {
    const onAddRule = vi.fn();
    render(
      <AutomationDashboard
        stats={mockStats}
        rules={mockRules}
        onAddRule={onAddRule}
      />
    );

    const addButton = screen.getByText('Add Rule');
    fireEvent.click(addButton);

    expect(onAddRule).toHaveBeenCalled();
  });

  it('shows empty state when no rules', () => {
    render(
      <AutomationDashboard
        stats={mockStats}
        rules={[]}
      />
    );

    expect(screen.getByText('No automation rules found')).toBeInTheDocument();
  });
});