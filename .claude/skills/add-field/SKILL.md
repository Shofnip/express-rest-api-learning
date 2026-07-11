---
name: add-field
description: Adiciona um novo campo ao Data Model de tarefa da API — atualiza a definição em CLAUDE.md, valida no utils/validators.js quando necessário, inicializa/atualiza o campo em services/task-service.js e documenta em TODOS os endpoints afetados no API.md. Use quando o usuário pedir para adicionar um novo campo/atributo/propriedade ao modelo de tarefa.
when_to_use: Disparar quando o usuário pedir para "adicionar um campo", "adicionar um atributo à tarefa", "incluir uma nova propriedade no modelo de dados", "expandir o modelo de dados", ou equivalente para este projeto de tarefas.
---

Você vai adicionar um novo campo ao modelo de dados de tarefa (`Data Model`) da API, seguindo o processo "Adding Features > New Task Field" do `CLAUDE.md`, adaptado à arquitetura em camadas atual do projeto (routes → controller → service). Este processo é **obrigatório em todas as etapas abaixo, sem exceção** — nenhuma etapa pode ser pulada mesmo que pareça não se aplicar; nesse caso, explicite por que ela foi um "no-op".

## 1. Reunir as informações necessárias

Antes de gerar qualquer código, você precisa saber, no mínimo, quatro coisas. Se o usuário não informou alguma no pedido, **pergunte antes de prosseguir** (use AskUserQuestion se disponível):

1. **Nome do campo** — em `camelCase`, em inglês (ex: `priority`, `tags`, `assignee`).
2. **Tipo de dado** — `string`, `number`, `boolean`, data ISO 8601, enum de valores fixos, array, etc.
3. **Obrigatório?** — se sim, exigido em qual(is) endpoint(s) (tipicamente na criação); se não, pode ser omitido.
4. **Valor padrão** — usado quando o campo é opcional e não informado na criação (ex: `null`, `''`, `false`, `[]`).

Pergunte também, se não estiver claro pelo pedido:
- Há alguma regra de validação específica (tamanho máximo, formato, valores permitidos)?
- O campo pode ser atualizado via `PUT /api/tasks/:id`, ou precisa de um endpoint dedicado (como `dueDate` tem o PATCH `/due-date`)? Não assuma — pergunte se o pedido não deixar isso explícito.

Não prossiga com suposições sobre esses pontos — a lista acima é a base de tudo que vem a seguir.

## 2. Checklist de implementação (nesta ordem, sem exceção)

### 2.1. CLAUDE.md — Data Model
Adicionar o campo ao bloco de código da seção `## Data Model`, seguindo o padrão de comentário já usado (`// required, ...` / `// optional, defaults to ...`). Manter a ordem lógica dos campos (ex: campos de conteúdo antes de metadados como `createdAt`).

### 2.2. CLAUDE.md — Business Rules
Adicionar uma regra de negócio para o campo na seção `## Business Rules`:
- Se o campo tiver validação, formato específico, ou endpoint dedicado, criar uma subseção numerada própria (siga o padrão da subseção "5. Task Due Date").
- Se for um campo simples sem regra especial (como `completed`), adicione uma linha à subseção "1. Task Creation" existente em vez de criar uma nova subseção.

### 2.3. utils/validators.js — Validação (se necessário)
Se o campo tiver alguma restrição (tamanho, formato, obrigatoriedade, valores permitidos), criar uma função `validateXxx(value)` retornando `{ isValid: boolean, error?: string }`, com mensagem de erro em português no mesmo tom das existentes. Conectar essa validação:
- Em `validateCreateTask` se o campo for aceito/obrigatório na criação.
- Em `validateUpdateTask` se o campo for atualizável via PUT (chamando a validação apenas quando `body.<campo> !== undefined`).
- Se o campo não precisar de validação além de tipo/presença trivial (ex: um booleano simples), não crie uma função nova — documente essa decisão no resumo final.

### 2.4. services/task-service.js — Inicialização e atualização
- Em `save()`, adicionar o campo ao objeto `newTask`, aplicando o valor padrão definido pelo usuário (mesmo padrão usado para `completed` e `dueDate`).
- Se o campo for atualizável via PUT, adicionar um bloco `if (updates.<campo> !== undefined) { task.<campo> = ...; }` dentro de `updateById()`, replicando o padrão dos campos existentes (incluindo `.trim()` se for string).
- Se o campo exigir um endpoint dedicado (ex: um novo PATCH), siga o processo da skill `add-endpoint` para essa parte — não duplique essa lógica aqui.

### 2.5. controllers/task-controller.js
Só altere o controller se uma nova validação precisar ser explicitamente chamada em um handler já existente (normalmente `create`/`update`), ou se o usuário pediu um endpoint dedicado (delegue a esse fluxo via `add-endpoint`). Não adicione lógica de negócio aqui.

### 2.6. API.md — Atualizar TODOS os endpoints afetados, sem exceção
Isto é obrigatório e é fácil de esquecer um endpoint — revise cada um explicitamente, mesmo que a mudança seja "nenhuma":

- **Seção "Data Model"** (final do arquivo) — sempre atualizar.
- **1. POST /api/tasks** — adicionar o campo em "Parâmetros" se aceito no body de criação, e no JSON de "Exemplo de Response". Adicionar erro 400 correspondente em "Possíveis Respostas de Erro" se houver validação nova.
- **2. GET /api/tasks** — atualizar o(s) JSON de "Exemplo de Response" (lista de tarefas).
- **3. GET /api/tasks/status/:status** — atualizar o JSON de "Exemplo de Response".
- **4. GET /api/tasks/:id** — atualizar o JSON de "Exemplo de Response".
- **5. PUT /api/tasks/:id** — se atualizável via PUT, adicionar em "Parâmetros" e no JSON de exemplo, e o erro 400 relevante; se **não** for atualizável via PUT, adicionar nota explícita junto ao aviso de campos imutáveis (`id`/`createdAt`).
- **6. PATCH /api/tasks/:id/complete** — atualizar o JSON de "Exemplo de Response" (retorna a task inteira).
- **7. PATCH /api/tasks/:id/due-date** — atualizar o JSON de "Exemplo de Response".
- **8. DELETE /api/tasks/:id** — atualizar o JSON de "Exemplo de Response" (campo aparece dentro do objeto `task`).
- Se o campo tiver um endpoint dedicado novo (ex: PATCH próprio), documentar essa nova seção seguindo o padrão da skill `add-endpoint` e renumerar as seções seguintes se inserida no meio; se apenas anexada ao final, ajustar a numeração antes de "Códigos de Status HTTP".

Antes de finalizar, faça uma busca (`grep`) por todos os blocos JSON de exemplo de tarefa em `API.md` para confirmar que nenhuma ocorrência do objeto de tarefa ficou sem o novo campo.

### 2.7. teste.http (recomendado, não obrigatório)
Sugerir/adicionar exemplos de request cobrindo: criação com o campo, criação sem o campo (valor padrão), atualização do campo (se aplicável) e um caso de erro de validação (se houver).

## 3. Convenções a respeitar (do CLAUDE.md)

- Nomes de arquivos/pastas em `kebab-case`; variáveis e funções em `camelCase`; constantes em `UPPER_SNAKE_CASE`.
- Nomes técnicos sempre em inglês; mensagens de erro e comentários (quando necessários) em português.
- Comentários só quando o "porquê" não for óbvio.
- Respostas de erro no formato `{ error: "mensagem" }`, com HTTP 400 (validação) / 404 (não encontrado) / 500 (erro de servidor).
- Sempre `async/await`, nunca `.then()`.

## 4. Depois de implementar

Apresente um resumo em formato de checklist confirmando, item a item, o que foi feito em cada etapa da seção 2 (incluindo os "no-op" explicados) — em especial, liste **cada endpoint do API.md** e confirme que foi revisado/atualizado, já que essa é a parte mais fácil de deixar incompleta.
