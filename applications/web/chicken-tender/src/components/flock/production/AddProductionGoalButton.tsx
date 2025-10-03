import React, { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import AddEntityModal from '../../common/AddEntityModal';
import { useFlockProduction } from '../../../hooks/useFlockProduction';
import { useChickens } from '../../../hooks/useChickens';

interface AddProductionGoalButtonProps {
  chickenId?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function AddProductionGoalButton({ 
  chickenId, 
  onSuccess, 
  className = '' 
}: AddProductionGoalButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createProductionGoal } = useFlockProduction();
  const { chickens } = useChickens();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // Calculate end date based on period
      const startDate = new Date(data.startDate);
      const endDate = new Date(startDate);
      
      switch (data.period) {
        case 'daily':
          endDate.setDate(startDate.getDate() + 1);
          break;
        case 'weekly':
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(startDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(startDate.getFullYear() + 1);
          break;
      }
      
      await createProductionGoal({
        chickenId: data.chickenId || undefined,
        groupId: data.groupId || undefined,
        type: 'eggs',
        targetQuantity: data.targetQuantity,
        targetQuality: data.targetQuality,
        period: data.period,
        startDate: data.startDate,
        endDate: endDate.toISOString().split('T')[0],
        currentProgress: 0,
        status: 'not_started',
        createdBy: 'Owner',
        createdAt: new Date().toISOString()
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding production goal:', error);
      throw error;
    }
  };

  return (
    <>
      <Button
        variant="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={handleOpenModal}
        className={className}
      >
        Add Production Goal
      </Button>

      <AddEntityModal
        title="Add Production Goal"
        description="Set a production goal for your flock"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        fields={[
          {
            id: 'chickenId',
            label: 'Chicken (Optional)',
            type: 'select',
            required: false,
            defaultValue: chickenId || '',
            options: [
              { label: 'All Chickens', value: '' },
              ...chickens.map(chicken => ({
                label: chicken.name,
                value: chicken.id
              }))
            ]
          },
          {
            id: 'period',
            label: 'Goal Period',
            type: 'select',
            required: true,
            options: [
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' }
            ],
            defaultValue: 'weekly'
          },
          {
            id: 'targetQuantity',
            label: 'Target Quantity',
            type: 'number',
            required: true,
            defaultValue: 7,
            min: 1,
            max: 1000
          },
          {
            id: 'targetQuality',
            label: 'Target Quality',
            type: 'select',
            required: true,
            options: [
              { label: 'AA', value: 'AA' },
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
              { label: 'Any', value: 'A' }
            ],
            defaultValue: 'A'
          },
          {
            id: 'startDate',
            label: 'Start Date',
            type: 'date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0]
          }
        ]}
        submitLabel="Create Goal"
      />
    </>
  );
}