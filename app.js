const path = require('node:path');
const express = require('express');
const taskRoutes = require('./routes/task-routes');

const app = express();
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/tasks', taskRoutes);

app.use(express.static(PUBLIC_DIR));

// Fallback de SPA: qualquer rota GET fora de /api serve o front React
// (client/, buildado em public/ — ver CLAUDE.md "Frontend"). Requisições
// /api sem rota correspondente seguem para o 404 padrão do Express.
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

module.exports = app;
