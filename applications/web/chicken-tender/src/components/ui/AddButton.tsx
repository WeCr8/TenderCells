import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from './Button/Button';

interface AddButtonProps {
  label?: string;
  options?: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }[];
  onClick?: () => void;
  className?: string;
}

export default function AddButton({
  label = 'Add',
  options,
  onClick,
  className = ''
}: AddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionFn: () => void) => {
    setIsOpen(false);
    optionFn();
  };

  // If there are no options, render a simple button
  if (!options || options.length === 0) {
    return (
      <Button
        variant="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={onClick}
        className={className}
      >
        {label}
      </Button>
    );
  }

  // If there's only one option, render a simple button that calls that option
  if (options.length === 1) {
    return (
      <Button
        variant="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={options[0].onClick}
        className={className}
      >
        {label}
      </Button>
    );
  }

  // Otherwise, render a dropdown
  return (
    <div className={`relative ${className}`}>
      <Button
        variant="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={handleToggleDropdown}
        className="flex items-center"
      >
        {label}
        <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Overlay to capture clicks outside the dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
            {options.map((option) => (
              <button
                key={option.id}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={() => handleOptionClick(option.onClick)}
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}