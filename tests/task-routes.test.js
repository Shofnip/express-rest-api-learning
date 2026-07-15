jest.mock('../services/db', () => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      is_completed INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      priority TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      estimated_hours REAL,
      created_at TEXT NOT NULL
    )
  `);

  return db;
});

const request = require('supertest');
const app = require('../app');
const db = require('../services/db');

beforeEach(() => {
  db.exec('DELETE FROM tasks');
});

describe('POST /api/tasks', () => {
  test('cria uma tarefa com apenas o título e aplica os valores padrão', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Estudar Express',
      description: '',
      isCompleted: false,
      dueDate: null,
      priority: null,
      tags: []
    });
    expect(response.body.id).toEqual(expect.any(Number));
    expect(response.body.createdAt).toEqual(expect.any(String));
  });

  test('trima espaços em branco do título', async () => {
    const response = await request(app).post('/api/tasks').send({ title: '  Estudar Express  ' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Estudar Express');
  });

  test('cria uma tarefa com todos os campos opcionais preenchidos', async () => {
    const response = await request(app).post('/api/tasks').send({
      title: 'Estudar Express',
      description: 'Aprender middleware',
      isCompleted: true,
      priority: 'high',
      tags: ['backend', 'node']
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Estudar Express',
      description: 'Aprender middleware',
      isCompleted: true,
      priority: 'high',
      tags: ['backend', 'node']
    });
  });

  test('rejeita título ausente', async () => {
    const response = await request(app).post('/api/tasks').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'O título é obrigatório' });
  });

  test('rejeita título com mais de 255 caracteres', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 'a'.repeat(256) });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'O título não pode exceder 255 caracteres' });
  });

  test('rejeita descrição com mais de 2000 caracteres', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Título', description: 'a'.repeat(2001) });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'A descrição não pode exceder 2000 caracteres' });
  });

  test('rejeita prioridade inválida', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Título', priority: 'urgent' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Prioridade inválida. Use "low", "medium" ou "high".'
    });
  });

  test('rejeita tags que não são um array', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Título', tags: 'backend' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'As tags devem ser um array de strings.' });
  });

  test('rejeita mais de 10 tags', async () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);

    const response = await request(app).post('/api/tasks').send({ title: 'Título', tags });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Máximo 10 tags permitidas.' });
  });

  test('rejeita tag com mais de 50 caracteres', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Título', tags: ['a'.repeat(51)] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Cada tag não pode exceder 50 caracteres.' });
  });

  test('cria uma tarefa com estimatedHours e reflete o valor exato', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Título', estimatedHours: 4.5 });

    expect(response.status).toBe(201);
    expect(response.body.estimatedHours).toBe(4.5);
  });

  test('cria uma tarefa sem estimatedHours e aplica o padrão null', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 'Título' });

    expect(response.status).toBe(201);
    expect(response.body.estimatedHours).toBeNull();
  });

  test('rejeita estimatedHours negativo', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Título', estimatedHours: -2 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'estimatedHours não pode ser negativo.' });
  });

  test('rejeita estimatedHours que não é um número', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Título', estimatedHours: 'quatro' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'estimatedHours deve ser um número.' });
  });

  test('rejeita título numérico com 400 em vez de 500', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 123 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'O título é obrigatório' });
  });

  test('rejeita descrição numérica com 400 em vez de 500', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'ok', description: 123 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'A descrição deve ser um texto' });
  });

  test('rejeita isCompleted que não é booleano', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'ok', isCompleted: 'yes' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'isCompleted deve ser um valor booleano (true ou false).'
    });
  });

  test('rejeita descrição null com 400', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'x', description: null });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'A descrição deve ser um texto' });
  });

  test('rejeita tags null com 400 em vez de corromper o campo', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'x', tags: null });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'As tags devem ser um array de strings.' });
  });
});

describe('GET /api/tasks', () => {
  test('retorna um array vazio quando não há tarefas', async () => {
    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 });
  });

  test('retorna todas as tarefas criadas', async () => {
    await request(app).post('/api/tasks').send({ title: 'Tarefa 1' });
    await request(app).post('/api/tasks').send({ title: 'Tarefa 2' });

    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.map((task) => task.title)).toEqual(['Tarefa 1', 'Tarefa 2']);
    expect(response.body).toMatchObject({ page: 1, limit: 10, total: 2, totalPages: 1 });
  });

  test('usa os valores padrão de page e limit quando não são informados', async () => {
    for (let i = 1; i <= 3; i++) {
      await request(app).post('/api/tasks').send({ title: `Tarefa ${i}` });
    }

    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(10);
    expect(response.body.data).toHaveLength(3);
  });

  test('aplica page e limit corretamente, cortando os resultados via LIMIT/OFFSET', async () => {
    for (let i = 1; i <= 12; i++) {
      await request(app).post('/api/tasks').send({ title: `Tarefa ${i}` });
    }

    const firstPage = await request(app).get('/api/tasks?page=1&limit=5');
    const secondPage = await request(app).get('/api/tasks?page=2&limit=5');
    const thirdPage = await request(app).get('/api/tasks?page=3&limit=5');

    expect(firstPage.body.data).toHaveLength(5);
    expect(firstPage.body.data.map((task) => task.title)).toEqual([
      'Tarefa 1', 'Tarefa 2', 'Tarefa 3', 'Tarefa 4', 'Tarefa 5'
    ]);

    expect(secondPage.body.data).toHaveLength(5);
    expect(secondPage.body.data.map((task) => task.title)).toEqual([
      'Tarefa 6', 'Tarefa 7', 'Tarefa 8', 'Tarefa 9', 'Tarefa 10'
    ]);

    expect(thirdPage.body.data).toHaveLength(2);
    expect(thirdPage.body.data.map((task) => task.title)).toEqual(['Tarefa 11', 'Tarefa 12']);

    expect(firstPage.body.total).toBe(12);
    expect(secondPage.body.total).toBe(12);
    expect(thirdPage.body.total).toBe(12);
  });

  test('calcula totalPages corretamente quando a divisão não é exata', async () => {
    for (let i = 1; i <= 7; i++) {
      await request(app).post('/api/tasks').send({ title: `Tarefa ${i}` });
    }

    const response = await request(app).get('/api/tasks?page=1&limit=3');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 7, limit: 3, totalPages: 3 });
  });

  test.each(['abc', '0', '1.5'])('rejeita page inválido "%s"', async (page) => {
    const response = await request(app).get(`/api/tasks?page=${page}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'O parâmetro page deve ser um número inteiro maior ou igual a 1.'
    });
  });

  test.each(['abc', '0'])('rejeita limit inválido "%s"', async (limit) => {
    const response = await request(app).get(`/api/tasks?limit=${limit}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'O parâmetro limit deve ser um número inteiro maior ou igual a 1.'
    });
  });

  test('rejeita limit acima de 100', async () => {
    const response = await request(app).get('/api/tasks?limit=101');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'O parâmetro limit não pode exceder 100.' });
  });

  // Este teste observa apenas o comportamento HTTP: garante que paginação e total
  // permanecem consistentes após uma deleção no meio da tabela. Ele NÃO prova que a
  // query usa "ORDER BY id" — em uma tabela INTEGER PRIMARY KEY AUTOINCREMENT o SQLite
  // já tende a devolver linhas em ordem de rowid mesmo sem ORDER BY, então este teste
  // passaria mesmo sem a cláusula. A garantia real de que a query ordena
  // explicitamente por id está em tests/task-service.test.js, que espiona
  // `db.prepare` e verifica o SQL usado por `getAll`.
  test('mantém ordem ascendente por id e total correto na paginação após deletar uma tarefa do meio', async () => {
    const created = [];
    for (let i = 1; i <= 6; i++) {
      const response = await request(app).post('/api/tasks').send({ title: `Tarefa ${i}` });
      created.push(response.body.id);
    }

    const idToDelete = created[2];
    await request(app).delete(`/api/tasks/${idToDelete}`);

    const remainingIds = created.filter((id) => id !== idToDelete);

    const firstPage = await request(app).get('/api/tasks?page=1&limit=2');
    const secondPage = await request(app).get('/api/tasks?page=2&limit=2');
    const thirdPage = await request(app).get('/api/tasks?page=3&limit=2');

    expect(firstPage.body).toMatchObject({ total: 5, totalPages: 3 });
    expect(firstPage.body.data.map((task) => task.id)).toEqual(remainingIds.slice(0, 2));
    expect(secondPage.body.data.map((task) => task.id)).toEqual(remainingIds.slice(2, 4));
    expect(thirdPage.body.data.map((task) => task.id)).toEqual(remainingIds.slice(4, 5));

    const allPaginatedIds = [
      ...firstPage.body.data,
      ...secondPage.body.data,
      ...thirdPage.body.data
    ].map((task) => task.id);

    expect(allPaginatedIds).toEqual(remainingIds);
    expect(new Set(allPaginatedIds).size).toBe(allPaginatedIds.length);
  });
});

describe('GET /api/tasks/status/:status', () => {
  test('rejeita status inválido', async () => {
    const response = await request(app).get('/api/tasks/status/done');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Status inválido. Use "completed" ou "pending".' });
  });

  test('filtra tarefas concluídas', async () => {
    const pending = await request(app).post('/api/tasks').send({ title: 'Pendente' });
    const completed = await request(app).post('/api/tasks').send({ title: 'Concluída' });
    await request(app).patch(`/api/tasks/${completed.body.id}/complete`).send({});

    const response = await request(app).get('/api/tasks/status/completed');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(completed.body.id);
  });

  test('filtra tarefas pendentes', async () => {
    await request(app).post('/api/tasks').send({ title: 'Pendente' });
    const completed = await request(app).post('/api/tasks').send({ title: 'Concluída' });
    await request(app).patch(`/api/tasks/${completed.body.id}/complete`).send({});

    const response = await request(app).get('/api/tasks/status/pending');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Pendente');
  });
});

describe('GET /api/tasks/priority/:priority', () => {
  test('rejeita prioridade inválida', async () => {
    const response = await request(app).get('/api/tasks/priority/urgent');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Prioridade inválida. Use "low", "medium" ou "high".'
    });
  });

  test('filtra tarefas pela prioridade informada', async () => {
    await request(app).post('/api/tasks').send({ title: 'Tarefa baixa', priority: 'low' });
    const high = await request(app).post('/api/tasks').send({ title: 'Tarefa alta', priority: 'high' });

    const response = await request(app).get('/api/tasks/priority/high');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(high.body.id);
  });
});

describe('GET /api/tasks/count', () => {
  test('conta todas as tarefas quando nenhum status é informado', async () => {
    await request(app).post('/api/tasks').send({ title: 'Tarefa 1' });
    await request(app).post('/api/tasks').send({ title: 'Tarefa 2' });

    const response = await request(app).get('/api/tasks/count');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ count: 2 });
  });

  test('conta apenas as tarefas concluídas quando status=completed', async () => {
    await request(app).post('/api/tasks').send({ title: 'Pendente' });
    const completed = await request(app).post('/api/tasks').send({ title: 'Concluída' });
    await request(app).patch(`/api/tasks/${completed.body.id}/complete`).send({});

    const response = await request(app).get('/api/tasks/count?status=completed');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ count: 1 });
  });

  test('rejeita status inválido', async () => {
    const response = await request(app).get('/api/tasks/count?status=done');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Status inválido. Use "completed" ou "pending".' });
  });
});

describe('GET /api/tasks/:id', () => {
  test.each(['abc', '7abc'])('rejeita id inválido "%s"', async (id) => {
    const response = await request(app).get(`/api/tasks/${id}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'ID inválido. Use um número inteiro.' });
  });

  test('retorna 404 quando a tarefa não existe', async () => {
    const response = await request(app).get('/api/tasks/999999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Tarefa não encontrada' });
  });

  test('retorna a tarefa quando o id existe', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app).get(`/api/tasks/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(created.body);
  });

  test('retorna o estimatedHours persistido na criação', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Estudar Express', estimatedHours: 3 });

    const response = await request(app).get(`/api/tasks/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body.estimatedHours).toBe(3);
  });
});

describe('PUT /api/tasks/:id', () => {
  test.each(['abc', '7abc'])('rejeita id inválido "%s"', async (id) => {
    const response = await request(app).put(`/api/tasks/${id}`).send({ title: 'Novo título' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'ID inválido. Use um número inteiro.' });
  });

  test('retorna 404 quando a tarefa não existe', async () => {
    const response = await request(app).put('/api/tasks/999999').send({ title: 'Novo título' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Tarefa não encontrada' });
  });

  test('rejeita tentativa de atualizar o id', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ id: 9999 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Não é permitido atualizar id ou createdAt.' });
  });

  test('rejeita tentativa de atualizar o createdAt', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ createdAt: '2020-01-01T00:00:00Z' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Não é permitido atualizar id ou createdAt.' });
  });

  test('rejeita validação inválida ao atualizar', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ priority: 'urgent' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Prioridade inválida. Use "low", "medium" ou "high".'
    });
  });

  test('rejeita título numérico com 400 em vez de 500', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ title: 123 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'O título é obrigatório' });
  });

  test('rejeita descrição numérica com 400 em vez de 500', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ description: 123 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'A descrição deve ser um texto' });
  });

  test.each([0, false])('rejeita descrição %p com 400 em vez de 500 (falsy mas não vazio/nulo)', async (description) => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ description });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'A descrição deve ser um texto' });
  });

  test('rejeita description null com 400 em vez de 500', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ description: null });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'A descrição deve ser um texto' });
  });

  test('rejeita tags null em vez de corromper o campo com null', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Estudar Express', tags: ['backend', 'node'] });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ tags: null });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'As tags devem ser um array de strings.' });

    const getResponse = await request(app).get(`/api/tasks/${created.body.id}`);

    expect(getResponse.body.tags).toEqual(['backend', 'node']);
  });

  test('atualiza o estimatedHours de uma tarefa existente', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Estudar Express', estimatedHours: 2 });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ estimatedHours: 10 });

    expect(response.status).toBe(200);
    expect(response.body.estimatedHours).toBe(10);
  });

  test('atualiza parcialmente os campos fornecidos e preserva os demais', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Estudar Express', description: 'Descrição original' });

    const response = await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ title: 'Estudar Express - Avançado', isCompleted: true });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: created.body.id,
      title: 'Estudar Express - Avançado',
      description: 'Descrição original',
      isCompleted: true,
      createdAt: created.body.createdAt
    });
  });
});

describe('PATCH /api/tasks/:id/complete', () => {
  test.each(['abc', '7abc'])('rejeita id inválido "%s"', async (id) => {
    const response = await request(app).patch(`/api/tasks/${id}/complete`).send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'ID inválido. Use um número inteiro.' });
  });

  test('retorna 404 quando a tarefa não existe', async () => {
    const response = await request(app).patch('/api/tasks/999999/complete').send({});

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Tarefa não encontrada' });
  });

  test('marca a tarefa como concluída', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ title: 'Estudar Express', isCompleted: false });

    const response = await request(app).patch(`/api/tasks/${created.body.id}/complete`).send({});

    expect(response.status).toBe(200);
    expect(response.body.isCompleted).toBe(true);
  });
});

describe('PATCH /api/tasks/:id/due-date', () => {
  test.each(['abc', '7abc'])('rejeita id inválido "%s"', async (id) => {
    const response = await request(app)
      .patch(`/api/tasks/${id}/due-date`)
      .send({ dueDate: '2026-08-15T18:00:00Z' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'ID inválido. Use um número inteiro.' });
  });

  test('rejeita quando dueDate não é fornecida', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app).patch(`/api/tasks/${created.body.id}/due-date`).send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'A data de vencimento é obrigatória' });
  });

  test('rejeita dueDate em formato inválido', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .patch(`/api/tasks/${created.body.id}/due-date`)
      .send({ dueDate: 'não é uma data' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Data de vencimento inválida. Use formato ISO 8601 (ex: 2026-07-15T10:00:00Z)'
    });
  });

  test('rejeita dueDate que não é uma string com 400, sem quebrar em 500', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .patch(`/api/tasks/${created.body.id}/due-date`)
      .send({ dueDate: 20260815 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Data de vencimento inválida. Use formato ISO 8601 (ex: 2026-07-15T10:00:00Z)'
    });
  });

  test('retorna 404 quando a tarefa não existe', async () => {
    const response = await request(app)
      .patch('/api/tasks/999999/due-date')
      .send({ dueDate: '2026-08-15T18:00:00Z' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Tarefa não encontrada' });
  });

  test('define a data de vencimento da tarefa', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app)
      .patch(`/api/tasks/${created.body.id}/due-date`)
      .send({ dueDate: '2026-08-15T18:00:00Z' });

    expect(response.status).toBe(200);
    expect(response.body.dueDate).toBe('2026-08-15T18:00:00Z');
  });
});

describe('DELETE /api/tasks/:id', () => {
  test.each(['abc', '7abc'])('rejeita id inválido "%s"', async (id) => {
    const response = await request(app).delete(`/api/tasks/${id}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'ID inválido. Use um número inteiro.' });
  });

  test('retorna 404 quando a tarefa não existe', async () => {
    const response = await request(app).delete('/api/tasks/999999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Tarefa não encontrada' });
  });

  test('deleta a tarefa e retorna a confirmação', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Estudar Express' });

    const response = await request(app).delete(`/api/tasks/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Tarefa deletada com sucesso',
      task: created.body
    });

    const afterDelete = await request(app).get(`/api/tasks/${created.body.id}`);
    expect(afterDelete.status).toBe(404);
  });
});
