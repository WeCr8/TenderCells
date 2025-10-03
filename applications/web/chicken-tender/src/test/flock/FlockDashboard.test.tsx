import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FlockDashboard from '../../components/flock/FlockDashboard';
import type { FlockStats, FlockMember, FlockGroup } from '../../types/flock';

const mockStats: FlockStats = {
  totalBirds: 24,
  healthyBirds: 20,
  sickBirds: 2,
  missingBirds: 2,
  averageAge: 18,
  totalEggsToday: 18,
  averageHealthScore: 87,
  lastUpdated: new Date().toISOString()
};

const mockMembers: FlockMember[] = [
  {
    id: 'RF001',
    name: 'Henrietta',
    breed: 'Rhode Island Red',
    age: 24,
    status: 'healthy',
    rfidTag: 'RF001',
    lastSeen: '2 min ago',
    location: 'Zone A',
    healthScore: 95,
    eggProduction: { daily: 1, weekly: 6, monthly: 24 },
    vaccinations: [],
    notes: ''
  }
];

const mockGroups: FlockGroup[] = [
  {
    id: 'group1',
    name: 'Layer Group A',
    description: 'Primary laying hens',
    memberCount: 12,
    location: 'Zone A',
    createdAt: '2024-01-15T00:00:00Z',
    status: 'active',
    healthScore: 92
  }
];

describe('FlockDashboard', () => {
  it('renders dashboard with stats', () => {
    render(
      <FlockDashboard
        stats={mockStats}
        members={mockMembers}
        groups={mockGroups}
      />
    );

    expect(screen.getByText('Flock Management')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument(); // Total birds
    expect(screen.getByText('87%')).toBeInTheDocument(); // Health score
  });

  it('shows loading state', () => {
    render(
      <FlockDashboard
        stats={mockStats}
        members={[]}
        groups={[]}
        loading={true}
      />
    );

    expect(screen.getAllByRole('generic')).toHaveLength(4); // Loading cards
  });

  it('handles search functionality', () => {
    render(
      <FlockDashboard
        stats={mockStats}
        members={mockMembers}
        groups={mockGroups}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search flock...');
    fireEvent.change(searchInput, { target: { value: 'Henrietta' } });

    expect(screen.getByText('Henrietta')).toBeInTheDocument();
  });

  it('switches between members and groups view', () => {
    render(
      <FlockDashboard
        stats={mockStats}
        members={mockMembers}
        groups={mockGroups}
      />
    );

    const groupsButton = screen.getByText('Groups');
    fireEvent.click(groupsButton);

    expect(screen.getByText('Layer Group A')).toBeInTheDocument();
  });

  it('calls onAddMember when add button is clicked', () => {
    const onAddMember = vi.fn();
    render(
      <FlockDashboard
        stats={mockStats}
        members={mockMembers}
        groups={mockGroups}
        onAddMember={onAddMember}
      />
    );

    const addButton = screen.getByText('Add Member');
    fireEvent.click(addButton);

    expect(onAddMember).toHaveBeenCalled();
  });

  it('shows empty state when no members', () => {
    render(
      <FlockDashboard
        stats={mockStats}
        members={[]}
        groups={[]}
      />
    );

    expect(screen.getByText('No members found')).toBeInTheDocument();
  });
});