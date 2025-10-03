import React, { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AddEntityModal from '../common/AddEntityModal';
import { useAutomationSchedules } from '../../hooks/useAutomationSchedules';

interface AddScheduleButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function AddScheduleButton({ 
  onSuccess, 
  className = '' 
}: AddScheduleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createSchedule } = useAutomationSchedules();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // Create a basic schedule - in a real app, you'd have a more complex form
      // for setting up actions and detailed schedule configuration
      await createSchedule({
        name: data.name,
        description: data.description,
        type: data.scheduleType,
        status: data.status,
        priority: data.priority,
        
        // Time configuration based on schedule type
        time: data.scheduleType === 'daily' || data.scheduleType === 'weekly' ? {
          hour: parseInt(data.time.split(':')[0]),
          minute: parseInt(data.time.split(':')[1]),
          second: 0
        } : undefined,
        
        days: data.scheduleType === 'weekly' ? ['Monday'] : undefined,
        dates: data.scheduleType === 'monthly' ? [1] : undefined,
        interval: data.scheduleType === 'interval' ? data.interval : undefined,
        cronExpression: data.scheduleType === 'cron' ? data.cronExpression : undefined,
        
        // Basic action
        actions: [
          {
            id: `action-${Date.now()}`,
            type: 'device_control',
            name: 'Default Action',
            description: 'Default action created with schedule',
            target: {
              type: 'device',
              id: 'default-device',
              name: 'Default Device'
            },
            parameters: {},
            enabled: true
          }
        ],
        
        // Execution settings
        executionSettings: {
          timeout: 60,
          retryCount: 3,
          retryDelay: 5,
          skipIfMissed: data.skipIfMissed,
          runOnStartup: data.runOnStartup
        },
        
        // Stats
        executionCount: 0,
        successCount: 0,
        failureCount: 0,
        
        // Metadata
        tags: [],
        createdBy: 'Owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
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
        Add Schedule
      </Button>

      <AddEntityModal
        title="Add Schedule"
        description="Create a new automation schedule"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        fields={[
          {
            id: 'name',
            label: 'Schedule Name',
            type: 'text',
            placeholder: 'Enter a name for this schedule',
            required: true
          },
          {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Describe what this schedule does',
            required: true
          },
          {
            id: 'scheduleType',
            label: 'Schedule Type',
            type: 'select',
            required: true,
            options: [
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Interval', value: 'interval' },
              { label: 'Cron', value: 'cron' }
            ],
            defaultValue: 'daily'
          },
          {
            id: 'time',
            label: 'Time',
            type: 'text',
            placeholder: 'HH:MM (24-hour format)',
            required: true,
            defaultValue: '08:00'
          },
          {
            id: 'interval',
            label: 'Interval (minutes)',
            type: 'number',
            required: false,
            defaultValue: 60,
            min: 1,
            max: 1440
          },
          {
            id: 'cronExpression',
            label: 'Cron Expression',
            type: 'text',
            placeholder: '* * * * *',
            required: false
          },
          {
            id: 'status',
            label: 'Initial Status',
            type: 'select',
            required: true,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Paused', value: 'paused' }
            ],
            defaultValue: 'inactive'
          },
          {
            id: 'priority',
            label: 'Priority',
            type: 'select',
            required: true,
            options: [
              { label: 'Low', value: 'low' },
              { label: 'Normal', value: 'normal' },
              { label: 'High', value: 'high' },
              { label: 'Critical', value: 'critical' }
            ],
            defaultValue: 'normal'
          },
          {
            id: 'skipIfMissed',
            label: 'Skip If Missed',
            type: 'checkbox',
            defaultValue: true
          },
          {
            id: 'runOnStartup',
            label: 'Run On Startup',
            type: 'checkbox',
            defaultValue: false
          }
        ]}
        submitLabel="Create Schedule"
      />
    </>
  );
}