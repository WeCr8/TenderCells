import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Preview } from './Preview';

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});

Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: vi.fn(),
});

describe('Preview', () => {
  it('renders with children content', () => {
    render(
      <Preview>
        <div>Test content</div>
      </Preview>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders device selection buttons', () => {
    render(<Preview><div>Content</div></Preview>);
    
    expect(screen.getByText('Desktop')).toBeInTheDocument();
    expect(screen.getByText('Tablet')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });

  it('switches between devices', () => {
    const onDeviceChange = vi.fn();
    render(
      <Preview onDeviceChange={onDeviceChange}>
        <div>Content</div>
      </Preview>
    );
    
    fireEvent.click(screen.getByText('Tablet'));
    expect(onDeviceChange).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<Preview loading />);
    
    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<Preview error="Test error" />);
    
    expect(screen.getByText('Preview Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('hides controls when showControls is false', () => {
    render(
      <Preview showControls={false}>
        <div>Content</div>
      </Preview>
    );
    
    expect(screen.queryByText('Desktop')).not.toBeInTheDocument();
  });

  it('handles zoom controls', () => {
    const onZoomChange = vi.fn();
    render(
      <Preview onZoomChange={onZoomChange}>
        <div>Content</div>
      </Preview>
    );
    
    const zoomInButton = screen.getByText('+');
    fireEvent.click(zoomInButton);
    
    expect(onZoomChange).toHaveBeenCalled();
  });

  it('renders iframe when src is provided', () => {
    render(<Preview src="https://example.com" />);
    
    const iframe = screen.getByTitle('Preview content');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://example.com');
  });

  it('handles orientation toggle for mobile devices', () => {
    const onOrientationChange = vi.fn();
    render(
      <Preview 
        defaultDevice="Mobile" 
        onOrientationChange={onOrientationChange}
      >
        <div>Content</div>
      </Preview>
    );
    
    // Click mobile device first
    fireEvent.click(screen.getByText('Mobile'));
    
    // Find and click rotation button
    const rotateButton = screen.getByTitle('Rotate device');
    fireEvent.click(rotateButton);
    
    expect(onOrientationChange).toHaveBeenCalledWith('landscape');
  });
});