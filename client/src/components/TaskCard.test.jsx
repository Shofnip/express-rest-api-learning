import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskCard from './TaskCard';

function makeTask(overrides = {}) {
  return {
    id: 42,
    title: 'Escrever testes',
    description: 'Cobrir os componentes principais',
    isCompleted: false,
    dueDate: null,
    priority: 'high',
    tags: ['frontend', 'testes'],
    estimatedHours: null,
    createdAt: '2026-07-01T10:00:00Z',
    ...overrides,
  };
}

describe('TaskCard', () => {
  test('renderiza título, descrição, prioridade, tags e id', () => {
    render(<TaskCard task={makeTask()} onToggle={() => {}} onEdit={() => {}} />);

    expect(screen.getByText('Escrever testes')).toBeInTheDocument();
    expect(screen.getByText('Cobrir os componentes principais')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('testes')).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  test('clicar no checkbox chama onToggle com a tarefa inteira', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const task = makeTask();
    render(<TaskCard task={task} onToggle={onToggle} onEdit={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Marcar como concluída' }));

    expect(onToggle).toHaveBeenCalledWith(task);
  });

  test('clicar no lápis de edição chama onEdit com a tarefa inteira', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const task = makeTask();
    render(<TaskCard task={task} onToggle={() => {}} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: `Editar tarefa ${task.title}` }));

    expect(onEdit).toHaveBeenCalledWith(task);
  });

  test('tarefa concluída aplica riscado no título e reduz opacidade do card', () => {
    const { container } = render(<TaskCard task={makeTask({ isCompleted: true })} onToggle={() => {}} onEdit={() => {}} />);

    const title = screen.getByText('Escrever testes');
    expect(title).toHaveStyle({ textDecoration: 'line-through' });

    const card = container.firstChild;
    expect(card).toHaveStyle({ opacity: 0.85 });
  });

  test('tarefa sem data de vencimento mostra "Sem prazo"', () => {
    render(<TaskCard task={makeTask({ dueDate: null })} onToggle={() => {}} onEdit={() => {}} />);
    expect(screen.getByText('Sem prazo')).toBeInTheDocument();
  });

  describe('datas de vencimento relativas a "agora"', () => {
    const NOW = new Date('2026-07-17T12:00:00Z');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('tarefa atrasada mostra texto de atraso com ícone de alerta', () => {
      render(<TaskCard task={makeTask({ dueDate: '2026-07-10T23:59:00Z' })} onToggle={() => {}} onEdit={() => {}} />);
      expect(screen.getByText(/⚠.*atrasada há \d+ d/)).toBeInTheDocument();
    });

    test('tarefa que vence hoje mostra "vence hoje"', () => {
      render(<TaskCard task={makeTask({ dueDate: '2026-07-17T12:00:00Z' })} onToggle={() => {}} onEdit={() => {}} />);
      expect(screen.getByText(/vence hoje/)).toBeInTheDocument();
    });
  });
});
