import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AddEntityModal from '../common/AddEntityModal';
import { useAutomationDevices } from '../../hooks/useAutomationDevices';

interface AddDeviceButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function AddDeviceButton({ 
  onSuccess, 
  className = '' 
}: AddDeviceButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { createDevice } = useAutomationDevices();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // Create a basic device - in a real app, you'd have a more complex form
      await createDevice({
        name: data.name,
        description: data.description,
        type: data.type,
        status: 'online',
        location: data.location,
        capabilities: data.capabilities || ['power'],
        actions: [],
        readings: [],
        lastSeen: new Date().toISOString(),
        firmware: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          updateAvailable: false
        },
        metadata: {
          manufacturer: data.manufacturer || 'Unknown',
          model: data.model || 'Generic',
          serialNumber: data.serialNumber || `SN${Math.floor(10000 + Math.random() * 90000)}`,
          installDate: new Date().toISOString()
        },
        settings: {}
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding device:', error);
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
        Add Device
      </Button>

      <AddEntityModal
        title="Add Device"
        description="Add a new device to your automation system"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        fields={[
          {
            id: 'name',
            label: 'Device Name',
            type: 'text',
            placeholder: 'Enter a name for this device',
            required: true
          },
          {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Describe this device and its purpose',
            required: true
          },
          {
            id: 'type',
            label: 'Device Type',
            type: 'select',
            required: true,
            options: [
              { label: 'Feeder', value: 'feeder' },
              { label: 'Water Dispenser', value: 'water_dispenser' },
              { label: 'Door', value: 'door' },
              { label: 'Light', value: 'light' },
              { label: 'Heater', value: 'heater' },
              { label: 'Fan', value: 'fan' },
              { label: 'Camera', value: 'camera' },
              { label: 'Sensor', value: 'sensor' },
              { label: 'Custom', value: 'custom' }
            ]
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
              { label: 'Feed Storage', value: 'Feed Storage' },
              { label: 'Exterior', value: 'Exterior' }
            ]
          },
          {
            id: 'manufacturer',
            label: 'Manufacturer',
            type: 'text',
            required: false,
            placeholder: 'Device manufacturer'
          },
          {
            id: 'model',
            label: 'Model',
            type: 'text',
            required: false,
            placeholder: 'Device model'
          },
          {
            id: 'serialNumber',
            label: 'Serial Number',
            type: 'text',
            required: false,
            placeholder: 'Leave blank to auto-generate'
          }
        ]}
        submitLabel="Add Device"
      />
    </>
  );
}