import React, { useState } from 'react';
import { Bird, Plus } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AddEntityModal from '../common/AddEntityModal';
import { useChickens } from '../../hooks/useChickens';

interface AddChickenButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function AddChickenButton({ onSuccess, className = '' }: AddChickenButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addChicken } = useChickens();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      await addChicken({
        name: data.name,
        rfidTag: data.rfidTag || `RF${Math.floor(1000 + Math.random() * 9000)}`,
        breed: data.breed,
        age: data.age,
        status: 'active',
        health: {
          score: 100,
          lastCheckup: new Date().toISOString(),
          vaccinations: [],
          notes: data.notes || ''
        },
        production: {
          eggsToday: 0,
          eggsThisWeek: 0,
          eggsThisMonth: 0,
          averageEggsPerWeek: 0
        },
        location: {
          zone: data.location,
          lastSeen: new Date().toISOString()
        },
        behavior: {
          activityLevel: 'normal',
          feedingPattern: 'normal',
          socialBehavior: 'normal'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding chicken:', error);
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
        Add Chicken
      </Button>

      <AddEntityModal
        title="Add New Chicken"
        description="Add a new chicken to your flock"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        fields={[
          {
            id: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Enter chicken name',
            required: true
          },
          {
            id: 'breed',
            label: 'Breed',
            type: 'select',
            required: true,
            options: [
              { label: 'Rhode Island Red', value: 'rhode_island_red' },
              { label: 'Leghorn', value: 'leghorn' },
              { label: 'Plymouth Rock', value: 'plymouth_rock' },
              { label: 'Orpington', value: 'orpington' },
              { label: 'Wyandotte', value: 'wyandotte' },
              { label: 'Australorp', value: 'australorp' },
              { label: 'Sussex', value: 'sussex' },
              { label: 'Other', value: 'other' }
            ]
          },
          {
            id: 'age',
            label: 'Age (months)',
            type: 'number',
            required: true,
            defaultValue: 1,
            min: 0,
            max: 120
          },
          {
            id: 'rfidTag',
            label: 'RFID Tag',
            type: 'text',
            placeholder: 'Leave blank to auto-generate',
            required: false
          },
          {
            id: 'location',
            label: 'Location',
            type: 'select',
            required: true,
            options: [
              { label: 'Main Coop', value: 'Main Coop' },
              { label: 'Run A', value: 'Run A' },
              { label: 'Run B', value: 'Run B' },
              { label: 'Brooder', value: 'Brooder' },
              { label: 'Quarantine', value: 'Quarantine' }
            ],
            defaultValue: 'Main Coop'
          },
          {
            id: 'notes',
            label: 'Notes',
            type: 'textarea',
            placeholder: 'Additional notes about this chicken',
            required: false
          }
        ]}
        submitLabel="Add Chicken"
      />
    </>
  );
}