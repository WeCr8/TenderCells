import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Slider } from './Slider';

describe('Slider', () => {
  it('renders with default props', () => {
    render(<Slider aria-label="Test slider" />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders with custom min/max values', () => {
    render(<Slider min={10} max={50} aria-label="Custom range" />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '10');
    expect(slider).toHaveAttribute('aria-valuemax', '50');
  });

  it('renders range slider with two thumbs', () => {
    render(<Slider range aria-label="Range slider" />);
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
  });

  it('handles keyboard navigation', () => {
    const onChange = vi.fn();
    render(<Slider defaultValue={50} onChange={onChange} aria-label="Keyboard test" />);
    
    const slider = screen.getByRole('slider');
    slider.focus();
    
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(51);
    
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Slider disabled aria-label="Disabled slider" />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-disabled', 'true');
    expect(slider).toHaveAttribute('tabindex', '-1');
  });

  it('shows labels when showLabels is true', () => {
    render(<Slider showLabels min={0} max={100} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const onChange = vi.fn();
    render(<Slider onChange={onChange} aria-label="Change test" />);
    
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    
    expect(onChange).toHaveBeenCalled();
  });

  it('respects step value', () => {
    const onChange = vi.fn();
    render(<Slider step={5} defaultValue={0} onChange={onChange} aria-label="Step test" />);
    
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    
    expect(onChange).toHaveBeenCalledWith(5);
  });
});