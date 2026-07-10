let tarefas = [];
let proximoId = 1;

const criar = (req, res) => {
  const { titulo, descricao, concluida } = req.body;

  if (!titulo) {
    return res.status(400).json({ erro: 'O título é obrigatório' });
  }

  const novaTarefa = {
    id: proximoId++,
    titulo,
    descricao: descricao || '',
    concluida: concluida || false,
    dataCriacao: new Date()
  };

  tarefas.push(novaTarefa);
  res.status(201).json(novaTarefa);
};

const listar = (req, res) => {
  res.json(tarefas);
};

const buscarPorId = (req, res) => {
  const { id } = req.params;
  const tarefa = tarefas.find(t => t.id === parseInt(id));

  if (!tarefa) {
    return res.status(404).json({ erro: 'Tarefa não encontrada' });
  }

  res.json(tarefa);
};

const atualizar = (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, concluida } = req.body;

  const tarefa = tarefas.find(t => t.id === parseInt(id));

  if (!tarefa) {
    return res.status(404).json({ erro: 'Tarefa não encontrada' });
  }

  if (titulo !== undefined) tarefa.titulo = titulo;
  if (descricao !== undefined) tarefa.descricao = descricao;
  if (concluida !== undefined) tarefa.concluida = concluida;

  res.json(tarefa);
};

const deletar = (req, res) => {
  const { id } = req.params;
  const indice = tarefas.findIndex(t => t.id === parseInt(id));

  if (indice === -1) {
    return res.status(404).json({ erro: 'Tarefa não encontrada' });
  }

  const tarefaDeletada = tarefas.splice(indice, 1);
  res.json({ mensagem: 'Tarefa deletada com sucesso', tarefa: tarefaDeletada[0] });
};

module.exports = { criar, listar, buscarPorId, atualizar, deletar };
