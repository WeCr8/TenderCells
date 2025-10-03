import React, { useState, useEffect } from 'react';
import { Play, AlertTriangle, X, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { MacroUtils } from '../../utils/macroUtils';
import type { MacroFunction, MacroValidationResult, MacroParameter } from '../../types/macros';

interface MacroExecuteFormProps {
  macro: MacroFunction;
  onExecute: (parameters: Record<string, any>) => Promise<void>;
  onSchedule?: (parameters: Record<string, any>, schedule: any) => Promise<void>;
  onCancel: () => void;
  validateParameters?: (parameters: Record<string, any>) => Promise<MacroValidationResult>;
  className?: string;
}

export default function MacroExecuteForm({
  macro,
  onExecute,
  onSchedule,
  onCancel,
  validateParameters,
  className = ''
}: MacroExecuteFormProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [schedule, setSchedule] = useState({
    type: 'once' as const,
    time: '',
    days: [] as string[],
    dates: [] as number[]
  });

  // Initialize parameters with default values
  useEffect(() => {
    const defaultParams: Record<string, any> = {};
    macro.parameters.forEach(param => {
      if (param.defaultValue !== undefined) {
        defaultParams[param.id] = param.defaultValue;
      }
    });
    setParameters(defaultParams);
  }, [macro]);

  const handleParameterChange = (paramId: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramId]: value
    }));

    // Clear error for this field
    if (errors[paramId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[paramId];
        return newErrors;
      });
    }
  };

  const handleScheduleChange = (field: string, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate parameters
      let validationResult: MacroValidationResult = { isValid: true, errors: [] };
      
      if (validateParameters) {
        validationResult = await validateParameters(parameters);
      } else if (macro.validate) {
        validationResult = await macro.validate(parameters);
      } else {
        validationResult = MacroUtils.validateMacroParameters(parameters, macro.parameters);
      }

      if (!validationResult.isValid) {
        const errorMap: Record<string, string> = {};
        validationResult.errors.forEach(error => {
          errorMap[error.field] = error.message;
        });
        setErrors(errorMap);
        return;
      }

      if (showScheduleOptions && onSchedule) {
        await onSchedule(parameters, schedule);
      } else {
        await onExecute(parameters);
      }
    } catch (error) {
      console.error('Error executing macro:', error);
      setErrors({
        _form: error instanceof Error ? error.message : 'An error occurred while executing the macro'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderParameterInput = (param: MacroParameter) => {
    const value = parameters[param.id];
    const error = errors[param.id];

    switch (param.type) {
      case 'string':
        return (
          <input
            type="text"
            id={param.id}
            value={value || ''}
            onChange={(e) => handleParameterChange(param.id, e.target.value)}
            placeholder={param.placeholder}
            className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={param.id}
            value={value !== undefined ? value : ''}
            onChange={(e) => handleParameterChange(param.id, e.target.value === '' ? '' : Number(e.target.value))}
            min={param.validation?.min}
            max={param.validation?.max}
            step="any"
            placeholder={param.placeholder}
            className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={param.id}
              checked={!!value}
              onChange={(e) => handleParameterChange(param.id, e.target.checked)}
              className={`rounded border-gray-300 text-farm-600 focus:ring-farm-500 ${
                error ? 'border-red-300' : ''
              }`}
            />
            <label htmlFor={param.id} className="ml-2 block text-sm text-gray-900">
              {param.description}
            </label>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            id={param.id}
            value={value || ''}
            onChange={(e) => handleParameterChange(param.id, e.target.value)}
            className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        );

      case 'select':
        return (
          <select
            id={param.id}
            value={value || ''}
            onChange={(e) => handleParameterChange(param.id, e.target.value)}
            className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select {param.name}</option>
            {param.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <select
            id={param.id}
            multiple
            value={value || []}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              handleParameterChange(param.id, selectedOptions);
            }}
            className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            size={Math.min(param.options?.length || 3, 5)}
          >
            {param.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'entity':
        // This would typically be a custom entity selector component
        // For now, we'll use a simple text input
        return (
          <input
            type="text"
            id={param.id}
            value={value || ''}
            onChange={(e) => handleParameterChange(param.id, e.target.value)}
            placeholder={`Select ${param.validation?.entityType || 'entity'}`}
            className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        );

      default:
        return (
          <input
            type="text"
            id={param.id}
            value={value || ''}
            onChange={(e) => handleParameterChange(param.id, e.target.value)}
            placeholder={param.placeholder}
            className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        );
    }
  };

  const renderScheduleOptions = () => {
    if (!showScheduleOptions) return null;

    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Options</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Type
            </label>
            <select
              value={schedule.type}
              onChange={(e) => handleScheduleChange('type', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
            >
              <option value="once">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {schedule.type !== 'once' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={schedule.time}
                onChange={(e) => handleScheduleChange('time', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
              />
            </div>
          )}

          {schedule.type === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <label key={day} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={schedule.days.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleScheduleChange('days', [...schedule.days, day]);
                        } else {
                          handleScheduleChange('days', schedule.days.filter(d => d !== day));
                        }
                      }}
                      className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {schedule.type === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days of Month
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 5, 10, 15, 20, 25, 30].map((date) => (
                  <label key={date} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={schedule.dates.includes(date)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleScheduleChange('dates', [...schedule.dates, date]);
                        } else {
                          handleScheduleChange('dates', schedule.dates.filter(d => d !== date));
                        }
                      }}
                      className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">{date}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {schedule.type === 'once' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date and Time
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
                />
                <input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => handleScheduleChange('time', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const typeColors = MacroUtils.getMacroTypeColor(macro.type);

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${typeColors.bg}`}>
            {macro.icon ? (
              <span className="text-xl">{macro.icon}</span>
            ) : (
              <Play className={`w-5 h-5 ${typeColors.text}`} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{macro.name}</h2>
            <p className="text-sm text-gray-600">{macro.category}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="w-5 h-5" />}
          onClick={onCancel}
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">{macro.description}</p>

          {/* Global form error */}
          {errors._form && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{errors._form}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parameters */}
          {macro.parameters.map((param) => (
            <div key={param.id} className="space-y-1">
              <label htmlFor={param.id} className="block text-sm font-medium text-gray-700">
                {param.name}{param.required ? ' *' : ''}
              </label>
              <div className="mt-1">
                {renderParameterInput(param)}
              </div>
              {param.description && (
                <p className="mt-1 text-xs text-gray-500">{param.description}</p>
              )}
              {errors[param.id] && (
                <p className="mt-1 text-xs text-red-600">{errors[param.id]}</p>
              )}
            </div>
          ))}

          {/* Schedule options toggle */}
          {onSchedule && (
            <div className="mt-4 flex items-center">
              <input
                id="schedule-toggle"
                type="checkbox"
                checked={showScheduleOptions}
                onChange={(e) => setShowScheduleOptions(e.target.checked)}
                className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
              />
              <label htmlFor="schedule-toggle" className="ml-2 block text-sm text-gray-900">
                Schedule for later
              </label>
            </div>
          )}

          {/* Schedule options */}
          {renderScheduleOptions()}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {showScheduleOptions && onSchedule ? (
            <Button
              variant="primary"
              type="submit"
              icon={<Calendar className="w-4 h-4" />}
              loading={isSubmitting}
            >
              Schedule
            </Button>
          ) : (
            <Button
              variant="primary"
              type="submit"
              icon={<Play className="w-4 h-4" />}
              loading={isSubmitting}
            >
              Execute
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}