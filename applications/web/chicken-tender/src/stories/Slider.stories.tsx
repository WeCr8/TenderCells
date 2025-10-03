import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Slider } from '../components/ui/Slider';

const meta: Meta<typeof Slider> = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable slider component with support for single values and ranges. Includes touch support, keyboard navigation, and accessibility features.',
      },
    },
  },
  argTypes: {
    min: {
      control: 'number',
      description: 'Minimum value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    step: {
      control: 'number',
      description: 'Step increment',
    },
    range: {
      control: 'boolean',
      description: 'Enable range selection',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable slider interaction',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Slider size',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger'],
      description: 'Color variant',
    },
    showLabels: {
      control: 'boolean',
      description: 'Show min/max labels',
    },
    showTicks: {
      control: 'boolean',
      description: 'Show tick marks',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 50,
  },
};

export const Range: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: [25, 75],
    range: true,
  },
};

export const WithLabels: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 50,
    showLabels: true,
  },
};

export const WithTicks: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 50,
    showTicks: true,
    step: 10,
  },
};

export const WithMarks: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 50,
    marks: [
      { value: 0, label: 'Min' },
      { value: 25, label: '25%' },
      { value: 50, label: 'Half' },
      { value: 75, label: '75%' },
      { value: 100, label: 'Max' },
    ],
  },
};

export const Disabled: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 50,
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-8 w-80">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <Slider size="sm" defaultValue={30} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium</h3>
        <Slider size="md" defaultValue={50} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <Slider size="lg" defaultValue={70} />
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-8 w-80">
      <div>
        <h3 className="text-sm font-medium mb-2">Primary</h3>
        <Slider variant="primary" defaultValue={50} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Secondary</h3>
        <Slider variant="secondary" defaultValue={50} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Success</h3>
        <Slider variant="success" defaultValue={50} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Warning</h3>
        <Slider variant="warning" defaultValue={50} />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Danger</h3>
        <Slider variant="danger" defaultValue={50} />
      </div>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    const [rangeValue, setRangeValue] = useState<[number, number]>([25, 75]);

    return (
      <div className="space-y-8 w-80">
        <div>
          <h3 className="text-sm font-medium mb-2">Single Value: {value}</h3>
          <Slider
            value={value}
            onChange={(newValue) => setValue(newValue as number)}
            showLabels
          />
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">
            Range: {rangeValue[0]} - {rangeValue[1]}
          </h3>
          <Slider
            range
            value={rangeValue}
            onChange={(newValue) => setRangeValue(newValue as [number, number])}
            showLabels
          />
        </div>
      </div>
    );
  },
};