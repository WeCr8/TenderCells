# Component Library Documentation

## Overview

This modern component library provides a comprehensive set of reusable UI components built with React, TypeScript, and Tailwind CSS. All components follow accessibility guidelines (WCAG 2.1) and include comprehensive testing.

## Components

### Button Component

A flexible button system with multiple variants, sizes, and states.

#### Features
- Multiple variants (primary, secondary, ghost, outline, danger, success)
- Size options (xs, sm, md, lg, xl)
- Icon support with left/right placement
- Loading states with spinner
- Ripple effect animation
- Full accessibility support
- Keyboard navigation

#### Usage
```tsx
import { Button } from './components/ui/Button';

// Basic usage
<Button variant="primary" size="md">
  Click me
</Button>

// With icon
<Button icon={<Download />} variant="outline">
  Download
</Button>

// Loading state
<Button loading variant="primary">
  Processing...
</Button>
```

#### Props
- `variant`: Visual style variant
- `size`: Button size
- `loading`: Show loading spinner
- `icon`: Icon element
- `iconPlacement`: Icon position (left/right)
- `fullWidth`: Make button full width
- `ripple`: Enable ripple effect
- `disabled`: Disable interaction

### Slider Component

A customizable slider with support for single values and ranges.

#### Features
- Single value and range selection
- Touch and mouse drag support
- Keyboard navigation (arrow keys, page up/down, home/end)
- Custom step increments
- Visual feedback for active/hover states
- Tick marks and custom marks
- Multiple size and color variants
- Full accessibility support

#### Usage
```tsx
import { Slider } from './components/ui/Slider';

// Single value slider
<Slider
  min={0}
  max={100}
  defaultValue={50}
  onChange={(value) => console.log(value)}
/>

// Range slider
<Slider
  range
  min={0}
  max={100}
  defaultValue={[25, 75]}
  onChange={(value) => console.log(value)}
/>

// With custom marks
<Slider
  marks={[
    { value: 0, label: 'Min' },
    { value: 50, label: 'Half' },
    { value: 100, label: 'Max' }
  ]}
/>
```

#### Props
- `min/max`: Value range
- `value/defaultValue`: Current value(s)
- `step`: Increment step
- `range`: Enable range selection
- `size`: Slider size (sm, md, lg)
- `variant`: Color variant
- `showLabels`: Show min/max labels
- `showTicks`: Show tick marks
- `marks`: Custom mark positions
- `disabled`: Disable interaction

### Preview Component

A responsive preview system for different device sizes and view states.

#### Features
- Multiple device presets (desktop, tablet, mobile)
- Custom device configurations
- Orientation toggle (portrait/landscape)
- Zoom controls (25% - 200%)
- Fullscreen mode
- iframe and component content support
- Loading and error states
- Responsive design

#### Usage
```tsx
import { Preview } from './components/ui/Preview';

// Component preview
<Preview>
  <YourComponent />
</Preview>

// iframe preview
<Preview src="https://example.com" />

// Custom devices
<Preview
  devices={[
    { name: 'iPhone', width: 375, height: 667, icon: <Phone /> },
    { name: 'iPad', width: 768, height: 1024, icon: <Tablet /> }
  ]}
/>
```

#### Props
- `children`: Component content to preview
- `src`: URL for iframe preview
- `devices`: Available device configurations
- `defaultDevice`: Initial device selection
- `showControls`: Show device/control buttons
- `showZoom`: Show zoom controls
- `showRotation`: Show rotation control
- `showFullscreen`: Show fullscreen toggle
- `background`: Preview background color
- `loading/error`: State management

## Accessibility Features

All components include comprehensive accessibility support:

### Keyboard Navigation
- **Button**: Space/Enter activation, focus management
- **Slider**: Arrow keys for value adjustment, Page Up/Down for larger steps, Home/End for min/max
- **Preview**: Tab navigation through controls

### ARIA Support
- Proper ARIA labels and descriptions
- Role attributes for screen readers
- Live regions for dynamic content
- Focus management and indicators

### Visual Accessibility
- High contrast color schemes
- Focus indicators
- Sufficient color contrast ratios
- Scalable text and icons

## Testing

### Unit Tests
All components include comprehensive unit tests using Vitest and React Testing Library:

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- Component rendering
- User interactions
- Accessibility features
- Edge cases and error states
- Keyboard navigation
- Props validation

## Storybook Documentation

Interactive component documentation is available through Storybook:

```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

### Story Categories
- **Components**: Main component stories
- **Examples**: Usage examples and patterns
- **Accessibility**: Accessibility demonstrations

## Browser Compatibility

Components are tested and supported in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- Optimized bundle size with tree shaking
- Minimal re-renders with React.memo where appropriate
- Efficient event handling
- CSS-in-JS avoided for better performance
- Lazy loading for large components

## Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm run test`
4. Start Storybook: `npm run storybook`

### Guidelines
- Follow TypeScript strict mode
- Include comprehensive tests
- Add Storybook stories for new components
- Follow accessibility guidelines
- Update documentation

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Include JSDoc comments
- Follow naming conventions