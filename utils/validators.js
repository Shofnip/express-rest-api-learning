const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;

const validateTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'O título é obrigatório' };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return { isValid: false, error: `O título não pode exceder ${MAX_TITLE_LENGTH} caracteres` };
  }

  return { isValid: true };
};

const validateDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return { isValid: true };
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { isValid: false, error: `A descrição não pode exceder ${MAX_DESCRIPTION_LENGTH} caracteres` };
  }

  return { isValid: true };
};

const validateCreateTask = (body) => {
  const titleValidation = validateTitle(body.title);
  if (!titleValidation.isValid) {
    return titleValidation;
  }

  if (body.description) {
    const descriptionValidation = validateDescription(body.description);
    if (!descriptionValidation.isValid) {
      return descriptionValidation;
    }
  }

  if (body.priority !== undefined && body.priority !== null) {
    const priorityValidation = validatePriority(body.priority);
    if (!priorityValidation.isValid) {
      return priorityValidation;
    }
  }

  return { isValid: true };
};

const validateUpdateTask = (body) => {
  if (body.title !== undefined) {
    const titleValidation = validateTitle(body.title);
    if (!titleValidation.isValid) {
      return titleValidation;
    }
  }

  if (body.description !== undefined) {
    const descriptionValidation = validateDescription(body.description);
    if (!descriptionValidation.isValid) {
      return descriptionValidation;
    }
  }

  if (body.priority !== undefined && body.priority !== null) {
    const priorityValidation = validatePriority(body.priority);
    if (!priorityValidation.isValid) {
      return priorityValidation;
    }
  }

  return { isValid: true };
};

const validateDueDate = (dueDate) => {
  if (!dueDate || dueDate.trim().length === 0) {
    return { isValid: false, error: 'A data de vencimento é obrigatória' };
  }

  const date = new Date(dueDate);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Data de vencimento inválida. Use formato ISO 8601 (ex: 2026-07-15T10:00:00Z)' };
  }

  return { isValid: true };
};

const VALID_PRIORITIES = ['low', 'medium', 'high'];

const validatePriority = (priority) => {
  if (!VALID_PRIORITIES.includes(priority)) {
    return { isValid: false, error: 'Prioridade inválida. Use "low", "medium" ou "high".' };
  }

  return { isValid: true };
};

const VALID_STATUSES = ['completed', 'pending'];

const validateStatus = (status) => {
  if (!VALID_STATUSES.includes(status)) {
    return { isValid: false, error: 'Status inválido. Use "completed" ou "pending".' };
  }

  return { isValid: true };
};

const validateCountStatus = (status) => {
  if (status === undefined) {
    return { isValid: true };
  }

  return validateStatus(status);
};

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateDueDate,
  validateStatus,
  validateCountStatus
};
