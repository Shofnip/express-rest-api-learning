---
name: add-endpoint
description: Cria um novo endpoint REST na API de tarefas seguindo o processo de "Adding Features > New Endpoint" do CLAUDE.md — rota, controller, service (se necessário), validação, async/await e documentação em API.md. Use quando o usuário pedir para adicionar/criar um novo endpoint, rota ou ação da API de tarefas.
when_to_use: Disparar quando o usuário pedir para "adicionar um endpoint", "criar uma rota", "expor uma nova ação da API", ou algo equivalente para este projeto de tarefas.
---

Você vai criar um novo endpoint REST para a API de tarefas, seguindo **exatamente** o processo descrito em `CLAUDE.md`, seção "Adding Features > New Endpoint", e as convenções de código, nomenclatura e mensagens já usadas no projeto.

## 1. Reunir as informações necessárias

Antes de gerar qualquer código, você precisa saber três coisas. Se o usuário não informou alguma delas no pedido, **pergunte antes de prosseguir** (use a AskUserQuestion se disponível, ou pergunte em texto):

1. **Método HTTP** (GET, POST, PUT, PATCH ou DELETE)
2. **Caminho/rota** (ex: `/api/tasks/:id/priority`, sempre dentro do prefixo `/api/tasks`)
3. **O que o endpoint faz** (comportamento, campos envolvidos, regras de negócio específicas)

Não assuma esses valores — só prossiga depois de tê-los claros.

## 2. Checklist de implementação (nesta ordem)

Siga o checklist do CLAUDE.md à risca:

1. **Rota** — adicionar em `routes/task-routes.js`, mapeando o verbo/caminho para uma nova função no controller. Sem lógica de negócio aqui.
2. **Controller** — implementar em `controllers/task-controller.js`:
   - Função `async`, com `try/catch` (nunca `.then()`).
   - Parse e valida `id` de path params do mesmo jeito que os endpoints existentes (`parseInt` + `isNaN` → 400 `{ error: 'ID inválido. Use um número inteiro.' }`).
   - Chama o service para a lógica de negócio; controller não deve conter regras de negócio, só orquestração e formatação de resposta.
   - Em erro inesperado, responde 500 com `{ error: 'Erro ao <ação> tarefa' }` (mensagem em português, no mesmo padrão dos outros handlers).
   - Exportar a nova função no `module.exports` do controller.
3. **Service** (`services/task-service.js`) — extrair a lógica de negócio reutilizável para cá **se** o endpoint precisar manipular o array `tasks` ou aplicar regras além de validação simples. Seguir o padrão existente: funções puras que recebem `id`/dados e retornam a task atualizada ou `null` se não encontrada. Exportar a nova função.
4. **Validação** — adicionar em `utils/validators.js` seguindo o padrão `{ isValid: boolean, error?: string }`, com mensagens de erro em português iguais em tom às já existentes. Chamar essa validação no controller antes de acionar o service.
5. **Async/await** — toda a cadeia (controller) deve usar `async/await`. Nunca introduzir `.then()`.
6. **Documentar em `API.md`** — adicionar uma nova seção seguindo exatamente o padrão das seções existentes (numeração sequencial, título `Método /caminho — Descrição curta`, subseções "Parâmetros", "Exemplo de Request" com `curl`, "Exemplo de Response", "Possíveis Respostas de Erro" cobrindo 400/404/500 conforme aplicável). Atualizar a tabela de "Códigos de Status HTTP" se necessário.

## 3. Convenções a respeitar (do CLAUDE.md)

- Nomes de arquivos/pastas em `kebab-case`; variáveis e funções em `camelCase`; constantes em `UPPER_SNAKE_CASE`.
- Nomes técnicos (funções, variáveis, arquivos) sempre em inglês; mensagens de erro e comentários (quando necessários) em português.
- Comentários só quando o "porquê" não for óbvio — não comentar o que o código já deixa claro.
- Respostas de erro no formato `{ error: "mensagem" }`, com os códigos HTTP corretos: 400 (validação), 404 (não encontrado), 500 (erro de servidor).
- Se o endpoint não puder atualizar `id`/`createdAt`, replicar a checagem já usada no `update` do controller.

## 4. Depois de implementar

Mostre um resumo do que foi criado/alterado (rota, controller, service, validador, doc) e, se fizer sentido, sugira o snippet correspondente para `teste.http` (não é obrigatório, mas mantém o arquivo de testes consistente com os demais endpoints).
