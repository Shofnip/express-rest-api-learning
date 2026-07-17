// Único ponto de contato com a API — nenhum componente chama fetch() diretamente
// (.claude/rules/frontend.md). Contrato completo em @API.md.

const BASE_URL = '/api/tasks';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error ?? 'Erro inesperado ao comunicar com a API');
  }

  return body;
}

export async function getTasks({ page = 1, limit = 10 } = {}) {
  return request(`?page=${page}&limit=${limit}`);
}

export async function getTaskById(id) {
  return request(`/${id}`);
}

export async function getTasksByStatus(status) {
  return request(`/status/${status}`);
}

export async function getTasksByPriority(priority) {
  return request(`/priority/${priority}`);
}

export async function countTasks(status) {
  return request(status ? `/count?status=${status}` : '/count');
}

export async function createTask(payload) {
  return request('', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateTask(id, payload) {
  return request(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function completeTask(id) {
  return request(`/${id}/complete`, { method: 'PATCH', body: JSON.stringify({}) });
}

export async function setTaskDueDate(id, dueDate) {
  return request(`/${id}/due-date`, { method: 'PATCH', body: JSON.stringify({ dueDate }) });
}

export async function deleteTask(id) {
  return request(`/${id}`, { method: 'DELETE' });
}
