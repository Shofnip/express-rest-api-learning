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

const db = require('../services/db');
const taskService = require('../services/task-service');

beforeEach(() => {
  db.exec('DELETE FROM tasks');
});

describe('getAll', () => {
  test('usa ORDER BY id na query de listagem, garantindo ordem determinística mesmo que o SQLite mude sua ordem física padrão', () => {
    const prepareSpy = jest.spyOn(db, 'prepare');

    taskService.getAll(1, 10);

    const dataQuerySql = prepareSpy.mock.calls[0][0];
    expect(dataQuerySql).toMatch(/ORDER BY id\s+ASC/i);

    prepareSpy.mockRestore();
  });

  test('aplica page e limit corretamente ao calcular offset, isolado da camada HTTP', () => {
    taskService.save({ title: 'Tarefa 1' });
    taskService.save({ title: 'Tarefa 2' });
    taskService.save({ title: 'Tarefa 3' });

    const result = taskService.getAll(2, 2);

    expect(result.data.map((task) => task.title)).toEqual(['Tarefa 3']);
    expect(result.total).toBe(3);
  });

  test('retorna total correto e dados vazios quando a página solicitada excede os registros existentes', () => {
    taskService.save({ title: 'Única tarefa' });

    const result = taskService.getAll(5, 10);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(1);
  });
});
