// Validation Utilities - Form and data validation
export const validators = {
  // Basic validators
  required: (value) => {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  phone: (value) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
  },

  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  minLength: (min) => (value) => {
    return String(value).length >= min;
  },

  maxLength: (max) => (value) => {
    return String(value).length <= max;
  },

  pattern: (regex) => (value) => {
    return regex.test(value);
  },

  numeric: (value) => {
    return !isNaN(value) && !isNaN(parseFloat(value));
  },

  integer: (value) => {
    return Number.isInteger(Number(value));
  },

  positive: (value) => {
    return Number(value) > 0;
  },

  range: (min, max) => (value) => {
    const num = Number(value);
    return num >= min && num <= max;
  },

  // Agricultural specific validators
  zipCode: (value) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(value);
  },

  animalTag: (value) => {
    // Basic animal tag format validation
    const tagRegex = /^[A-Z0-9]{3,10}$/;
    return tagRegex.test(value.toUpperCase());
  },

  coordinates: (value) => {
    const coordRegex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    return coordRegex.test(value);
  },

  temperature: (value) => {
    const temp = Number(value);
    return temp >= -50 && temp <= 150; // Reasonable temperature range in Fahrenheit
  },

  weight: (value) => {
    const weight = Number(value);
    return weight > 0 && weight <= 5000; // Reasonable weight range in pounds
  }
};

export const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
  minLength: (min) => `Minimum ${min} characters required`,
  maxLength: (max) => `Maximum ${max} characters allowed`,
  numeric: 'Please enter a valid number',
  integer: 'Please enter a whole number',
  positive: 'Please enter a positive number',
  range: (min, max) => `Value must be between ${min} and ${max}`,
  zipCode: 'Please enter a valid ZIP code',
  animalTag: 'Please enter a valid animal tag (3-10 alphanumeric characters)',
  coordinates: 'Please enter coordinates in format: latitude,longitude',
  temperature: 'Temperature must be between -50°F and 150°F',
  weight: 'Weight must be between 0 and 5000 pounds'
};

// Validation rule builder
export function createValidationRule(validatorName, ...args) {
  const validator = validators[validatorName];
  if (!validator) {
    throw new Error(`Validator '${validatorName}' not found`);
  }

  // Handle validators that return functions (like minLength, range)
  const validatorFunction = typeof validator === 'function' && args.length > 0 
    ? validator(...args) 
    : validator;

  return {
    validator: validatorFunction,
    message: typeof validationMessages[validatorName] === 'function' 
      ? validationMessages[validatorName](...args)
      : validationMessages[validatorName]
  };
}

// Form validation function
export function validateField(value, rules) {
  for (const rule of rules) {
    if (!rule.validator(value)) {
      return {
        isValid: false,
        message: rule.message
      };
    }
  }
  
  return { isValid: true };
}

// Validate entire form
export function validateFormData(data, schema) {
  const errors = {};
  let isValid = true;

  Object.entries(schema).forEach(([fieldName, rules]) => {
    const value = data[fieldName];
    const result = validateField(value, rules);
    
    if (!result.isValid) {
      errors[fieldName] = result.message;
      isValid = false;
    }
  });

  return { isValid, errors };
}

// Real-time validation setup
export function setupRealTimeValidation(formId, schema) {
  const form = document.getElementById(formId);
  if (!form) return;

  Object.keys(schema).forEach(fieldName => {
    const field = document.getElementById(fieldName);
    if (!field) return;

    field.addEventListener('blur', () => {
      const value = field.value;
      const rules = schema[fieldName];
      const result = validateField(value, rules);
      
      // Clear previous errors
      const existingError = field.parentNode.querySelector('.field-error');
      if (existingError) {
        existingError.remove();
      }
      field.classList.remove('error', 'valid');

      if (!result.isValid) {
        field.classList.add('error');
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.textContent = result.message;
        field.parentNode.appendChild(errorEl);
      } else if (value) {
        field.classList.add('valid');
      }
    });
  });
}

// Common validation schemas
export const commonSchemas = {
  contact: {
    firstName: [
      createValidationRule('required'),
      createValidationRule('minLength', 2)
    ],
    lastName: [
      createValidationRule('required'),
      createValidationRule('minLength', 2)
    ],
    email: [
      createValidationRule('required'),
      createValidationRule('email')
    ],
    phone: [
      createValidationRule('phone')
    ]
  },

  address: {
    address: [createValidationRule('required')],
    city: [createValidationRule('required')],
    state: [createValidationRule('required')],
    zipCode: [
      createValidationRule('required'),
      createValidationRule('zipCode')
    ]
  },

  animalProfile: {
    name: [createValidationRule('required')],
    breed: [createValidationRule('required')],
    birthDate: [createValidationRule('required')],
    weight: [
      createValidationRule('required'),
      createValidationRule('weight')
    ],
    tagNumber: [
      createValidationRule('required'),
      createValidationRule('animalTag')
    ]
  }
};