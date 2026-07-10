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

  return { isValid: true };
};

module.exports = {
  validateCreateTask,
  validateUpdateTask
};
