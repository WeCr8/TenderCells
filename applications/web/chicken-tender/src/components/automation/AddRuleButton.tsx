import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AddEntityModal from '../common/AddEntityModal';
import { useAutomationRules } from '../../hooks/useAutomationRules';

interface AddRuleButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function AddRuleButton({ 
  onSuccess, 
  className = '' 
}: AddRuleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createRule } = useAutomationRules();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // This is a simplified rule creation - in a real app, you'd have a more complex form
      // for setting up triggers, conditions, and actions
      await createRule({
        name: data.name,
        description: data.description,
        category: data.category,
        status: data.status,
        priority: data.priority,
        triggers: [
          {
            id: `trigger-${Date.now()}`,
            type: data.triggerType,
            name: `${data.triggerType} Trigger`,
            description: `Trigger based on ${data.triggerType}`,
            conditions: [],
            enabled: true
          }
        ],
        actions: [
          {
            id: `action-${Date.now()}`,
            type: data.actionType,
            name: `${data.actionType} Action`,
            description: `Action to ${data.actionType}`,
            parameters: {},
            enabled: true
          }
        ],
        settings: {
          retryOnFailure: data.retryOnFailure,
          notifyOnFailure: data.notifyOnFailure,
          logExecution: true
        }
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding automation rule:', error);
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
        Add Rule
      </Button>

      <AddEntityModal
        title="Add Automation Rule"
        description="Create a new automation rule"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        fields={[
          {
            id: 'name',
            label: 'Rule Name',
            type: 'text',
            placeholder: 'Enter a name for this rule',
            required: true
          },
          {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Describe what this rule does',
            required: true
          },
          {
            id: 'category',
            label: 'Category',
            type: 'select',
            required: true,
            options: [
              { label: 'Feeding', value: 'feeding' },
              { label: 'Lighting', value: 'lighting' },
              { label: 'Temperature', value: 'temperature' },
              { label: 'Door', value: 'door' },
              { label: 'Cleaning', value: 'cleaning' },
              { label: 'Health Check', value: 'health_check' },
              { label: 'Security', value: 'security' },
              { label: 'Maintenance', value: 'maintenance' }
            ]
          },
          {
            id: 'status',
            label: 'Initial Status',
            type: 'select',
            required: true,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Testing', value: 'testing' }
            ],
            defaultValue: 'inactive'
          },
          {
            id: 'priority',
            label: 'Priority',
            type: 'number',
            required: true,
            defaultValue: 5,
            min: 1,
            max: 10
          },
          {
            id: 'triggerType',
            label: 'Trigger Type',
            type: 'select',
            required: true,
            options: [
              { label: 'Time-based', value: 'time' },
              { label: 'Sensor-based', value: 'sensor' },
              { label: 'Event-based', value: 'event' },
              { label: 'Manual', value: 'manual' }
            ]
          },
          {
            id: 'actionType',
            label: 'Action Type',
            type: 'select',
            required: true,
            options: [
              { label: 'Device Control', value: 'device_control' },
              { label: 'Notification', value: 'notification' },
              { label: 'Data Logging', value: 'data_log' },
              { label: 'Alert', value: 'alert' }
            ]
          },
          {
            id: 'retryOnFailure',
            label: 'Retry on Failure',
            type: 'checkbox',
            defaultValue: true
          },
          {
            id: 'notifyOnFailure',
            label: 'Notify on Failure',
            type: 'checkbox',
            defaultValue: true
          }
        ]}
        submitLabel="Create Rule"
      />
    </>
  );
}