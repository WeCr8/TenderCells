import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FlockDashboard from './FlockDashboard';
import AddChickenButton from './AddChickenButton';
import { useChickens } from '../../hooks/useChickens';
import type { FlockMember, FlockGroup } from '../../types/flock';

export default function FlockPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { chickens, summary, loading, refetch } = useChickens();
  
  // Check for URL parameters that might trigger actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'add-chicken') {
      // This would open the add chicken modal
      // For now, we'll just clear the URL parameter
      navigate('/flock', { replace: true });
    }
  }, [location, navigate]);

  // Convert chickens to FlockMember format
  const flockMembers: FlockMember[] = chickens.map(chicken => ({
    id: chicken.id,
    name: chicken.name,
    breed: chicken.breed,
    age: chicken.age,
    status: chicken.status,
    rfidTag: chicken.rfidTag,
    lastSeen: chicken.location?.lastSeen ? new Date(chicken.location.lastSeen).toLocaleTimeString() : 'Unknown',
    location: chicken.location?.zone || 'Unknown',
    healthScore: chicken.health.score,
    eggProduction: {
      daily: chicken.production.eggsToday,
      weekly: chicken.production.eggsThisWeek,
      monthly: chicken.production.eggsThisMonth
    },
    vaccinations: chicken.health.vaccinations,
    notes: chicken.health.notes
  }));

  // Mock groups for now
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

  const handleAddMember = () => {
    // This would be handled by the AddChickenButton component
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
    <>
      {/* Custom header with add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flock Management</h1>
          <p className="text-gray-600">Monitor and manage your flock health and productivity</p>
        </div>
        <AddChickenButton onSuccess={refetch} />
      </div>
      
      <FlockDashboard
        stats={summary || {
          totalBirds: chickens.length,
          healthyBirds: chickens.filter(c => c.status === 'active').length,
          sickBirds: chickens.filter(c => c.status === 'sick').length,
          missingBirds: chickens.filter(c => c.status === 'missing').length,
          averageAge: chickens.reduce((sum, c) => sum + c.age, 0) / Math.max(1, chickens.length),
          totalEggsToday: chickens.reduce((sum, c) => sum + c.production.eggsToday, 0),
          averageHealthScore: chickens.reduce((sum, c) => sum + c.health.score, 0) / Math.max(1, chickens.length),
          lastUpdated: new Date().toISOString()
        }}
        members={flockMembers}
        groups={mockGroups}
        loading={loading}
        onAddMember={handleAddMember}
        onAddGroup={handleAddGroup}
        onMemberClick={handleMemberClick}
        onGroupClick={handleGroupClick}
      />
    </>
  );
}