// Form Components - Reusable form elements
export function createFormField(config) {
  const {
    type = 'text',
    id,
    label,
    placeholder = '',
    required = false,
    value = '',
    options = [],
    rows = 3,
    className = ''
  } = config;

  const requiredAttr = required ? 'required' : '';
  const requiredMark = required ? ' *' : '';

  switch (type) {
    case 'select':
      return `
        <div class="form-group ${className}">
          <label for="${id}">${label}${requiredMark}</label>
          <select id="${id}" ${requiredAttr}>
            ${placeholder ? `<option value="">${placeholder}</option>` : ''}
            ${options.map(option => `
              <option value="${option.value}" ${option.value === value ? 'selected' : ''}>
                ${option.label}
              </option>
            `).join('')}
          </select>
        </div>
      `;

    case 'textarea':
      return `
        <div class="form-group ${className}">
          <label for="${id}">${label}${requiredMark}</label>
          <textarea id="${id}" rows="${rows}" placeholder="${placeholder}" ${requiredAttr}>${value}</textarea>
        </div>
      `;

    case 'checkbox':
      return `
        <div class="form-group checkbox-group ${className}">
          <label class="checkbox-label">
            <input type="checkbox" id="${id}" ${value ? 'checked' : ''} ${requiredAttr}>
            <span class="checkmark"></span>
            ${label}
          </label>
        </div>
      `;

    case 'radio':
      return `
        <div class="form-group radio-group ${className}">
          <fieldset>
            <legend>${label}${requiredMark}</legend>
            ${options.map(option => `
              <label class="radio-label">
                <input type="radio" name="${id}" value="${option.value}" ${option.value === value ? 'checked' : ''} ${requiredAttr}>
                <span class="radio-mark"></span>
                ${option.label}
              </label>
            `).join('')}
          </fieldset>
        </div>
      `;

    case 'file':
      return `
        <div class="form-group ${className}">
          <label for="${id}">${label}${requiredMark}</label>
          <input type="file" id="${id}" ${requiredAttr} ${config.multiple ? 'multiple' : ''} ${config.accept ? `accept="${config.accept}"` : ''}>
          ${config.note ? `<p class="file-note">${config.note}</p>` : ''}
        </div>
      `;

    default:
      return `
        <div class="form-group ${className}">
          <label for="${id}">${label}${requiredMark}</label>
          <input type="${type}" id="${id}" placeholder="${placeholder}" value="${value}" ${requiredAttr}>
        </div>
      `;
  }
}

export function createFormRow(fields) {
  return `
    <div class="form-row">
      ${fields.map(field => createFormField(field)).join('')}
    </div>
  `;
}

export function validateForm(formId, rules = {}) {
  const form = document.getElementById(formId);
  if (!form) return false;

  let isValid = true;
  const errors = [];

  // Clear previous errors
  form.querySelectorAll('.field-error').forEach(error => error.remove());

  // Validate each field
  Object.entries(rules).forEach(([fieldId, rule]) => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const value = field.value.trim();
    let fieldValid = true;
    let errorMessage = '';

    // Required validation
    if (rule.required && !value) {
      fieldValid = false;
      errorMessage = rule.requiredMessage || 'This field is required';
    }

    // Pattern validation
    if (fieldValid && rule.pattern && value && !rule.pattern.test(value)) {
      fieldValid = false;
      errorMessage = rule.patternMessage || 'Invalid format';
    }

    // Min length validation
    if (fieldValid && rule.minLength && value.length < rule.minLength) {
      fieldValid = false;
      errorMessage = rule.minLengthMessage || `Minimum ${rule.minLength} characters required`;
    }

    // Custom validation
    if (fieldValid && rule.custom && !rule.custom(value)) {
      fieldValid = false;
      errorMessage = rule.customMessage || 'Invalid value';
    }

    if (!fieldValid) {
      isValid = false;
      errors.push({ field: fieldId, message: errorMessage });
      
      // Add error styling and message
      field.classList.add('error');
      const errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      errorEl.textContent = errorMessage;
      field.parentNode.appendChild(errorEl);
    } else {
      field.classList.remove('error');
    }
  });

  return { isValid, errors };
}

export function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.querySelectorAll('.field-error').forEach(error => error.remove());
    form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
  }
}