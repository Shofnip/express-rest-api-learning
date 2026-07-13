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
});

describe('GET /api/tasks', () => {
  test('retorna um array vazio quando não há tarefas', async () => {
    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('retorna todas as tarefas criadas', async () => {
    await request(app).post('/api/tasks').send({ title: 'Tarefa 1' });
    await request(app).post('/api/tasks').send({ title: 'Tarefa 2' });

    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((task) => task.title)).toEqual(['Tarefa 1', 'Tarefa 2']);
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
