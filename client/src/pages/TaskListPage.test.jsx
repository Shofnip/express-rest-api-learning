import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskListPage from './TaskListPage';
import { getTasks, getTasksByStatus, getTasksByPriority, updateTask } from '../api/tasks';

vi.mock('../api/tasks', () => ({
  getTasks: vi.fn(),
  getTasksByStatus: vi.fn(),
  getTasksByPriority: vi.fn(),
  updateTask: vi.fn(),
}));

function makeTasks(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    title: `Tarefa ${i + 1}`,
    description: '',
    isCompleted: i % 2 === 0,
    dueDate: null,
    priority: i < 4 ? 'high' : null,
    tags: [],
    estimatedHours: null,
    createdAt: '2026-07-01T10:00:00Z',
  }));
}

function paginate(all, page, limit) {
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const data = all.slice((safePage - 1) * limit, safePage * limit);
  return { data, page: safePage, limit, total, totalPages };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TaskListPage - carregamento', () => {
  test('mostra skeletons enquanto os dados ainda não chegaram', () => {
    getTasks.mockReturnValue(new Promise(() => {}));
    getTasksByStatus.mockReturnValue(new Promise(() => {}));

    const { container } = render(<TaskListPage />);

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});

describe('TaskListPage - listagem', () => {
  test('mostra um card por tarefa retornada', async () => {
    const tasks = makeTasks(3);
    getTasks.mockImplementation(async ({ page, limit }) => paginate(tasks, page, limit));
    getTasksByStatus.mockResolvedValue([]);

    render(<TaskListPage />);

    expect(await screen.findByText('Tarefa 1')).toBeInTheDocument();
    expect(screen.getByText('Tarefa 2')).toBeInTheDocument();
    expect(screen.getByText('Tarefa 3')).toBeInTheDocument();
  });

  test('mostra mensagem de lista vazia quando não há tarefas', async () => {
    getTasks.mockImplementation(async ({ page, limit }) => paginate([], page, limit));
    getTasksByStatus.mockResolvedValue([]);

    render(<TaskListPage />);

    expect(await screen.findByText(/Nenhuma tarefa com esses filtros/)).toBeInTheDocument();
  });
});

describe('TaskListPage - filtros e paginação', () => {
  test('trocar o filtro de status reseta a página para 1', async () => {
    const user = userEvent.setup();
    const tasks = makeTasks(12);
    getTasks.mockImplementation(async ({ page, limit }) => paginate(tasks, page, limit));
    getTasksByStatus.mockImplementation(async (status) => {
      const pending = tasks.filter((t) => (status === 'completed' ? t.isCompleted : !t.isCompleted));
      return pending;
    });

    render(<TaskListPage />);
    await screen.findByText('Tarefa 1');
    expect(await screen.findByText(/página 1 de 3/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(await screen.findByText(/página 2 de 3/)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'pending');

    expect(await screen.findByText(/página 1 de/)).toBeInTheDocument();
    expect(getTasksByStatus).toHaveBeenCalledWith('pending');
  });

  test('trocar o filtro de prioridade reseta a página para 1', async () => {
    const user = userEvent.setup();
    const tasks = makeTasks(12);
    getTasks.mockImplementation(async ({ page, limit }) => paginate(tasks, page, limit));
    getTasksByStatus.mockResolvedValue([]);
    getTasksByPriority.mockImplementation(async (priority) => tasks.filter((t) => String(t.priority) === priority));

    render(<TaskListPage />);
    await screen.findByText('Tarefa 1');
    expect(await screen.findByText(/página 1 de 3/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2' }));
    expect(await screen.findByText(/página 2 de 3/)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Prioridade' }), 'high');

    expect(await screen.findByText(/página 1 de/)).toBeInTheDocument();
    expect(getTasksByPriority).toHaveBeenCalledWith('high');
  });
});

describe('TaskListPage - formulário', () => {
  test('clicar em "+ Nova tarefa" abre o formulário no modo criação', async () => {
    const user = userEvent.setup();
    const tasks = makeTasks(2);
    getTasks.mockImplementation(async ({ page, limit }) => paginate(tasks, page, limit));
    getTasksByStatus.mockResolvedValue([]);

    render(<TaskListPage />);
    await screen.findByText('Tarefa 1');

    await user.click(screen.getByRole('button', { name: /nova tarefa/i }));

    expect(screen.getByRole('heading', { name: 'Nova tarefa' })).toBeInTheDocument();
  });

  test('clicar no lápis de um card abre o formulário no modo edição para aquela tarefa', async () => {
    const user = userEvent.setup();
    const tasks = makeTasks(2);
    getTasks.mockImplementation(async ({ page, limit }) => paginate(tasks, page, limit));
    getTasksByStatus.mockResolvedValue([]);

    render(<TaskListPage />);
    await screen.findByText('Tarefa 2');

    await user.click(screen.getByRole('button', { name: 'Editar tarefa Tarefa 2' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Editar tarefa' })).toBeInTheDocument();
    expect(within(dialog).getByText('#2')).toBeInTheDocument();
  });
});
