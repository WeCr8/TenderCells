import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state */
  loading?: boolean;
  /** Icon element */
  icon?: React.ReactNode;
  /** Icon placement */
  iconPlacement?: 'left' | 'right';
  /** Full width button */
  fullWidth?: boolean;
  /** Rounded corners */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Enable ripple effect */
  ripple?: boolean;
  /** Custom class name */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPlacement = 'left',
  fullWidth = false,
  rounded = 'md',
  ripple = true,
  className,
  disabled,
  children,
  onClick,
  ...props
}, ref) => {
  const [rippleArray, setRippleArray] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

  // Base styles
  const baseStyles = clsx(
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'overflow-hidden',
    fullWidth && 'w-full'
  );

  // Size configurations
  const sizeConfig = {
    xs: {
      padding: children ? 'px-2 py-1' : 'p-1',
      text: 'text-xs',
      iconSize: 'w-3 h-3',
      gap: 'gap-1',
    },
    sm: {
      padding: children ? 'px-3 py-1.5' : 'p-1.5',
      text: 'text-sm',
      iconSize: 'w-4 h-4',
      gap: 'gap-1.5',
    },
    md: {
      padding: children ? 'px-4 py-2' : 'p-2',
      text: 'text-sm',
      iconSize: 'w-4 h-4',
      gap: 'gap-2',
    },
    lg: {
      padding: children ? 'px-6 py-3' : 'p-3',
      text: 'text-base',
      iconSize: 'w-5 h-5',
      gap: 'gap-2',
    },
    xl: {
      padding: children ? 'px-8 py-4' : 'p-4',
      text: 'text-lg',
      iconSize: 'w-6 h-6',
      gap: 'gap-3',
    },
  };

  // Variant configurations
  const variantConfig = {
    primary: {
      base: 'bg-farm-600 text-white border border-farm-600',
      hover: 'hover:bg-farm-700 hover:border-farm-700',
      active: 'active:bg-farm-800',
      focus: 'focus:ring-farm-500',
      ripple: 'bg-white/20',
    },
    secondary: {
      base: 'bg-gray-600 text-white border border-gray-600',
      hover: 'hover:bg-gray-700 hover:border-gray-700',
      active: 'active:bg-gray-800',
      focus: 'focus:ring-gray-500',
      ripple: 'bg-white/20',
    },
    ghost: {
      base: 'bg-transparent text-gray-700 border border-transparent',
      hover: 'hover:bg-gray-100',
      active: 'active:bg-gray-200',
      focus: 'focus:ring-gray-500',
      ripple: 'bg-gray-500/20',
    },
    outline: {
      base: 'bg-transparent text-gray-700 border border-gray-300',
      hover: 'hover:bg-gray-50 hover:border-gray-400',
      active: 'active:bg-gray-100',
      focus: 'focus:ring-gray-500',
      ripple: 'bg-gray-500/20',
    },
    danger: {
      base: 'bg-red-600 text-white border border-red-600',
      hover: 'hover:bg-red-700 hover:border-red-700',
      active: 'active:bg-red-800',
      focus: 'focus:ring-red-500',
      ripple: 'bg-white/20',
    },
    success: {
      base: 'bg-emerald-600 text-white border border-emerald-600',
      hover: 'hover:bg-emerald-700 hover:border-emerald-700',
      active: 'active:bg-emerald-800',
      focus: 'focus:ring-emerald-500',
      ripple: 'bg-white/20',
    },
  };

  // Rounded configurations
  const roundedConfig = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];
  const currentRounded = roundedConfig[rounded];

  // Handle ripple effect
  const handleRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!ripple || disabled || loading) return;

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRippleArray(prev => [...prev, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRippleArray(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleRipple(event);
    onClick?.(event);
  };

  // Render icon
  const renderIcon = () => {
    if (loading) {
      return <Loader2 className={clsx(currentSize.iconSize, 'animate-spin')} />;
    }
    if (icon) {
      return React.cloneElement(icon as React.ReactElement, {
        className: clsx(currentSize.iconSize, (icon as React.ReactElement).props?.className),
      });
    }
    return null;
  };

  const iconElement = renderIcon();
  const hasContent = children || iconElement;

  return (
    <button
      ref={ref}
      className={clsx(
        baseStyles,
        currentSize.padding,
        currentSize.text,
        currentVariant.base,
        currentVariant.hover,
        currentVariant.active,
        currentVariant.focus,
        currentRounded,
        hasContent && currentSize.gap,
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Content */}
      {iconPlacement === 'left' && iconElement}
      {children}
      {iconPlacement === 'right' && iconElement}

      {/* Ripple effects */}
      {ripple && rippleArray.map(({ x, y, id }) => (
        <span
          key={id}
          className={clsx(
            'absolute rounded-full pointer-events-none animate-ping',
            currentVariant.ripple
          )}
          style={{
            left: x - 10,
            top: y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </button>
  );
});