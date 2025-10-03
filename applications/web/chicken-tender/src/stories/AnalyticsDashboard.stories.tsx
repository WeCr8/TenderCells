import type { Meta, StoryObj } from '@storybook/react';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import type { AnalyticsDashboard as AnalyticsDashboardType } from '../types/analytics';

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
    },
    {
      id: 'metric2',
      name: 'Average Health Score',
      value: 87,
      unit: '%',
      trend: 'stable',
      change: 0,
      changePercent: 0,
      period: 'vs last week',
      category: 'health'
    },
    {
      id: 'metric3',
      name: 'Feed Consumption',
      value: 12.5,
      unit: 'kg',
      trend: 'down',
      change: -1.2,
      changePercent: -8.7,
      period: 'vs last week',
      category: 'production'
    },
    {
      id: 'metric4',
      name: 'Automation Success',
      value: 96.5,
      unit: '%',
      trend: 'up',
      change: 2.1,
      changePercent: 2.2,
      period: 'vs last month',
      category: 'automation'
    }
  ],
  charts: [
    {
      id: 'chart1',
      title: 'Egg Production Trends',
      description: 'Daily egg production over the last 30 days',
      type: 'production',
      period: 'monthly',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Eggs',
          data: [120, 135, 142, 138],
          borderColor: '#10b981',
          backgroundColor: '#10b981'
        }]
      },
      insights: [
        'Production increased by 15% this month',
        'Peak production on Tuesdays and Wednesdays'
      ],
      recommendations: [
        'Consider adjusting feed schedule for optimal production',
        'Monitor health during peak laying periods'
      ],
      generatedAt: new Date().toISOString(),
      status: 'ready'
    },
    {
      id: 'chart2',
      title: 'Health Monitoring',
      description: 'Flock health scores and trends',
      type: 'health',
      period: 'weekly',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Health Score',
          data: [85, 87, 89, 88, 90, 87, 86],
          borderColor: '#ef4444',
          backgroundColor: '#ef4444'
        }]
      },
      insights: [
        'Overall health trending upward',
        'Minor dip on weekends'
      ],
      recommendations: [
        'Maintain current health protocols',
        'Increase weekend monitoring'
      ],
      generatedAt: new Date().toISOString(),
      status: 'ready'
    }
  ],
  alerts: [
    {
      id: 'alert1',
      type: 'warning',
      title: 'Feed Consumption Drop',
      description: 'Feed consumption has decreased by 15% over the last 3 days',
      metric: 'feed_consumption',
      threshold: 15,
      currentValue: 12.5,
      createdAt: new Date().toISOString()
    }
  ],
  lastUpdated: new Date().toISOString()
};

const meta: Meta<typeof AnalyticsDashboard> = {
  title: 'Modules/Analytics/AnalyticsDashboard',
  component: AnalyticsDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main dashboard for analytics and reporting with metrics, charts, and insights.',
      },
    },
  },
  args: {
    dashboard: mockDashboard,
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnalyticsDashboard>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const WithAlerts: Story = {
  args: {
    dashboard: {
      ...mockDashboard,
      alerts: [
        ...mockDashboard.alerts,
        {
          id: 'alert2',
          type: 'critical',
          title: 'Health Score Critical',
          description: 'Multiple birds showing health scores below 60%',
          metric: 'health_score',
          threshold: 60,
          currentValue: 55,
          createdAt: new Date().toISOString()
        }
      ]
    }
  },
};

export const EmptyData: Story = {
  args: {
    dashboard: {
      metrics: [],
      charts: [],
      alerts: [],
      lastUpdated: new Date().toISOString()
    }
  },
};