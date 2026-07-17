// Validação client-side replicada de design/painel-tarefas.jsx (validateTask/dueInfo).
// Serve só de UX instantânea — .claude/rules/api-design.md continua a fonte de verdade,
// e o backend revalida tudo de forma independente.

import { LIMITS } from '../theme.js';

export function validateTask(values) {
  const errors = {};
  const title = values.title.trim();

  if (!title) {
    errors.title = 'O título é obrigatório.';
  } else if (title.length > LIMITS.title) {
    errors.title = `O título passou do limite de ${LIMITS.title} caracteres (${title.length} no momento).`;
  }

  if (values.description.trim().length > LIMITS.description) {
    errors.description = `A descrição passou do limite de ${LIMITS.description} caracteres (${values.description.trim().length} no momento).`;
  }

  if (values.tags.length > LIMITS.tags) {
    errors.tags = `Máximo de ${LIMITS.tags} tags por tarefa.`;
  }

  return errors;
}

export function dueInfo(dueDate, isCompleted) {
  if (!dueDate) return { text: 'Sem prazo', tone: 'muted' };

  const due = new Date(dueDate);
  const now = new Date();
  const days = Math.ceil((due - now) / 86400000);
  const fmt = due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  if (isCompleted) return { text: fmt, tone: 'muted' };
  if (days < 0) return { text: `${fmt} · atrasada há ${-days} d`, tone: 'danger' };
  if (days === 0) return { text: `${fmt} · vence hoje`, tone: 'warn' };
  if (days <= 7) return { text: `${fmt} · em ${days} d`, tone: 'warn' };
  return { text: fmt, tone: 'normal' };
}
