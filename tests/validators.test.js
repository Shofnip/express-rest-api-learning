const { validateTitle } = require('../utils/validators');

describe('validateTitle', () => {
  test('aceita um título válido dentro do limite', () => {
    const result = validateTitle('Estudar Express');

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita título vazio', () => {
    const result = validateTitle('');

    expect(result).toEqual({ isValid: false, error: 'O título é obrigatório' });
  });

  test('rejeita título contendo apenas espaços em branco', () => {
    const result = validateTitle('   ');

    expect(result).toEqual({ isValid: false, error: 'O título é obrigatório' });
  });

  test('aceita título com exatamente 255 caracteres (limite exato)', () => {
    const title = 'a'.repeat(255);

    const result = validateTitle(title);

    expect(result).toEqual({ isValid: true });
  });

  test('rejeita título com 256 caracteres (um a mais que o limite)', () => {
    const title = 'a'.repeat(256);

    const result = validateTitle(title);

    expect(result).toEqual({
      isValid: false,
      error: 'O título não pode exceder 255 caracteres'
    });
  });
});
