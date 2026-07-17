// Tokens visuais de design/DESIGN.md §2.1 e §2.2 — fonte única de verdade das
// decisões de cor do protótipo (design/painel-tarefas.jsx). Usados via `style`
// inline nos componentes; classes Tailwind cuidam de layout/espaçamento.

export const T = {
  pageBg: '#ECEAE2',
  card: '#FAF8F1',
  border: '#DDD9CC',
  inputBorder: '#CBC6B7',
  ink: '#3E4146',
  text: '#6C6A61',
  muted: '#98948A',
  doneBg: '#F0F5EC',
  doneBorder: '#D9E3D2',
  overdueBg: '#F8F0EA',
  overdueBorder: '#EADACE',
  danger: '#A85A4B',
  warn: '#8A6A2F',
  check: '#6E9C87',
  readOnlyBg: '#EFECE2',
  accent: '#8A6A55',
  accentBorder: '#6B4A3A',
};

// Chave 'null' representa tarefas sem prioridade — estado de primeira classe,
// nunca um espaço vazio (design/DESIGN.md §2.2).
export const PRIORITY = {
  high: { label: 'Alta', rail: '#C96A5C', chipBg: '#F2DEDA', chipFg: '#84392E', chipBorder: '#C96A5C' },
  medium: { label: 'Média', rail: '#C99C4E', chipBg: '#F0E5CC', chipFg: '#6F521C', chipBorder: '#C99C4E' },
  low: { label: 'Baixa', rail: '#6E9C87', chipBg: '#E0EBE1', chipFg: '#39604E', chipBorder: '#6E9C87' },
  null: { label: 'Sem prioridade', rail: '#C2BDAE', chipBg: '#EAE7DC', chipFg: '#6C6A61', chipBorder: '#C2BDAE' },
};

// Espelha os limites de validação do backend (.claude/rules/api-design.md) para
// feedback instantâneo no formulário — a API continua sendo a fonte de verdade.
export const LIMITS = { title: 255, description: 2000, tag: 50, tags: 10 };
