const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

const validateTitle = (title) => {
  if (typeof title !== 'string' || title.trim().length === 0) {
    return { isValid: false, error: 'O título é obrigatório' };
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    return { isValid: false, error: `O título não pode exceder ${MAX_TITLE_LENGTH} caracteres` };
  }

  return { isValid: true };
};

const validateDescription = (description) => {
  if (description === undefined || description === null || description === '') {
    return { isValid: true };
  }

  if (typeof description !== 'string') {
    return { isValid: false, error: 'A descrição deve ser um texto' };
  }

  if (description.trim().length === 0) {
    return { isValid: true };
  }

  if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    return { isValid: false, error: `A descrição não pode exceder ${MAX_DESCRIPTION_LENGTH} caracteres` };
  }

  return { isValid: true };
};

const validateIsCompleted = (isCompleted) => {
  if (typeof isCompleted !== 'boolean') {
    return { isValid: false, error: 'isCompleted deve ser um valor booleano (true ou false).' };
  }

  return { isValid: true };
};

const validateCreateTask = (body) => {
  const titleValidation = validateTitle(body.title);
  if (!titleValidation.isValid) {
    return titleValidation;
  }

  if (body.description !== undefined && body.description !== null) {
    const descriptionValidation = validateDescription(body.description);
    if (!descriptionValidation.isValid) {
      return descriptionValidation;
    }
  }

  if (body.isCompleted !== undefined && body.isCompleted !== null) {
    const isCompletedValidation = validateIsCompleted(body.isCompleted);
    if (!isCompletedValidation.isValid) {
      return isCompletedValidation;
    }
  }

  if (body.priority !== undefined && body.priority !== null) {
    const priorityValidation = validatePriority(body.priority);
    if (!priorityValidation.isValid) {
      return priorityValidation;
    }
  }

  if (body.tags !== undefined && body.tags !== null) {
    const tagsValidation = validateTags(body.tags);
    if (!tagsValidation.isValid) {
      return tagsValidation;
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

  if (body.isCompleted !== undefined && body.isCompleted !== null) {
    const isCompletedValidation = validateIsCompleted(body.isCompleted);
    if (!isCompletedValidation.isValid) {
      return isCompletedValidation;
    }
  }

  if (body.priority !== undefined && body.priority !== null) {
    const priorityValidation = validatePriority(body.priority);
    if (!priorityValidation.isValid) {
      return priorityValidation;
    }
  }

  if (body.tags !== undefined && body.tags !== null) {
    const tagsValidation = validateTags(body.tags);
    if (!tagsValidation.isValid) {
      return tagsValidation;
    }
  }

  return { isValid: true };
};

const validateDueDate = (dueDate) => {
  const isEmpty = dueDate === undefined || dueDate === null
    || (typeof dueDate === 'string' && dueDate.trim().length === 0);

  if (isEmpty) {
    return { isValid: false, error: 'A data de vencimento é obrigatória' };
  }

  const hasValidFormat = typeof dueDate === 'string' && ISO_8601_REGEX.test(dueDate.trim());
  if (!hasValidFormat || isNaN(new Date(dueDate).getTime())) {
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

const validateTags = (tags) => {
  if (!Array.isArray(tags)) {
    return { isValid: false, error: 'As tags devem ser um array de strings.' };
  }

  if (tags.length > MAX_TAGS) {
    return { isValid: false, error: `Máximo ${MAX_TAGS} tags permitidas.` };
  }

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return { isValid: false, error: 'Cada tag deve ser uma string.' };
    }

    if (tag.trim().length === 0) {
      return { isValid: false, error: 'Tags não podem ser vazias.' };
    }

    if (tag.length > MAX_TAG_LENGTH) {
      return { isValid: false, error: `Cada tag não pode exceder ${MAX_TAG_LENGTH} caracteres.` };
    }
  }

  return { isValid: true };
};

const ID_REGEX = /^\d+$/;

const validateId = (id) => {
  if (typeof id !== 'string' || !ID_REGEX.test(id)) {
    return { isValid: false, error: 'ID inválido. Use um número inteiro.' };
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
  validateCountStatus,
  validatePriority,
  validateTags,
  validateTitle,
  validateId,
  validateIsCompleted
};
