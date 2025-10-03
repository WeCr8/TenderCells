import React, { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';

export interface SliderProps {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Current value(s) */
  value?: number | [number, number];
  /** Default value(s) */
  defaultValue?: number | [number, number];
  /** Step increment */
  step?: number;
  /** Whether to show range selection */
  range?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** Show value labels */
  showLabels?: boolean;
  /** Show tick marks */
  showTicks?: boolean;
  /** Custom tick marks */
  marks?: Array<{ value: number; label?: string }>;
  /** Callback when value changes */
  onChange?: (value: number | [number, number]) => void;
  /** Callback when dragging starts */
  onChangeStart?: (value: number | [number, number]) => void;
  /** Callback when dragging ends */
  onChangeEnd?: (value: number | [number, number]) => void;
  /** Custom class name */
  className?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** ARIA labelledby */
  'aria-labelledby'?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  value: controlledValue,
  defaultValue,
  step = 1,
  range = false,
  disabled = false,
  size = 'md',
  variant = 'primary',
  showLabels = false,
  showTicks = false,
  marks = [],
  onChange,
  onChangeStart,
  onChangeEnd,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) => {
  const [internalValue, setInternalValue] = useState<number | [number, number]>(() => {
    if (controlledValue !== undefined) return controlledValue;
    if (defaultValue !== undefined) return defaultValue;
    return range ? [min, max] : min;
  });

  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [focusedThumb, setFocusedThumb] = useState<'start' | 'end' | null>(null);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const startThumbRef = useRef<HTMLDivElement>(null);
  const endThumbRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const normalizedValue = Array.isArray(currentValue) ? currentValue : [currentValue, currentValue];
  const [startValue, endValue] = normalizedValue;

  // Size configurations
  const sizeConfig = {
    sm: {
      track: 'h-1',
      thumb: 'w-4 h-4',
      label: 'text-xs',
    },
    md: {
      track: 'h-2',
      thumb: 'w-5 h-5',
      label: 'text-sm',
    },
    lg: {
      track: 'h-3',
      thumb: 'w-6 h-6',
      label: 'text-base',
    },
  };

  // Color configurations
  const colorConfig = {
    primary: {
      track: 'bg-farm-200',
      fill: 'bg-farm-500',
      thumb: 'bg-farm-500 border-farm-600',
      thumbFocus: 'ring-farm-200',
    },
    secondary: {
      track: 'bg-gray-200',
      fill: 'bg-gray-500',
      thumb: 'bg-gray-500 border-gray-600',
      thumbFocus: 'ring-gray-200',
    },
    success: {
      track: 'bg-emerald-200',
      fill: 'bg-emerald-500',
      thumb: 'bg-emerald-500 border-emerald-600',
      thumbFocus: 'ring-emerald-200',
    },
    warning: {
      track: 'bg-amber-200',
      fill: 'bg-amber-500',
      thumb: 'bg-amber-500 border-amber-600',
      thumbFocus: 'ring-amber-200',
    },
    danger: {
      track: 'bg-red-200',
      fill: 'bg-red-500',
      thumb: 'bg-red-500 border-red-600',
      thumbFocus: 'ring-red-200',
    },
  };

  const updateValue = useCallback((newValue: number | [number, number]) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  }, [isControlled, onChange]);

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return min;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const handleMouseDown = useCallback((thumb: 'start' | 'end') => (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(thumb);
    onChangeStart?.(currentValue);

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getValueFromPosition(e.clientX);
      
      if (range) {
        const [start, end] = normalizedValue;
        if (thumb === 'start') {
          updateValue([Math.min(newValue, end), end]);
        } else {
          updateValue([start, Math.max(newValue, start)]);
        }
      } else {
        updateValue(newValue);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      onChangeEnd?.(currentValue);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, currentValue, range, normalizedValue, getValueFromPosition, updateValue, onChangeStart, onChangeEnd]);

  const handleTouchStart = useCallback((thumb: 'start' | 'end') => (e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(thumb);
    onChangeStart?.(currentValue);

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const newValue = getValueFromPosition(touch.clientX);
      
      if (range) {
        const [start, end] = normalizedValue;
        if (thumb === 'start') {
          updateValue([Math.min(newValue, end), end]);
        } else {
          updateValue([start, Math.max(newValue, start)]);
        }
      } else {
        updateValue(newValue);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(null);
      onChangeEnd?.(currentValue);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [disabled, currentValue, range, normalizedValue, getValueFromPosition, updateValue, onChangeStart, onChangeEnd]);

  const handleKeyDown = useCallback((thumb: 'start' | 'end') => (e: React.KeyboardEvent) => {
    if (disabled) return;

    let delta = 0;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        delta = -step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        delta = step;
        break;
      case 'PageDown':
        delta = -step * 10;
        break;
      case 'PageUp':
        delta = step * 10;
        break;
      case 'Home':
        delta = min - (range ? normalizedValue[thumb === 'start' ? 0 : 1] : startValue);
        break;
      case 'End':
        delta = max - (range ? normalizedValue[thumb === 'start' ? 0 : 1] : startValue);
        break;
      default:
        return;
    }

    e.preventDefault();
    
    if (range) {
      const [start, end] = normalizedValue;
      if (thumb === 'start') {
        const newStart = Math.max(min, Math.min(start + delta, end));
        updateValue([newStart, end]);
      } else {
        const newEnd = Math.min(max, Math.max(end + delta, start));
        updateValue([start, newEnd]);
      }
    } else {
      const newValue = Math.max(min, Math.min(max, startValue + delta));
      updateValue(newValue);
    }
  }, [disabled, step, min, max, range, normalizedValue, startValue, updateValue]);

  const getPercentage = (value: number) => ((value - min) / (max - min)) * 100;

  const startPercentage = getPercentage(startValue);
  const endPercentage = range ? getPercentage(endValue) : startPercentage;

  return (
    <div className={clsx('relative w-full', className)}>
      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between mb-2">
          <span className={clsx(sizeConfig[size].label, 'text-gray-600')}>{min}</span>
          <span className={clsx(sizeConfig[size].label, 'text-gray-600')}>{max}</span>
        </div>
      )}

      {/* Slider container */}
      <div className="relative py-4">
        {/* Track */}
        <div
          ref={trackRef}
          className={clsx(
            'relative w-full rounded-full cursor-pointer',
            sizeConfig[size].track,
            colorConfig[variant].track,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={(e) => {
            if (disabled) return;
            const newValue = getValueFromPosition(e.clientX);
            
            if (range) {
              const [start, end] = normalizedValue;
              const distToStart = Math.abs(newValue - start);
              const distToEnd = Math.abs(newValue - end);
              
              if (distToStart < distToEnd) {
                updateValue([newValue, end]);
              } else {
                updateValue([start, newValue]);
              }
            } else {
              updateValue(newValue);
            }
          }}
        >
          {/* Fill */}
          <div
            className={clsx(
              'absolute top-0 h-full rounded-full transition-all duration-150',
              colorConfig[variant].fill
            )}
            style={{
              left: range ? `${startPercentage}%` : '0%',
              width: range ? `${endPercentage - startPercentage}%` : `${startPercentage}%`,
            }}
          />

          {/* Tick marks */}
          {(showTicks || marks.length > 0) && (
            <div className="absolute inset-0">
              {marks.length > 0 ? (
                marks.map((mark) => (
                  <div
                    key={mark.value}
                    className="absolute top-1/2 w-0.5 h-3 bg-gray-400 transform -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${getPercentage(mark.value)}%` }}
                  />
                ))
              ) : (
                Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => {
                  const value = min + i * step;
                  return (
                    <div
                      key={value}
                      className="absolute top-1/2 w-0.5 h-2 bg-gray-300 transform -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${getPercentage(value)}%` }}
                    />
                  );
                })
              )}
            </div>
          )}

          {/* Start thumb */}
          <div
            ref={startThumbRef}
            className={clsx(
              'absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 rounded-full border-2 cursor-grab transition-all duration-150',
              sizeConfig[size].thumb,
              colorConfig[variant].thumb,
              'hover:scale-110 focus:outline-none focus:ring-4',
              colorConfig[variant].thumbFocus,
              isDragging === 'start' && 'scale-110 cursor-grabbing',
              focusedThumb === 'start' && 'ring-4',
              disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
            )}
            style={{ left: `${startPercentage}%` }}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-label={ariaLabel || (range ? 'Start value' : 'Value')}
            aria-labelledby={ariaLabelledBy}
            aria-valuemin={min}
            aria-valuemax={range ? endValue : max}
            aria-valuenow={startValue}
            aria-disabled={disabled}
            onMouseDown={handleMouseDown('start')}
            onTouchStart={handleTouchStart('start')}
            onKeyDown={handleKeyDown('start')}
            onFocus={() => setFocusedThumb('start')}
            onBlur={() => setFocusedThumb(null)}
          />

          {/* End thumb (range only) */}
          {range && (
            <div
              ref={endThumbRef}
              className={clsx(
                'absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 rounded-full border-2 cursor-grab transition-all duration-150',
                sizeConfig[size].thumb,
                colorConfig[variant].thumb,
                'hover:scale-110 focus:outline-none focus:ring-4',
                colorConfig[variant].thumbFocus,
                isDragging === 'end' && 'scale-110 cursor-grabbing',
                focusedThumb === 'end' && 'ring-4',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
              )}
              style={{ left: `${endPercentage}%` }}
              tabIndex={disabled ? -1 : 0}
              role="slider"
              aria-label="End value"
              aria-valuemin={startValue}
              aria-valuemax={max}
              aria-valuenow={endValue}
              aria-disabled={disabled}
              onMouseDown={handleMouseDown('end')}
              onTouchStart={handleTouchStart('end')}
              onKeyDown={handleKeyDown('end')}
              onFocus={() => setFocusedThumb('end')}
              onBlur={() => setFocusedThumb(null)}
            />
          )}
        </div>

        {/* Value display */}
        {(isDragging || focusedThumb) && (
          <div className="absolute -top-8 left-0 right-0 flex justify-between pointer-events-none">
            <div
              className={clsx(
                'absolute bg-gray-900 text-white px-2 py-1 rounded text-xs transform -translate-x-1/2 transition-opacity duration-150',
                (isDragging === 'start' || focusedThumb === 'start') ? 'opacity-100' : 'opacity-0'
              )}
              style={{ left: `${startPercentage}%` }}
            >
              {startValue}
            </div>
            {range && (
              <div
                className={clsx(
                  'absolute bg-gray-900 text-white px-2 py-1 rounded text-xs transform -translate-x-1/2 transition-opacity duration-150',
                  (isDragging === 'end' || focusedThumb === 'end') ? 'opacity-100' : 'opacity-0'
                )}
                style={{ left: `${endPercentage}%` }}
              >
                {endValue}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mark labels */}
      {marks.length > 0 && marks.some(mark => mark.label) && (
        <div className="relative mt-2">
          {marks.map((mark) => (
            mark.label && (
              <div
                key={mark.value}
                className={clsx(
                  'absolute transform -translate-x-1/2 text-center',
                  sizeConfig[size].label,
                  'text-gray-600'
                )}
                style={{ left: `${getPercentage(mark.value)}%` }}
              >
                {mark.label}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};