import React from 'react';
import { FileText, Calendar, User, Tag } from 'lucide-react';
import type { MacroFunction, MacroParameter } from '../../types/macros';

/**
 * Factory function to create a record-adding macro
 */
export function createAddRecordMacro(
  id: string,
  name: string,
  description: string,
  recordType: string,
  parameters: MacroParameter[],
  executeFunction: (params: Record<string, any>) => Promise<any>
): MacroFunction {
  return {
    id,
    name,
    description,
    type: 'record',
    icon: '📝',
    parameters,
    execute: executeFunction,
    isRepeatable: true,
    requiresConfirmation: false,
    category: 'Records',
    tags: [recordType, 'add', 'record']
  };
}

/**
 * Create a macro for adding a health record
 */
export const addHealthRecordMacro: MacroFunction = createAddRecordMacro(
  'add-health-record',
  'Add Health Record',
  'Create a new health record for a chicken',
  'health',
  [
    {
      id: 'chickenId',
      name: 'Chicken',
      description: 'Select the chicken for this health record',
      type: 'entity',
      required: true,
      validation: {
        entityType: 'chicken'
      }
    },
    {
      id: 'recordType',
      name: 'Record Type',
      description: 'Type of health record',
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
      name: 'Date',
      description: 'Date of the health event',
      type: 'date',
      required: true,
      defaultValue: new Date().toISOString().split('T')[0]
    },
    {
      id: 'description',
      name: 'Description',
      description: 'Detailed description of the health event',
      type: 'string',
      required: true
    },
    {
      id: 'severity',
      name: 'Severity',
      description: 'Severity level of the health issue',
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
      id: 'followUpRequired',
      name: 'Follow-up Required',
      description: 'Does this record require a follow-up?',
      type: 'boolean',
      required: false,
      defaultValue: false
    },
    {
      id: 'followUpDate',
      name: 'Follow-up Date',
      description: 'Date for the follow-up',
      type: 'date',
      required: false,
      dependsOn: 'followUpRequired'
    }
  ],
  async (params) => {
    // In a real implementation, this would call the health record service
    console.log('Adding health record with params:', params);
    return {
      id: `record-${Date.now()}`,
      chickenId: params.chickenId,
      recordType: params.recordType,
      date: params.date,
      description: params.description,
      severity: params.severity,
      followUpRequired: params.followUpRequired,
      followUpDate: params.followUpDate,
      status: 'active',
      createdAt: new Date().toISOString()
    };
  }
);

/**
 * Create a macro for adding a production record
 */
export const addProductionRecordMacro: MacroFunction = createAddRecordMacro(
  'add-production-record',
  'Add Production Record',
  'Record egg production for a chicken or group',
  'production',
  [
    {
      id: 'chickenId',
      name: 'Chicken',
      description: 'Select the chicken for this production record',
      type: 'entity',
      required: true,
      validation: {
        entityType: 'chicken'
      }
    },
    {
      id: 'date',
      name: 'Date',
      description: 'Date of production',
      type: 'date',
      required: true,
      defaultValue: new Date().toISOString().split('T')[0]
    },
    {
      id: 'quantity',
      name: 'Quantity',
      description: 'Number of eggs collected',
      type: 'number',
      required: true,
      defaultValue: 1,
      validation: {
        min: 0,
        max: 10
      }
    },
    {
      id: 'quality',
      name: 'Quality',
      description: 'Egg quality grade',
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
      id: 'weight',
      name: 'Weight (g)',
      description: 'Weight of eggs in grams',
      type: 'number',
      required: false,
      validation: {
        min: 0,
        max: 200
      }
    },
    {
      id: 'notes',
      name: 'Notes',
      description: 'Additional notes about this production',
      type: 'string',
      required: false
    }
  ],
  async (params) => {
    // In a real implementation, this would call the production record service
    console.log('Adding production record with params:', params);
    return {
      id: `record-${Date.now()}`,
      chickenId: params.chickenId,
      date: params.date,
      quantity: params.quantity,
      quality: params.quality,
      weight: params.weight,
      notes: params.notes,
      createdAt: new Date().toISOString()
    };
  }
);

/**
 * Create a macro for adding a new chicken
 */
export const addChickenMacro: MacroFunction = createAddRecordMacro(
  'add-chicken',
  'Add New Chicken',
  'Add a new chicken to your flock',
  'chicken',
  [
    {
      id: 'name',
      name: 'Name',
      description: 'Name of the chicken',
      type: 'string',
      required: true
    },
    {
      id: 'breed',
      name: 'Breed',
      description: 'Breed of the chicken',
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
      name: 'Age (months)',
      description: 'Age of the chicken in months',
      type: 'number',
      required: true,
      defaultValue: 1,
      validation: {
        min: 0,
        max: 120
      }
    },
    {
      id: 'rfidTag',
      name: 'RFID Tag',
      description: 'RFID tag identifier',
      type: 'string',
      required: false
    },
    {
      id: 'location',
      name: 'Location',
      description: 'Current location of the chicken',
      type: 'select',
      required: true,
      options: [
        { label: 'Main Coop', value: 'main_coop' },
        { label: 'Run A', value: 'run_a' },
        { label: 'Run B', value: 'run_b' },
        { label: 'Brooder', value: 'brooder' },
        { label: 'Quarantine', value: 'quarantine' }
      ],
      defaultValue: 'main_coop'
    },
    {
      id: 'notes',
      name: 'Notes',
      description: 'Additional notes about this chicken',
      type: 'string',
      required: false
    }
  ],
  async (params) => {
    // In a real implementation, this would call the chicken service
    console.log('Adding chicken with params:', params);
    return {
      id: `chicken-${Date.now()}`,
      name: params.name,
      breed: params.breed,
      age: params.age,
      rfidTag: params.rfidTag || `RF${Math.floor(1000 + Math.random() * 9000)}`,
      location: params.location,
      status: 'active',
      health: {
        score: 100,
        lastCheckup: new Date().toISOString(),
        vaccinations: [],
        notes: params.notes || ''
      },
      createdAt: new Date().toISOString()
    };
  }
);

/**
 * Create a macro for feeding task
 */
export const feedingMacro: MacroFunction = {
  id: 'feeding-task',
  name: 'Feeding Task',
  description: 'Record a feeding task for your flock',
  type: 'feeding',
  icon: '🍲',
  parameters: [
    {
      id: 'feedType',
      name: 'Feed Type',
      description: 'Type of feed used',
      type: 'select',
      required: true,
      options: [
        { label: 'Layer Feed', value: 'layer' },
        { label: 'Starter', value: 'starter' },
        { label: 'Grower', value: 'grower' },
        { label: 'Scratch Grains', value: 'scratch' },
        { label: 'Treats', value: 'treats' }
      ]
    },
    {
      id: 'amount',
      name: 'Amount (kg)',
      description: 'Amount of feed in kilograms',
      type: 'number',
      required: true,
      defaultValue: 1,
      validation: {
        min: 0.1,
        max: 50
      }
    },
    {
      id: 'location',
      name: 'Location',
      description: 'Where the feed was distributed',
      type: 'select',
      required: true,
      options: [
        { label: 'Main Coop', value: 'main_coop' },
        { label: 'Run A', value: 'run_a' },
        { label: 'Run B', value: 'run_b' },
        { label: 'All Locations', value: 'all' }
      ],
      defaultValue: 'main_coop'
    },
    {
      id: 'notes',
      name: 'Notes',
      description: 'Additional notes about this feeding',
      type: 'string',
      required: false
    }
  ],
  execute: async (params) => {
    // In a real implementation, this would call the feeding service
    console.log('Recording feeding task with params:', params);
    return {
      id: `feeding-${Date.now()}`,
      feedType: params.feedType,
      amount: params.amount,
      location: params.location,
      notes: params.notes,
      timestamp: new Date().toISOString()
    };
  },
  isRepeatable: true,
  requiresConfirmation: false,
  category: 'Daily Tasks',
  tags: ['feeding', 'daily', 'task']
};

/**
 * Create a macro for water refill task
 */
export const waterRefillMacro: MacroFunction = {
  id: 'water-refill',
  name: 'Water Refill',
  description: 'Record a water refill task',
  type: 'maintenance',
  icon: '💧',
  parameters: [
    {
      id: 'amount',
      name: 'Amount (liters)',
      description: 'Amount of water in liters',
      type: 'number',
      required: true,
      defaultValue: 5,
      validation: {
        min: 0.1,
        max: 100
      }
    },
    {
      id: 'location',
      name: 'Location',
      description: 'Where the water was refilled',
      type: 'select',
      required: true,
      options: [
        { label: 'Main Coop', value: 'main_coop' },
        { label: 'Run A', value: 'run_a' },
        { label: 'Run B', value: 'run_b' },
        { label: 'All Locations', value: 'all' }
      ],
      defaultValue: 'main_coop'
    },
    {
      id: 'addedSupplements',
      name: 'Added Supplements',
      description: 'Were any supplements added to the water?',
      type: 'boolean',
      required: false,
      defaultValue: false
    },
    {
      id: 'supplementType',
      name: 'Supplement Type',
      description: 'Type of supplement added',
      type: 'select',
      required: false,
      dependsOn: 'addedSupplements',
      options: [
        { label: 'Vitamins', value: 'vitamins' },
        { label: 'Electrolytes', value: 'electrolytes' },
        { label: 'Probiotics', value: 'probiotics' },
        { label: 'Medication', value: 'medication' }
      ]
    },
    {
      id: 'notes',
      name: 'Notes',
      description: 'Additional notes about this water refill',
      type: 'string',
      required: false
    }
  ],
  execute: async (params) => {
    // In a real implementation, this would call the maintenance service
    console.log('Recording water refill with params:', params);
    return {
      id: `water-${Date.now()}`,
      amount: params.amount,
      location: params.location,
      addedSupplements: params.addedSupplements,
      supplementType: params.supplementType,
      notes: params.notes,
      timestamp: new Date().toISOString()
    };
  },
  isRepeatable: true,
  requiresConfirmation: false,
  category: 'Daily Tasks',
  tags: ['water', 'maintenance', 'daily']
};

/**
 * Create a macro for coop cleaning task
 */
export const coopCleaningMacro: MacroFunction = {
  id: 'coop-cleaning',
  name: 'Coop Cleaning',
  description: 'Record a coop cleaning task',
  type: 'maintenance',
  icon: '🧹',
  parameters: [
    {
      id: 'cleaningType',
      name: 'Cleaning Type',
      description: 'Type of cleaning performed',
      type: 'select',
      required: true,
      options: [
        { label: 'Quick Clean', value: 'quick' },
        { label: 'Standard Clean', value: 'standard' },
        { label: 'Deep Clean', value: 'deep' }
      ],
      defaultValue: 'standard'
    },
    {
      id: 'location',
      name: 'Location',
      description: 'Area that was cleaned',
      type: 'select',
      required: true,
      options: [
        { label: 'Main Coop', value: 'main_coop' },
        { label: 'Nesting Boxes', value: 'nesting_boxes' },
        { label: 'Run A', value: 'run_a' },
        { label: 'Run B', value: 'run_b' },
        { label: 'All Areas', value: 'all' }
      ],
      defaultValue: 'main_coop'
    },
    {
      id: 'beddingReplaced',
      name: 'Bedding Replaced',
      description: 'Was the bedding replaced?',
      type: 'boolean',
      required: true,
      defaultValue: true
    },
    {
      id: 'notes',
      name: 'Notes',
      description: 'Additional notes about this cleaning',
      type: 'string',
      required: false
    }
  ],
  execute: async (params) => {
    // In a real implementation, this would call the maintenance service
    console.log('Recording coop cleaning with params:', params);
    return {
      id: `cleaning-${Date.now()}`,
      cleaningType: params.cleaningType,
      location: params.location,
      beddingReplaced: params.beddingReplaced,
      notes: params.notes,
      timestamp: new Date().toISOString()
    };
  },
  isRepeatable: true,
  requiresConfirmation: false,
  category: 'Maintenance',
  tags: ['cleaning', 'maintenance', 'weekly']
};

/**
 * Component that exports all predefined macros
 */
export default function AddRecordMacro() {
  // This component doesn't render anything directly
  // It's used to export the macro definitions
  return null;
}

// Export all predefined macros
export const predefinedMacros: MacroFunction[] = [
  addHealthRecordMacro,
  addProductionRecordMacro,
  addChickenMacro,
  feedingMacro,
  waterRefillMacro,
  coopCleaningMacro
];