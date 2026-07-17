import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from './TaskForm';
import { createTask, updateTask, setTaskDueDate } from '../api/tasks';

vi.mock('../api/tasks', () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  setTaskDueDate: vi.fn(),
}));

function makeTask(overrides = {}) {
  return {
    id: 9,
    title: 'Tarefa existente',
    description: 'Descrição existente',
    isCompleted: true,
    dueDate: '2026-08-01T23:59:00Z',
    priority: 'medium',
    tags: ['a', 'b'],
    estimatedHours: null,
    createdAt: '2026-07-01T10:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  createTask.mockResolvedValue({ id: 42 });
  updateTask.mockResolvedValue({ id: 9 });
  setTaskDueDate.mockResolvedValue({});
});

describe('TaskForm - modo criação', () => {
  test('exibe título "Nova tarefa" e não mostra campos de ID/Criada em', () => {
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    expect(screen.getByRole('heading', { name: 'Nova tarefa' })).toBeInTheDocument();
    expect(screen.queryByText('ID')).not.toBeInTheDocument();
    expect(screen.queryByText('Criada em')).not.toBeInTheDocument();
  });

  test('submete com payload padrão quando só o título é preenchido', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<TaskForm task={null} onClose={() => {}} onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/título/i), 'Nova tarefa de teste');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(createTask).toHaveBeenCalledWith({
      title: 'Nova tarefa de teste',
      description: '',
      priority: null,
      tags: [],
      isCompleted: false,
    });
    expect(setTaskDueDate).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  test('inclui prioridade no payload e define o prazo via setTaskDueDate após criar', async () => {
    const user = userEvent.setup();
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    await user.type(screen.getByLabelText(/título/i), 'Com prioridade e prazo');
    await user.selectOptions(screen.getByLabelText('Prioridade'), 'high');
    fireEvent.change(screen.getByLabelText('Vencimento'), { target: { value: '2026-08-15' } });
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'high' })
    );
    expect(createTask.mock.calls[0][0]).not.toHaveProperty('dueDate');
    await waitFor(() => expect(setTaskDueDate).toHaveBeenCalledWith(42, '2026-08-15T23:59:00Z'));
  });

  test('não submete e mostra erro quando o título está vazio', async () => {
    const user = userEvent.setup();
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('O título é obrigatório.');
    expect(createTask).not.toHaveBeenCalled();
  });

  test('erro de título some ao editar o campo depois de uma submissão inválida', async () => {
    const user = userEvent.setup();
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('O título é obrigatório.');

    await user.type(screen.getByLabelText(/título/i), 'X');
    expect(screen.queryByText('O título é obrigatório.')).not.toBeInTheDocument();
  });

  test('reabilita o botão de salvar e mostra erro quando a API rejeita', async () => {
    const user = userEvent.setup();
    createTask.mockRejectedValue(new Error('Falha ao criar tarefa'));
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    await user.type(screen.getByLabelText(/título/i), 'Vai falhar');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    const submitButton = screen.getByRole('button', { name: 'Criar tarefa' });
    expect(submitButton).not.toBeDisabled();
  });
});

describe('TaskForm - modo edição', () => {
  test('exibe título "Editar tarefa" e campos somente leitura de ID/Criada em', () => {
    const task = makeTask();
    render(<TaskForm task={task} onClose={() => {}} onSaved={() => {}} />);

    expect(screen.getByRole('heading', { name: 'Editar tarefa' })).toBeInTheDocument();
    expect(screen.getByText('#9')).toBeInTheDocument();
    expect(screen.getByText('Criada em')).toBeInTheDocument();
  });

  test('submete via updateTask preservando isCompleted da tarefa original', async () => {
    const user = userEvent.setup();
    const task = makeTask({ isCompleted: true });
    const onSaved = vi.fn();
    render(<TaskForm task={task} onClose={() => {}} onSaved={onSaved} />);

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(1));
    const [id, payload] = updateTask.mock.calls[0];
    expect(id).toBe(task.id);
    expect(payload.isCompleted).toBe(true);
    expect(payload).not.toHaveProperty('dueDate');
    await waitFor(() => expect(setTaskDueDate).toHaveBeenCalledWith(task.id, task.dueDate));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});

describe('TaskForm - tags', () => {
  test('Enter adiciona a tag sem submeter o formulário', async () => {
    const user = userEvent.setup();
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    await user.type(screen.getByLabelText('Tags'), 'urgente{Enter}');

    expect(screen.getByText('urgente')).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });

  test('rejeita tag duplicada com mensagem específica', async () => {
    const user = userEvent.setup();
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    const tagInput = screen.getByLabelText('Tags');
    await user.type(tagInput, 'urgente{Enter}');
    await user.type(tagInput, 'urgente{Enter}');

    expect(await screen.findByText('A tag "urgente" já foi adicionada.')).toBeInTheDocument();
    expect(screen.getAllByText('urgente')).toHaveLength(1);
  });

  test('rejeita tag com mais de 50 caracteres', async () => {
    const user = userEvent.setup();
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    const longTag = 'a'.repeat(51);
    await user.type(screen.getByLabelText('Tags'), `${longTag}{Enter}`);

    expect(await screen.findByText(`Cada tag tem no máximo 50 caracteres (51 no momento).`)).toBeInTheDocument();
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });

  test('rejeita a 11ª tag ao atingir o limite', async () => {
    const user = userEvent.setup();
    const task = makeTask({ tags: Array.from({ length: 10 }, (_, i) => `tag${i}`) });
    render(<TaskForm task={task} onClose={() => {}} onSaved={() => {}} />);

    expect(screen.getByText('10/10')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Tags'), 'tag10{Enter}');

    expect(await screen.findByText('Limite de 10 tags atingido. Remova uma para adicionar outra.')).toBeInTheDocument();
    expect(screen.getByText('10/10')).toBeInTheDocument();
    expect(screen.queryByText('tag10')).not.toBeInTheDocument();
  });

  test('botão × remove a tag', async () => {
    const user = userEvent.setup();
    render(<TaskForm task={null} onClose={() => {}} onSaved={() => {}} />);

    await user.type(screen.getByLabelText('Tags'), 'removivel{Enter}');
    expect(screen.getByText('removivel')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remover tag removivel' }));

    expect(screen.queryByText('removivel')).not.toBeInTheDocument();
  });
});
