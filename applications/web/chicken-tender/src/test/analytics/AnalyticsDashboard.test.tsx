import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import type { AnalyticsDashboard as AnalyticsDashboardType } from '../../types/analytics';

const mockDashboard: AnalyticsDashboardType = {
  metrics: [
    {
      id: 'metric1',
      name: 'Daily Egg Production',
      value: 18,
      unit: 'eggs',
      trend: 'up',
      change: 3,
      changePercent: 20,
      period: 'vs yesterday',
      category: 'production'
    }
  ],
  charts: [
    {
      id: 'chart1',
      title: 'Egg Production Trends',
      description: 'Daily egg production trends',
      type: 'production',
      period: 'monthly',
      data: {
        labels: ['Week 1', 'Week 2'],
        datasets: [{ label: 'Eggs', data: [120, 135] }]
      },
      insights: ['Production increased'],
      recommendations: ['Maintain schedule'],
      generatedAt: new Date().toISOString(),
      status: 'ready'
    }
  ],
  alerts: [],
  lastUpdated: new Date().toISOString()
};

describe('AnalyticsDashboard', () => {
  it('renders dashboard with metrics', () => {
    render(<AnalyticsDashboard dashboard={mockDashboard} />);

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Daily Egg Production')).toBeInTheDocument();
    expect(screen.getByText('18 eggs')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<AnalyticsDashboard dashboard={mockDashboard} loading={true} />);

    expect(screen.getAllByRole('generic')).toHaveLength(4); // Loading cards
  });

  it('handles period filter change', () => {
    render(<AnalyticsDashboard dashboard={mockDashboard} />);

    const periodSelect = screen.getByDisplayValue('Last 7 Days');
    fireEvent.change(periodSelect, { target: { value: '30d' } });

    expect(periodSelect).toHaveValue('30d');
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(
      <AnalyticsDashboard 
        dashboard={mockDashboard} 
        onRefresh={onRefresh} 
      />
    );

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });

  it('displays alerts when present', () => {
    const dashboardWithAlerts = {
      ...mockDashboard,
      alerts: [
        {
          id: 'alert1',
          type: 'warning' as const,
          title: 'Test Alert',
          description: 'Test description',
          metric: 'test',
          threshold: 10,
          currentValue: 5,
          createdAt: new Date().toISOString()
        }
      ]
    };

    render(<AnalyticsDashboard dashboard={dashboardWithAlerts} />);

    expect(screen.getByText('Analytics Alerts')).toBeInTheDocument();
    expect(screen.getByText('Test Alert:')).toBeInTheDocument();
  });
});