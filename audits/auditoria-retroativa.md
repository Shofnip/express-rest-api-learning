# Auditoria — CLAUDE.md / API.md vs. Código Real (2026-07-13)

## ✅ O que está correto

1. **Todos os 10 endpoints documentados em `API.md` existem e batem com o método/caminho declarado** — conferido linha a linha entre `API.md` (seções 1–10) e `routes/task-routes.js:6-15`. Diferença cosmética: a rota de prioridade usa o parâmetro `:level` (`routes/task-routes.js:9`) em vez de `:priority` como no texto do `API.md`, mas isso não afeta o comportamento da URL real (`/api/tasks/priority/high` funciona igual). Confirmado via `curl` e via `tests/task-routes.test.js:187-207`.

2. **Ordem das rotas evita "shadowing" de `/:id`** — `/status/:status`, `/priority/:level` e `/count` estão declaradas antes de `/:id` em `routes/task-routes.js:8-11`, então essas rotas não são interceptadas pelo handler genérico de ID. Verificado via `curl` (`GET /api/tasks/count`, `GET /api/tasks/priority/high`) e testes (`tests/task-routes.test.js:209-237`).

3. **Formato de erro padronizado `{ "error": "..." }`** é usado de forma consistente em todos os `catch` de `controllers/task-controller.js` (linhas 14, 23, 40, 55, 69, 89, 118, 139, 163, 183), conforme `API.md` e `.claude/rules/api-design.md`.

4. **Campos imutáveis (`id`, `createdAt`) no PUT** — `controllers/task-controller.js:101-103` rejeita com exatamente a mensagem documentada `"Não é permitido atualizar id ou createdAt."`, testado em `tests/task-routes.test.js:279-299`.

5. **Valores padrão na criação** (`isCompleted: false`, `priority: null`, `tags: []`, `description: ''`, `dueDate: null`) implementados em `services/task-service.js:19-30` batem com o Data Model documentado em `CLAUDE.md` e `API.md`. Confirmado via `curl POST {title}` → `201` com todos os defaults corretos, e via `tests/task-routes.test.js:30-44`.

6. **Mensagens de erro de `priority`, `tags` (array/máx. 10/máx. 50 chars), `status` e `id` inválido** batem exatamente com o texto documentado em `API.md` — comparado texto-a-texto entre `utils/validators.js:110-154` e as seções de erro do `API.md`, e confirmado pela suíte de testes.

7. **Bug de `validateDueDate` já corrigido nesta sessão está de fato corrigido e coberto por regressão**: `utils/validators.js:94-108` agora checa `typeof dueDate === 'string'` antes de `.trim()`/regex, e usa um regex ISO 8601 estrito (`ISO_8601_REGEX`, linha 1) que rejeita formatos "soltos" como `07/15/2026` mesmo que `new Date()` os aceite. Testes de regressão específicos existem em `tests/validators.test.js:296-313` e `tests/task-routes.test.js:393-404`. `npm test` confirma **92/92 testes passando**.

8. **`npm test` (Jest) roda limpo**: 3 suítes, 92 testes, todos passando (`Test Suites: 3 passed, 3 total`, `Tests: 92 passed, 92 total`).

9. **Skills `add-endpoint` e `add-field` (`.claude/skills/*/SKILL.md`) referenciam arquivos/convenções que de fato existem e batem com a estrutura atual**: `routes/task-routes.js`, `controllers/task-controller.js`, `services/task-service.js`, `utils/validators.js`, `services/db.js`, formato `{ isValid, error }`, kebab-case, mensagens em português, padrão de validação de `id` (`parseInt` + `isNaN`) — tudo consistente com o código lido.

10. **Persistência SQLite real**: `services/db.js:4-19` cria `tasks.db` via `better-sqlite3` com `journal_mode = WAL` e `CREATE TABLE IF NOT EXISTS`; `services/task-service.js` roda SQL síncrono (sem `async/await`), exatamente como descrito na seção "State & Persistence" do `CLAUDE.md`. Confirmado subindo o servidor real e observando que tarefas criadas em uma execução (`id: 7`) continuaram acessíveis em execução posterior do mesmo processo.

---

## ⚠️ Inconsistências encontradas

1. **`API.md` contradiz a persistência real (item ainda mais grave por já ter uma seção correta em `CLAUDE.md`)** — `API.md:729` ("Notas Importantes", item 4) afirma: *"Armazenamento: Os dados são armazenados em memória e perdidos ao reiniciar o servidor."* Isso é falso: `services/db.js:1-21` usa `better-sqlite3` com um arquivo `tasks.db` persistente (WAL), e o próprio `CLAUDE.md` (seção "State & Persistence") documenta corretamente essa persistência. Confirmado na prática: subi o servidor, criei uma tarefa (`id: 7`), matei o processo, subi de novo, e a tarefa `id: 7` continuou existindo/acessível.

2. **`CLAUDE.md` se contradiz internamente sobre a camada de dados** — `CLAUDE.md:138` (seção "Architecture", item 4) ainda diz *"Data Layer — In-memory array (replace with database queries when needed)"*, o que contradiz a seção "State & Persistence" mais abaixo no mesmo arquivo (que descreve corretamente o SQLite via `better-sqlite3`) e o código real (`services/db.js`, `services/task-service.js`). A seção "Architecture" ficou desatualizada após a migração para SQLite (commit `5c2592c`/`fcba4e9` no histórico do git).

3. **Título/descrição não-string quebram a criação com 500 em vez de 400 documentado** — `utils/validators.js:9` (`validateTitle`, `if (!title || title.trim().length === 0)`) e `utils/validators.js:21` (`validateDescription`) chamam `.trim()` sem checar `typeof === 'string'` antes. Se `title` ou `description` vierem como número (ou qualquer tipo sem `.trim()`), a chamada lança `TypeError`, que só é capturada pelo `try/catch` genérico do controller (`controllers/task-controller.js:4-16`), retornando `500 { "error": "Erro ao criar tarefa" }` em vez de um `400` de validação como a API documenta para "todo erro de validação". Reproduzido via `curl`:
   - `POST /api/tasks {"title": 123}` → `500 {"error":"Erro ao criar tarefa"}`
   - `POST /api/tasks {"title":"ok","description":123}` → `500 {"error":"Erro ao criar tarefa"}`
   - O mesmo padrão de crash acontece em `validateUpdateTask` (`utils/validators.js:63-67`), confirmado diretamente via `node -e` chamando `validateUpdateTask({title:123})` → `title.trim is not a function`.
   Este é exatamente o mesmo tipo de bug já corrigido para `validateDueDate` nesta sessão (falta de checagem de tipo antes de `.trim()`), mas **não foi replicado para `validateTitle`/`validateDescription`**, e não há nenhum teste cobrindo esse caso (ao contrário de `validateDueDate`, que agora tem teste explícito em `tests/validators.test.js:305-312` para entrada não-string).

4. **IDs malformados como `"7abc"` não são rejeitados com 400, apesar do texto documentado "ID inválido. Use um número inteiro."`** — Todos os handlers que recebem `:id` (`getById`, `update`, `markAsCompleted`, `setDueDate`, `remove` em `controllers/task-controller.js`) usam `parseInt(req.params.id); if (isNaN(taskId))`. Como `parseInt("7abc")` retorna `7` (não `NaN`), IDs com sufixo textual são silenciosamente truncados e tratados como válidos. Reproduzido via `curl` com uma tarefa real de `id: 7`:
   - `GET /api/tasks/7abc` → `200` retornando a tarefa `id: 7` (deveria ser `400 {"error":"ID inválido. Use um número inteiro."}` segundo `API.md`, seção 4).
   - `GET /api/tasks/1abc` (id 1 inexistente) → `404` em vez do `400` esperado, mascarando o problema quando o ID prefixado não existe.
   O mesmo vale para `1.9` (não inteiro) sendo aceito como `1` sem erro. Isso contraria tanto o texto do erro ("Use um número inteiro") quanto a expectativa geral de validação estrita de entrada.

5. **Limite de 255 caracteres do título é validado sobre a string crua, não trimada**, apesar do `API.md` (seção 1, "Parâmetros") dizer explicitamente *"Será trimado automaticamente"* para o campo `title`. `utils/validators.js:13` faz `title.length > MAX_TITLE_LENGTH` antes de qualquer `.trim()`. Reproduzido via requisição real: um título com 250 caracteres `"a"` + 10 espaços à direita (260 caracteres brutos, 250 após trim) foi **rejeitado** com `400 {"error":"O título não pode exceder 255 caracteres"}`, mesmo que o valor persistido (após trim em `services/task-service.js:20`) tivesse apenas 250 caracteres — bem dentro do limite documentado.

6. **Mensagens de erro de tags existentes no código não estão documentadas no `API.md`** — `utils/validators.js:131` (`"Cada tag deve ser uma string."`) e `utils/validators.js:135` (`"Tags não podem ser vazias."`) são retornadas pela API e têm cobertura de teste (`tests/validators-extra.test.js:143-147,194-198`), mas **não aparecem** na lista "Possíveis Respostas de Erro" de `POST /api/tasks` (seção 1) nem de `PUT /api/tasks/:id` (seção 5) do `API.md`, que só listam `"As tags devem ser um array de strings."`, `"Máximo 10 tags permitidas."` e `"Cada tag não pode exceder 50 caracteres."`.

7. **`isCompleted` não tem validação de tipo, apesar do Data Model documentar `boolean`** — não existe `validateIsCompleted` em `utils/validators.js`, e `services/task-service.js:22` faz `taskData.isCompleted || false`, que coage qualquer valor truthy não-booleano para `true`. Reproduzido via `curl`: `POST /api/tasks {"title":"...", "isCompleted":"yes"}` → `201` com `"isCompleted": true`. O `API.md`/`CLAUDE.md` não prometem explicitamente um erro 400 para isso, mas o Data Model diz `isCompleted: boolean`, e nenhuma validação garante esse contrato.

8. **`CLAUDE.md` "Project Structure" e a descrição de `server.js` estão desatualizadas em relação ao código real** — a árvore de arquivos em `CLAUDE.md:100-119` não lista `services/db.js` (que a própria seção "State & Persistence" do mesmo arquivo referencia como o local de setup da conexão SQLite) nem `app.js`. Além disso, `CLAUDE.md:105` atribui a `server.js` a responsabilidade de *"Express app initialization, middleware setup"*, mas essa lógica está hoje em `app.js` (`app.js:1-15`, com `express()`, `express.json()`, `app.use('/api/tasks', taskRoutes)`); `server.js` (linhas 1-7) hoje só faz `require('./app')` e `app.listen(PORT, ...)`.

9. **Seção "Testing" do `CLAUDE.md` não menciona a suíte automatizada Jest**, apesar de `package.json` definir `"test": "jest"` e existir uma suíte completa em `tests/` (`validators.test.js`, `validators-extra.test.js`, `task-routes.test.js`, totalizando 92 testes). A seção `## Testing` do `CLAUDE.md` só documenta "REST Client (VS Code extension)" e "Manual curl testing", omitindo o que hoje é a evidência automatizada primária do projeto.

---

## 📋 Recomendação final

Prioridade de correção sugerida (não executada nesta auditoria, apenas descrita):

1. **Alta prioridade / bug funcional real**: aplicar a mesma correção já feita em `validateDueDate` para `validateTitle` e `validateDescription` em `utils/validators.js` — checar `typeof === 'string'` antes de `.trim()` para não vazar `500` em vez de `400` quando o cliente envia tipos inesperados. Adicionar testes de regressão análogos aos já existentes para `dueDate`.
2. **Alta prioridade / bug funcional real**: trocar `parseInt` + `isNaN` pela validação estrita de ID (ex.: regex `^\d+$` ou `Number.isInteger` sobre `Number(req.params.id)`) em todos os handlers de `:id` no `controllers/task-controller.js`, para que `"7abc"`/`"1.9"` sejam de fato rejeitados com `400` como o texto de erro promete.
3. **Média prioridade / doc desatualizada e potencialmente enganosa**: corrigir `API.md:729` (item "Armazenamento") para refletir a persistência SQLite real, e atualizar `CLAUDE.md:138` ("Data Layer — In-memory array") para não contradizer a própria seção "State & Persistence" do mesmo documento. Essas duas correções são as de maior risco de gerar confiança errada em quem usa a API ou em agentes automatizados que leem `CLAUDE.md`/`API.md` como fonte da verdade.
4. **Média prioridade / doc incompleta**: atualizar a árvore de "Project Structure" e a descrição de `server.js` no `CLAUDE.md` para incluir `app.js` e `services/db.js`, e adicionar `npm test` (Jest) à seção "Testing".
5. **Baixa prioridade / comportamento vs. documentação de limite de tamanho**: decidir e documentar explicitamente se o limite de 255 caracteres do `title` deve ser aplicado antes ou depois do trim (hoje é antes, o que rejeita títulos com espaços extras que ficariam válidos após trim) — e ajustar `utils/validators.js:13` ou o texto do `API.md` para ficarem consistentes entre si.
6. **Baixa prioridade / doc incompleta**: adicionar ao `API.md` as mensagens de erro de tags já existentes no código (`"Cada tag deve ser uma string."`, `"Tags não podem ser vazias."`) e considerar se `isCompleted` deveria ganhar validação de tipo explícita, dado que o Data Model o declara como `boolean`.
