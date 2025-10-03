import React, { useState } from 'react';
import { 
  Bird, 
  Heart, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react';
import { Button } from '../ui/Button/Button';
import FlockStatsCard from './FlockStatsCard';
import FlockMemberCard from './FlockMemberCard';
import FlockGroupCard from './FlockGroupCard';
import type { FlockStats, FlockMember, FlockGroup } from '../../types/flock';

interface FlockDashboardProps {
  stats: FlockStats;
  members: FlockMember[];
  groups: FlockGroup[];
  loading?: boolean;
  onAddMember?: () => void;
  onAddGroup?: () => void;
  onMemberClick?: (member: FlockMember) => void;
  onGroupClick?: (group: FlockGroup) => void;
}

export default function FlockDashboard({
  stats,
  members,
  groups,
  loading = false,
  onAddMember,
  onAddGroup,
  onMemberClick,
  onGroupClick
}: FlockDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'members' | 'groups'>('members');

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flock Management</h1>
          <p className="text-gray-600">Monitor and manage your flock health and productivity</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            Filters
          </Button>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={viewMode === 'members' ? onAddMember : onAddGroup}
          >
            Add {viewMode === 'members' ? 'Member' : 'Group'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FlockStatsCard
          title="Total Birds"
          value={stats.totalBirds}
          icon={Bird}
          trend={{ value: 5, label: "this month" }}
          status="good"
        />
        <FlockStatsCard
          title="Health Score"
          value={`${Math.round(stats.averageHealthScore)}%`}
          icon={Heart}
          trend={{ value: 2, label: "vs last week" }}
          status={stats.averageHealthScore >= 90 ? "good" : stats.averageHealthScore >= 70 ? "warning" : "danger"}
        />
        <FlockStatsCard
          title="Eggs Today"
          value={stats.totalEggsToday}
          icon={TrendingUp}
          trend={{ value: 8, label: "vs yesterday" }}
          status="good"
        />
        <FlockStatsCard
          title="Health Issues"
          value={stats.sickBirds + stats.missingBirds}
          icon={AlertTriangle}
          status={stats.sickBirds + stats.missingBirds === 0 ? "good" : "warning"}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search flock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="sick">Sick</option>
            <option value="missing">Missing</option>
            <option value="quarantine">Quarantine</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'members' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('members')}
          >
            Members
          </Button>
          <Button
            variant={viewMode === 'groups' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('groups')}
          >
            Groups
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {viewMode === 'members' ? (
          filteredMembers.map((member) => (
            <FlockMemberCard
              key={member.id}
              member={member}
              onClick={() => onMemberClick?.(member)}
            />
          ))
        ) : (
          filteredGroups.map((group) => (
            <FlockGroupCard
              key={group.id}
              group={group}
              onClick={() => onGroupClick?.(group)}
            />
          ))
        )}
      </div>

      {/* Empty State */}
      {((viewMode === 'members' && filteredMembers.length === 0) || 
        (viewMode === 'groups' && filteredGroups.length === 0)) && (
        <div className="text-center py-12">
          <Bird className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {viewMode} found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : `Get started by adding your first ${viewMode.slice(0, -1)}`
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={viewMode === 'members' ? onAddMember : onAddGroup}
            >
              Add {viewMode === 'members' ? 'Member' : 'Group'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}