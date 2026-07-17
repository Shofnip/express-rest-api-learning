import { validateTask, dueInfo } from './validation';

function baseValues(overrides = {}) {
  return {
    title: 'Título válido',
    description: '',
    tags: [],
    ...overrides,
  };
}

describe('validateTask', () => {
  test('exige título quando vazio', () => {
    const errors = validateTask(baseValues({ title: '' }));
    expect(errors.title).toBe('O título é obrigatório.');
  });

  test('exige título quando é só espaços em branco', () => {
    const errors = validateTask(baseValues({ title: '   ' }));
    expect(errors.title).toBe('O título é obrigatório.');
  });

  test('aceita título com exatamente 255 caracteres', () => {
    const errors = validateTask(baseValues({ title: 'a'.repeat(255) }));
    expect(errors.title).toBeUndefined();
  });

  test('rejeita título com 256 caracteres', () => {
    const errors = validateTask(baseValues({ title: 'a'.repeat(256) }));
    expect(errors.title).toBe('O título passou do limite de 255 caracteres (256 no momento).');
  });

  test('aceita descrição com exatamente 2000 caracteres', () => {
    const errors = validateTask(baseValues({ description: 'a'.repeat(2000) }));
    expect(errors.description).toBeUndefined();
  });

  test('rejeita descrição com 2001 caracteres', () => {
    const errors = validateTask(baseValues({ description: 'a'.repeat(2001) }));
    expect(errors.description).toBe('A descrição passou do limite de 2000 caracteres (2001 no momento).');
  });

  test('aceita até 10 tags', () => {
    const errors = validateTask(baseValues({ tags: Array.from({ length: 10 }, (_, i) => `tag${i}`) }));
    expect(errors.tags).toBeUndefined();
  });

  test('rejeita mais de 10 tags', () => {
    const errors = validateTask(baseValues({ tags: Array.from({ length: 11 }, (_, i) => `tag${i}`) }));
    expect(errors.tags).toBe('Máximo de 10 tags por tarefa.');
  });

  test('não retorna nenhum erro para valores válidos', () => {
    const errors = validateTask(baseValues());
    expect(errors).toEqual({});
  });
});

describe('dueInfo', () => {
  const NOW = new Date('2026-07-17T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('sem data de vencimento', () => {
    expect(dueInfo(null, false)).toEqual({ text: 'Sem prazo', tone: 'muted' });
  });

  test('tarefa concluída mostra apenas a data, sem urgência', () => {
    const result = dueInfo('2026-07-10T23:59:00Z', true);
    expect(result.tone).toBe('muted');
    expect(result.text).not.toMatch(/atrasada|vence hoje|em \d+ d/);
  });

  test('data no passado é tratada como atrasada', () => {
    const result = dueInfo('2026-07-10T23:59:00Z', false);
    expect(result.tone).toBe('danger');
    expect(result.text).toMatch(/atrasada há \d+ d/);
  });

  test('data igual a hoje mostra "vence hoje"', () => {
    const result = dueInfo('2026-07-17T12:00:00Z', false);
    expect(result.tone).toBe('warn');
    expect(result.text).toMatch(/vence hoje/);
  });

  test('data dentro de 7 dias mostra contagem regressiva', () => {
    const result = dueInfo('2026-07-20T23:59:00Z', false);
    expect(result.tone).toBe('warn');
    expect(result.text).toMatch(/em \d+ d/);
  });

  test('data com mais de 7 dias é tratada como normal', () => {
    const result = dueInfo('2026-08-01T23:59:00Z', false);
    expect(result.tone).toBe('normal');
    expect(result.text).not.toMatch(/atrasada|vence hoje|em \d+ d/);
  });
});
