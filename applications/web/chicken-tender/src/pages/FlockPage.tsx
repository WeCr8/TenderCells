import React from 'react';
import FlockDashboard from '../components/flock/FlockDashboard';
import type { FlockStats, FlockMember, FlockGroup } from '../types/flock';

// Mock data - replace with actual API calls
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
  },
  {
    id: 'RF002',
    name: 'Clucky',
    breed: 'Leghorn',
    age: 18,
    status: 'sick',
    rfidTag: 'RF002',
    lastSeen: '5 min ago',
    location: 'Zone B',
    healthScore: 65,
    eggProduction: { daily: 0, weekly: 3, monthly: 15 },
    vaccinations: [],
    notes: 'Under observation'
  },
  {
    id: 'RF003',
    name: 'Feathers',
    breed: 'Buff Orpington',
    age: 20,
    status: 'healthy',
    rfidTag: 'RF003',
    lastSeen: '1 min ago',
    location: 'Zone A',
    healthScore: 92,
    eggProduction: { daily: 1, weekly: 7, monthly: 28 },
    vaccinations: [],
    notes: ''
  },
  {
    id: 'RF004',
    name: 'Goldy',
    breed: 'Golden Comet',
    age: 22,
    status: 'missing',
    rfidTag: 'RF004',
    lastSeen: '2 hours ago',
    location: 'Unknown',
    healthScore: 0,
    eggProduction: { daily: 0, weekly: 5, monthly: 20 },
    vaccinations: [],
    notes: 'Last seen near fence'
  }
];

const mockGroups: FlockGroup[] = [
  {
    id: 'group1',
    name: 'Layer Group A',
    description: 'Primary laying hens in the main coop area',
    memberCount: 12,
    location: 'Zone A',
    createdAt: '2024-01-15T00:00:00Z',
    status: 'active',
    healthScore: 92
  },
  {
    id: 'group2',
    name: 'Young Pullets',
    description: 'Recently matured hens starting to lay',
    memberCount: 8,
    location: 'Zone B',
    createdAt: '2024-02-01T00:00:00Z',
    status: 'active',
    healthScore: 88
  }
];

export default function FlockPage() {
  const handleAddMember = () => {
    console.log('Add member clicked');
  };

  const handleAddGroup = () => {
    console.log('Add group clicked');
  };

  const handleMemberClick = (member: FlockMember) => {
    console.log('Member clicked:', member);
  };

  const handleGroupClick = (group: FlockGroup) => {
    console.log('Group clicked:', group);
  };

  return (
    <FlockDashboard
      stats={mockStats}
      members={mockMembers}
      groups={mockGroups}
      onAddMember={handleAddMember}
      onAddGroup={handleAddGroup}
      onMemberClick={handleMemberClick}
      onGroupClick={handleGroupClick}
    />
  );
}