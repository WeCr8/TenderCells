import React, { useState } from 'react';
import { Plus, Stethoscope } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import AddEntityModal from '../../common/AddEntityModal';
import { useFlockHealth } from '../../../hooks/useFlockHealth';
import { useChickens } from '../../../hooks/useChickens';

interface AddHealthRecordButtonProps {
  chickenId?: string;
  onSuccess?: () => void;
  className?: string;
}

export default function AddHealthRecordButton({ 
  chickenId, 
  onSuccess, 
  className = '' 
}: AddHealthRecordButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createHealthRecord } = useFlockHealth();
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
      
      await createHealthRecord({
        chickenId: data.chickenId,
        chickenName: selectedChicken?.name || 'Unknown Chicken',
        recordType: data.recordType,
        date: data.date,
        veterinarian: data.veterinarian || undefined,
        description: data.description,
        symptoms: data.symptoms ? data.symptoms.split(',').map((s: string) => s.trim()) : undefined,
        diagnosis: data.diagnosis || undefined,
        treatment: data.treatment ? {
          id: `treatment-${Date.now()}`,
          name: data.treatment,
          type: 'medication',
          startDate: data.date,
          status: 'in_progress',
          administeredBy: data.administeredBy || 'Owner'
        } : undefined,
        followUpRequired: data.followUpRequired,
        followUpDate: data.followUpRequired ? data.followUpDate : undefined,
        severity: data.severity,
        status: data.status,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding health record:', error);
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
        Add Health Record
      </Button>

      <AddEntityModal
        title="Add Health Record"
        description="Record a health event for a chicken"
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
            id: 'recordType',
            label: 'Record Type',
            type: 'select',
            required: true,
            options: [
              { label: 'Checkup', value: 'checkup' },
              { label: 'Vaccination', value: 'vaccination' },
              { label: 'Treatment', value: 'treatment' },
              { label: 'Illness', value: 'illness' },
              { label: 'Injury', value: 'injury' },
              { label: 'Quarantine', value: 'quarantine' }
            ]
          },
          {
            id: 'date',
            label: 'Date',
            type: 'date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0]
          },
          {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Describe the health event',
            required: true
          },
          {
            id: 'symptoms',
            label: 'Symptoms',
            type: 'text',
            placeholder: 'Enter symptoms, separated by commas',
            required: false
          },
          {
            id: 'diagnosis',
            label: 'Diagnosis',
            type: 'text',
            placeholder: 'Enter diagnosis if available',
            required: false
          },
          {
            id: 'treatment',
            label: 'Treatment',
            type: 'text',
            placeholder: 'Enter treatment if provided',
            required: false
          },
          {
            id: 'administeredBy',
            label: 'Administered By',
            type: 'text',
            placeholder: 'Who administered the treatment',
            required: false
          },
          {
            id: 'veterinarian',
            label: 'Veterinarian',
            type: 'text',
            placeholder: 'Name of veterinarian (if applicable)',
            required: false
          },
          {
            id: 'severity',
            label: 'Severity',
            type: 'select',
            required: true,
            options: [
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Critical', value: 'critical' }
            ],
            defaultValue: 'low'
          },
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Ongoing', value: 'ongoing' }
            ],
            defaultValue: 'active'
          },
          {
            id: 'followUpRequired',
            label: 'Follow-up Required',
            type: 'checkbox',
            required: false,
            defaultValue: false
          },
          {
            id: 'followUpDate',
            label: 'Follow-up Date',
            type: 'date',
            required: false
          },
          {
            id: 'notes',
            label: 'Additional Notes',
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