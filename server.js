const express = require('express');
const rotasTarefas = require('./routes/tarefas');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/tarefas', rotasTarefas);

app.get('/', (req, res) => {
  res.json({ mensagem: 'Bem-vindo à API de Tarefas!' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
