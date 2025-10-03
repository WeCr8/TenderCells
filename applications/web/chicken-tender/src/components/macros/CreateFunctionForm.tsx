import React, { useState } from 'react';
import { Plus, Minus, Save, X } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import type { MacroFunction, MacroParameter, MacroType } from '../../types/macros';

interface CreateFunctionFormProps {
  onSubmit: (macro: Omit<MacroFunction, 'id' | 'execute' | 'validate'>) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export default function CreateFunctionForm({
  onSubmit,
  onCancel,
  className = ''
}: CreateFunctionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MacroType>('task');
  const [category, setCategory] = useState('Custom');
  const [icon, setIcon] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [parameters, setParameters] = useState<Omit<MacroParameter, 'id'>[]>([]);
  const [isRepeatable, setIsRepeatable] = useState(true);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        description: '',
        type: 'string',
        required: false
      }
    ]);
  };

  const handleUpdateParameter = (index: number, field: keyof Omit<MacroParameter, 'id'>, value: any) => {
    const updatedParameters = [...parameters];
    updatedParameters[index] = {
      ...updatedParameters[index],
      [field]: value
    };
    setParameters(updatedParameters);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!type) {
      newErrors.type = 'Type is required';
    }
    
    if (!category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    // Validate parameters
    parameters.forEach((param, index) => {
      if (!param.name.trim()) {
        newErrors[`param_${index}_name`] = 'Parameter name is required';
      }
      
      if (param.type === 'select' || param.type === 'multiselect') {
        if (!param.options || param.options.length === 0) {
          newErrors[`param_${index}_options`] = 'Options are required for select parameters';
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
      // Create parameter objects with IDs
      const parametersWithIds: MacroParameter[] = parameters.map((param, index) => ({
        ...param,
        id: `param_${index}`
      }));
      
      // Create the macro object
      const newMacro: Omit<MacroFunction, 'id' | 'execute' | 'validate'> = {
        name,
        description,
        type,
        icon: icon || undefined,
        parameters: parametersWithIds,
        isRepeatable,
        requiresConfirmation,
        category,
        tags
      };
      
      await onSubmit(newMacro);
    } catch (error) {
      console.error('Error creating function:', error);
      setErrors({
        _form: error instanceof Error ? error.message : 'An error occurred while creating the function'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Create Custom Function</h2>
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="w-5 h-5" />}
          onClick={onCancel}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Function Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Function Type *
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as MacroType)}
                  className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                    errors.type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="record">Record</option>
                  <option value="task">Task</option>
                  <option value="configuration">Configuration</option>
                  <option value="flock">Flock</option>
                  <option value="chicken">Chicken</option>
                  <option value="feeding">Feeding</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-xs text-red-600">{errors.type}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.category && (
                  <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                Icon (emoji)
              </label>
              <input
                type="text"
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📝"
                className="block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter an emoji to use as the function icon
              </p>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="block w-full rounded-l-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md hover:bg-gray-100"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  id="repeatable"
                  type="checkbox"
                  checked={isRepeatable}
                  onChange={(e) => setIsRepeatable(e.target.checked)}
                  className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                />
                <label htmlFor="repeatable" className="ml-2 block text-sm text-gray-900">
                  Repeatable
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="confirmation"
                  type="checkbox"
                  checked={requiresConfirmation}
                  onChange={(e) => setRequiresConfirmation(e.target.checked)}
                  className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                />
                <label htmlFor="confirmation" className="ml-2 block text-sm text-gray-900">
                  Requires Confirmation
                </label>
              </div>
            </div>
          </div>
          
          {/* Parameters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Parameters</h3>
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleAddParameter}
              >
                Add Parameter
              </Button>
            </div>
            
            {parameters.length === 0 ? (
              <div className="text-center py-6 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                <p>No parameters defined</p>
                <p className="text-sm">Add parameters to make your function configurable</p>
              </div>
            ) : (
              <div className="space-y-6">
                {parameters.map((param, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Parameter {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Minus className="w-4 h-4" />}
                        onClick={() => handleRemoveParameter(index)}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                          className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                            errors[`param_${index}_name`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`param_${index}_name`] && (
                          <p className="mt-1 text-xs text-red-600">{errors[`param_${index}_name`]}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={param.description}
                          onChange={(e) => handleUpdateParameter(index, 'description', e.target.value)}
                          className="block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type *
                          </label>
                          <select
                            value={param.type}
                            onChange={(e) => handleUpdateParameter(index, 'type', e.target.value)}
                            className="block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
                          >
                            <option value="string">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Yes/No</option>
                            <option value="date">Date</option>
                            <option value="select">Select</option>
                            <option value="multiselect">Multi-select</option>
                            <option value="entity">Entity</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`required_${index}`}
                            checked={param.required}
                            onChange={(e) => handleUpdateParameter(index, 'required', e.target.checked)}
                            className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                          />
                          <label htmlFor={`required_${index}`} className="ml-2 block text-sm text-gray-900">
                            Required
                          </label>
                        </div>
                      </div>
                      
                      {(param.type === 'select' || param.type === 'multiselect') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Options *
                          </label>
                          <textarea
                            value={param.options?.map(opt => `${opt.label}:${opt.value}`).join('\n') || ''}
                            onChange={(e) => {
                              const optionsText = e.target.value;
                              const options = optionsText.split('\n')
                                .filter(line => line.trim())
                                .map(line => {
                                  const [label, value] = line.split(':');
                                  return { 
                                    label: label?.trim() || '', 
                                    value: value?.trim() || label?.trim() || '' 
                                  };
                                });
                              handleUpdateParameter(index, 'options', options);
                            }}
                            rows={4}
                            placeholder="Label:value (one per line)"
                            className={`block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm ${
                              errors[`param_${index}_options`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors[`param_${index}_options`] && (
                            <p className="mt-1 text-xs text-red-600">{errors[`param_${index}_options`]}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Enter one option per line in the format "Label:value"
                          </p>
                        </div>
                      )}
                      
                      {param.type === 'entity' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Entity Type
                          </label>
                          <select
                            value={param.validation?.entityType || ''}
                            onChange={(e) => handleUpdateParameter(index, 'validation', { 
                              ...param.validation,
                              entityType: e.target.value 
                            })}
                            className="block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
                          >
                            <option value="">Select Entity Type</option>
                            <option value="chicken">Chicken</option>
                            <option value="group">Flock Group</option>
                            <option value="device">Device</option>
                            <option value="user">User</option>
                          </select>
                        </div>
                      )}
                      
                      {param.type === 'number' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Min Value
                            </label>
                            <input
                              type="number"
                              value={param.validation?.min || ''}
                              onChange={(e) => handleUpdateParameter(index, 'validation', { 
                                ...param.validation,
                                min: e.target.value ? Number(e.target.value) : undefined 
                              })}
                              className="block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Max Value
                            </label>
                            <input
                              type="number"
                              value={param.validation?.max || ''}
                              onChange={(e) => handleUpdateParameter(index, 'validation', { 
                                ...param.validation,
                                max: e.target.value ? Number(e.target.value) : undefined 
                              })}
                              className="block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Value
                        </label>
                        {param.type === 'boolean' ? (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`default_${index}`}
                              checked={!!param.defaultValue}
                              onChange={(e) => handleUpdateParameter(index, 'defaultValue', e.target.checked)}
                              className="rounded border-gray-300 text-farm-600 focus:ring-farm-500"
                            />
                            <label htmlFor={`default_${index}`} className="ml-2 block text-sm text-gray-900">
                              Default to checked
                            </label>
                          </div>
                        ) : param.type === 'select' ? (
                          <select
                            value={param.defaultValue || ''}
                            onChange={(e) => handleUpdateParameter(index, 'defaultValue', e.target.value)}
                            className="block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
                          >
                            <option value="">No default</option>
                            {param.options?.map((option, i) => (
                              <option key={i} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={param.type === 'number' ? 'number' : 'text'}
                            value={param.defaultValue || ''}
                            onChange={(e) => handleUpdateParameter(
                              index, 
                              'defaultValue', 
                              param.type === 'number' ? Number(e.target.value) : e.target.value
                            )}
                            className="block w-full rounded-md shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm border-gray-300"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Form Error */}
          {errors._form && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{errors._form}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
          <Button
            variant="primary"
            type="submit"
            icon={<Save className="w-4 h-4" />}
            loading={isSubmitting}
          >
            Create Function
          </Button>
        </div>
      </form>
    </div>
  );
}