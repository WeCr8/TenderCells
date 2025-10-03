import React, { useState } from 'react';
import { Plus, Egg } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import AddEntityModal from '../../common/AddEntityModal';
import { useFlockProduction } from '../../../hooks/useFlockProduction';
import { useChickens } from '../../../hooks/useChickens';

interface AddProductionRecordButtonProps {
  chickenId?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function AddProductionRecordButton({ 
  chickenId, 
  onSuccess, 
  className = '' 
}: AddProductionRecordButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createProductionRecord } = useFlockProduction();
  const { chickens } = useChickens();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const selectedChicken = chickens.find(c => c.id === data.chickenId);
      
      await createProductionRecord({
        chickenId: data.chickenId,
        chickenName: selectedChicken?.name || 'Unknown Chicken',
        date: data.date,
        type: 'eggs',
        quantity: data.quantity,
        quality: data.quality,
        size: data.size,
        weight: data.weight || undefined,
        notes: data.notes || undefined,
        collectedBy: data.collectedBy || 'Owner',
        location: data.location,
        timeOfDay: data.timeOfDay,
        nestBox: data.nestBox || undefined,
        createdAt: new Date().toISOString()
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding production record:', error);
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
        Add Production Record
      </Button>

      <AddEntityModal
        title="Add Production Record"
        description="Record egg production for a chicken"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        fields={[
          {
            id: 'chickenId',
            label: 'Chicken',
            type: 'select',
            required: true,
            defaultValue: chickenId,
            options: chickens.map(chicken => ({
              label: chicken.name,
              value: chicken.id
            }))
          },
          {
            id: 'date',
            label: 'Date',
            type: 'date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0]
          },
          {
            id: 'quantity',
            label: 'Quantity',
            type: 'number',
            required: true,
            defaultValue: 1,
            min: 1,
            max: 10
          },
          {
            id: 'quality',
            label: 'Quality',
            type: 'select',
            required: true,
            options: [
              { label: 'AA', value: 'AA' },
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
              { label: 'C', value: 'C' },
              { label: 'Reject', value: 'reject' }
            ],
            defaultValue: 'A'
          },
          {
            id: 'size',
            label: 'Size',
            type: 'select',
            required: true,
            options: [
              { label: 'Peewee', value: 'peewee' },
              { label: 'Small', value: 'small' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large', value: 'large' },
              { label: 'Extra Large', value: 'extra_large' },
              { label: 'Jumbo', value: 'jumbo' }
            ],
            defaultValue: 'medium'
          },
          {
            id: 'weight',
            label: 'Weight (g)',
            type: 'number',
            required: false,
            min: 30,
            max: 100
          },
          {
            id: 'timeOfDay',
            label: 'Time of Day',
            type: 'select',
            required: true,
            options: [
              { label: 'Morning', value: 'morning' },
              { label: 'Afternoon', value: 'afternoon' },
              { label: 'Evening', value: 'evening' }
            ],
            defaultValue: 'morning'
          },
          {
            id: 'location',
            label: 'Collection Location',
            type: 'select',
            required: true,
            options: [
              { label: 'Nesting Box', value: 'nesting_box' },
              { label: 'Coop Floor', value: 'coop_floor' },
              { label: 'Run', value: 'run' },
              { label: 'Other', value: 'other' }
            ],
            defaultValue: 'nesting_box'
          },
          {
            id: 'nestBox',
            label: 'Nest Box Number',
            type: 'text',
            required: false,
            placeholder: 'If collected from a specific nest box'
          },
          {
            id: 'collectedBy',
            label: 'Collected By',
            type: 'text',
            required: false,
            placeholder: 'Who collected the eggs',
            defaultValue: 'Owner'
          },
          {
            id: 'notes',
            label: 'Notes',
            type: 'textarea',
            placeholder: 'Any additional notes',
            required: false
          }
        ]}
        submitLabel="Add Record"
      />
    </>
  );
}