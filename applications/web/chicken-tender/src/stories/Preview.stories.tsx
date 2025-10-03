import type { Meta, StoryObj } from '@storybook/react';
import { Preview } from '../components/ui/Preview';

const meta: Meta<typeof Preview> = {
  title: 'Components/Preview',
  component: Preview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A responsive preview component for displaying content across different device sizes. Supports iframe content, custom components, and device simulation.',
      },
    },
  },
  argTypes: {
    showControls: {
      control: 'boolean',
      description: 'Show device and control buttons',
    },
    showZoom: {
      control: 'boolean',
      description: 'Show zoom controls',
    },
    showRotation: {
      control: 'boolean',
      description: 'Show rotation control',
    },
    showFullscreen: {
      control: 'boolean',
      description: 'Show fullscreen control',
    },
    background: {
      control: 'select',
      options: ['white', 'gray', 'dark', 'transparent'],
      description: 'Preview background color',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Preview>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 h-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sample Content</h1>
        <p className="text-gray-600 mb-6">
          This is a sample preview showing how content appears across different devices.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Card 1</h3>
            <p className="text-sm text-gray-600">Some content here</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Card 2</h3>
            <p className="text-sm text-gray-600">More content here</p>
          </div>
        </div>
      </div>
    ),
  },
};

export const WithIframe: Story = {
  args: {
    src: 'https://example.com',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to load preview content',
  },
};

export const NoControls: Story = {
  args: {
    showControls: false,
    children: (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Simple Preview</h2>
        <p>Preview without controls</p>
      </div>
    ),
  },
};

export const DarkBackground: Story = {
  args: {
    background: 'dark',
    children: (
      <div className="p-8 bg-white text-center">
        <h2 className="text-2xl font-bold mb-4">White Content</h2>
        <p>On dark background</p>
      </div>
    ),
  },
};

export const CustomDevices: Story = {
  args: {
    devices: [
      {
        name: 'Small Mobile',
        width: 320,
        height: 568,
        icon: <span>📱</span>,
      },
      {
        name: 'Large Mobile',
        width: 414,
        height: 896,
        icon: <span>📱</span>,
      },
      {
        name: 'Tablet Pro',
        width: 1024,
        height: 1366,
        icon: <span>📱</span>,
      },
    ],
    children: (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Custom Devices</h2>
        <p>Using custom device configurations</p>
      </div>
    ),
  },
};