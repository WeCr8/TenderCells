import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button/Button';

interface AddEntityModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  fields: {
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
    defaultValue?: any;
    min?: number;
    max?: number;
  }[];
  submitLabel?: string;
  className?: string;
}

export default function AddEntityModal({
  title,
  description,
  isOpen,
  onClose,
  onSubmit,
  fields,
  submitLabel = 'Save',
  className = ''
}: AddEntityModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data with default values
  React.useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialData[field.id] = field.defaultValue;
      } else if (field.type === 'checkbox') {
        initialData[field.id] = false;
      }
    });
    setFormData(initialData);
  }, [fields, isOpen]);

  const handleChange = (id: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));

    // Clear error for this field
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && (formData[field.id] === undefined || formData[field.id] === '')) {
        newErrors[field.id] = `${field.label} is required`;
      }
      
      if (field.type === 'number' && formData[field.id] !== undefined) {
        const value = Number(formData[field.id]);
        if (field.min !== undefined && value < field.min) {
          newErrors[field.id] = `${field.label} must be at least ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          newErrors[field.id] = `${field.label} must be at most ${field.max}`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({
        ...prev,
        _form: error instanceof Error ? error.message : 'An error occurred'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-4">
      {/* Full-screen on mobile, centered modal on tablet/desktop - matching unified_ui.py pattern */}
      <div className={`bg-white rounded-xl shadow-lg max-w-md w-full md:max-w-md md:rounded-xl md:shadow-lg ${
        className
      } ${
        // Mobile: full-screen with rounded top corners only
        'fixed inset-x-0 bottom-0 top-auto rounded-t-xl md:relative md:inset-auto md:rounded-xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="w-5 h-5" />}
            onClick={onClose}
          />
        </div>

        {/* Form - Responsive padding matching unified_ui.py breakpoints */}
        {/* Mobile: 16px padding, Tablet/Desktop: 24px padding */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          <div className="space-y-4">
            {/* Global form error */}
            {errors._form && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-sm text-red-600">{errors._form}</p>
              </div>
            )}

            {/* Form Fields */}
            {fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                  {field.label}{field.required ? ' *' : ''}
                </label>
                
                {field.type === 'text' && (
                  <input
                    type="text"
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                      errors[field.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                )}
                
                {field.type === 'number' && (
                  <input
                    type="number"
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                    className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                      errors[field.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                )}
                
                {field.type === 'select' && (
                  <select
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                      errors[field.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {field.type === 'date' && (
                  <input
                    type="date"
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                      errors[field.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                )}
                
                {field.type === 'textarea' && (
                  <textarea
                    id={field.id}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                      errors[field.id] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                )}
                
                {field.type === 'checkbox' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={field.id}
                      checked={!!formData[field.id]}
                      onChange={(e) => handleChange(field.id, e.target.checked)}
                      className={`rounded border-gray-300 text-farm-600 focus:ring-farm-500 ${
                        errors[field.id] ? 'border-red-300' : ''
                      }`}
                    />
                    <label htmlFor={field.id} className="ml-2 block text-sm text-gray-900">
                      {field.placeholder || field.label}
                    </label>
                  </div>
                )}
                
                {errors[field.id] && (
                  <p className="mt-1 text-xs text-red-600">{errors[field.id]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions - Responsive button sizes matching unified_ui.py */}
          {/* Mobile: 48px min height, Desktop: 40px min height */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] md:min-h-[40px]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
              className="min-h-[44px] md:min-h-[40px] min-w-[88px] md:min-w-[64px]"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}