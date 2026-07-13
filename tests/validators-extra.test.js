const {
  validateCreateTask,
  validateUpdateTask,
  validateDueDate,
  validateStatus,
  validateCountStatus,
  validatePriority,
  validateTags
} = require('../utils/validators');

describe('validateCreateTask', () => {
  test('aceita um body válido com todos os campos', () => {
    const result = validateCreateTask({
      title: 'Estudar Express',
      description: 'Aprender middleware',
      priority: 'high',
      tags: ['backend', 'node']
    });

    expect(result).toEqual({ isValid: true });
  });

  test('aceita um body contendo apenas o título obrigatório', () => {
    const result = validateCreateTask({ title: 'Título mínimo' });

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita título ausente', () => {
    const result = validateCreateTask({});

    expect(result).toEqual({ isValid: false, error: 'O título é obrigatório' });
  });

  test('rejeita título com 256 caracteres (um a mais que o limite)', () => {
    const result = validateCreateTask({ title: 'a'.repeat(256) });

    expect(result).toEqual({ isValid: false, error: 'O título não pode exceder 255 caracteres' });
  });

  test('aceita descrição com exatamente 2000 caracteres (limite exato)', () => {
    const result = validateCreateTask({ title: 'Título', description: 'a'.repeat(2000) });

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita descrição com 2001 caracteres (um a mais que o limite)', () => {
    const result = validateCreateTask({ title: 'Título', description: 'a'.repeat(2001) });

    expect(result).toEqual({
      isValid: false,
      error: 'A descrição não pode exceder 2000 caracteres'
    });
  });

  test('aceita descrição vazia', () => {
    const result = validateCreateTask({ title: 'Título', description: '' });

    expect(result).toEqual({ isValid: true });
  });

  test('aceita body sem priority (padrão null)', () => {
    const result = validateCreateTask({ title: 'Título', priority: null });

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita priority inválida', () => {
    const result = validateCreateTask({ title: 'Título', priority: 'urgent' });

    expect(result).toEqual({
      isValid: false,
      error: 'Prioridade inválida. Use "low", "medium" ou "high".'
    });
  });

  test('rejeita tags que não são um array', () => {
    const result = validateCreateTask({ title: 'Título', tags: 'backend' });

    expect(result).toEqual({ isValid: false, error: 'As tags devem ser um array de strings.' });
  });

  test('rejeita mais de 10 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);

    const result = validateCreateTask({ title: 'Título', tags });

    expect(result).toEqual({ isValid: false, error: 'Máximo 10 tags permitidas.' });
  });

  test('aceita exatamente 10 tags (limite exato)', () => {
    const tags = Array.from({ length: 10 }, (_, i) => `tag${i}`);

    const result = validateCreateTask({ title: 'Título', tags });

    expect(result).toEqual({ isValid: true });
  });
});

describe('validateUpdateTask', () => {
  test('aceita body vazio (nenhum campo para atualizar)', () => {
    const result = validateUpdateTask({});

    expect(result).toEqual({ isValid: true });
  });

  test('aceita atualização parcial apenas com isCompleted', () => {
    const result = validateUpdateTask({ isCompleted: true });

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita título vazio quando fornecido', () => {
    const result = validateUpdateTask({ title: '   ' });

    expect(result).toEqual({ isValid: false, error: 'O título é obrigatório' });
  });

  test('rejeita descrição maior que 2000 caracteres quando fornecida', () => {
    const result = validateUpdateTask({ description: 'a'.repeat(2001) });

    expect(result).toEqual({
      isValid: false,
      error: 'A descrição não pode exceder 2000 caracteres'
    });
  });

  test('rejeita priority inválida quando fornecida', () => {
    const result = validateUpdateTask({ priority: 'urgent' });

    expect(result).toEqual({
      isValid: false,
      error: 'Prioridade inválida. Use "low", "medium" ou "high".'
    });
  });

  test('aceita priority null (mantém sem prioridade)', () => {
    const result = validateUpdateTask({ priority: null });

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita tags inválidas quando fornecidas', () => {
    const result = validateUpdateTask({ tags: ['ok', 123] });

    expect(result).toEqual({ isValid: false, error: 'Cada tag deve ser uma string.' });
  });
});

describe('validatePriority', () => {
  test.each(['low', 'medium', 'high'])('aceita a prioridade válida "%s"', (priority) => {
    expect(validatePriority(priority)).toEqual({ isValid: true });
  });

  test('rejeita prioridade inválida', () => {
    const result = validatePriority('urgent');

    expect(result).toEqual({
      isValid: false,
      error: 'Prioridade inválida. Use "low", "medium" ou "high".'
    });
  });

  test('rejeita prioridade undefined', () => {
    const result = validatePriority(undefined);

    expect(result).toEqual({
      isValid: false,
      error: 'Prioridade inválida. Use "low", "medium" ou "high".'
    });
  });
});

describe('validateTags', () => {
  test('aceita array vazio', () => {
    expect(validateTags([])).toEqual({ isValid: true });
  });

  test('aceita tags com exatamente 50 caracteres (limite exato)', () => {
    const result = validateTags(['a'.repeat(50)]);

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita tag com 51 caracteres (um a mais que o limite)', () => {
    const result = validateTags(['a'.repeat(51)]);

    expect(result).toEqual({
      isValid: false,
      error: 'Cada tag não pode exceder 50 caracteres.'
    });
  });

  test('rejeita tag vazia (apenas espaços)', () => {
    const result = validateTags(['   ']);

    expect(result).toEqual({ isValid: false, error: 'Tags não podem ser vazias.' });
  });

  test('rejeita item que não é string', () => {
    const result = validateTags([42]);

    expect(result).toEqual({ isValid: false, error: 'Cada tag deve ser uma string.' });
  });

  test('rejeita valor que não é array', () => {
    const result = validateTags('backend');

    expect(result).toEqual({ isValid: false, error: 'As tags devem ser um array de strings.' });
  });
});

describe('validateStatus', () => {
  test.each(['completed', 'pending'])('aceita o status válido "%s"', (status) => {
    expect(validateStatus(status)).toEqual({ isValid: true });
  });

  test('rejeita status inválido', () => {
    const result = validateStatus('done');

    expect(result).toEqual({
      isValid: false,
      error: 'Status inválido. Use "completed" ou "pending".'
    });
  });

  test('rejeita status undefined', () => {
    const result = validateStatus(undefined);

    expect(result).toEqual({
      isValid: false,
      error: 'Status inválido. Use "completed" ou "pending".'
    });
  });
});

describe('validateCountStatus', () => {
  test('aceita status undefined (conta todas as tarefas)', () => {
    expect(validateCountStatus(undefined)).toEqual({ isValid: true });
  });

  test.each(['completed', 'pending'])('aceita o status válido "%s"', (status) => {
    expect(validateCountStatus(status)).toEqual({ isValid: true });
  });

  test('rejeita status inválido', () => {
    const result = validateCountStatus('done');

    expect(result).toEqual({
      isValid: false,
      error: 'Status inválido. Use "completed" ou "pending".'
    });
  });
});

describe('validateDueDate', () => {
  test('aceita uma data ISO 8601 válida', () => {
    const result = validateDueDate('2026-08-15T18:00:00Z');

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita data ausente', () => {
    const result = validateDueDate(undefined);

    expect(result).toEqual({ isValid: false, error: 'A data de vencimento é obrigatória' });
  });

  test('rejeita string vazia', () => {
    const result = validateDueDate('');

    expect(result).toEqual({ isValid: false, error: 'A data de vencimento é obrigatória' });
  });

  test('rejeita string contendo apenas espaços', () => {
    const result = validateDueDate('   ');

    expect(result).toEqual({ isValid: false, error: 'A data de vencimento é obrigatória' });
  });

  test('rejeita data em formato inválido', () => {
    const result = validateDueDate('não é uma data');

    expect(result).toEqual({
      isValid: false,
      error: 'Data de vencimento inválida. Use formato ISO 8601 (ex: 2026-07-15T10:00:00Z)'
    });
  });
});
