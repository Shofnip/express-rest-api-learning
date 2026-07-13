# Auditoria — Verificação Pós-Correções (2026-07-13)

Auditoria independente das 9 inconsistências apontadas em `audits/auditoria-retroativa.md`
(2026-07-13, sessão anterior), reconferindo cada uma contra o código atual, `npm test` e chamadas
`curl` reais contra o servidor. Nenhum arquivo de código-fonte foi alterado nesta sessão.

## ✅ O que está correto

1. **Bug funcional #3 do relatório anterior (título/descrição não-string → 500) está corrigido no
   caminho de criação.** `utils/validators.js:9` (`validateTitle`) agora checa
   `typeof title !== 'string'` antes de `.trim()`. Confirmado via `curl -X POST /api/tasks
   {"title":123}` → `400 {"error":"O título é obrigatório"}` (antes retornava `500`).

2. **Bug funcional #4 do relatório anterior (IDs malformados como `"7abc"`/`"1.9"` aceitos) está
   corrigido.** `utils/validators.js:176-184` introduziu `validateId` com regex estrito
   `^\d+$`, usado em todos os handlers de `:id` (`controllers/task-controller.js:75,96,126,147,173`).
   Confirmado via `curl`: `GET /api/tasks/10abc` → `400 {"error":"ID inválido. Use um número
   inteiro."}`; `GET /api/tasks/1.9` → mesmo erro `400` (antes eram truncados/aceitos via
   `parseInt`).

3. **Achado #5 do relatório anterior (limite de 255 caracteres do título aplicado antes do trim)
   está corrigido.** `utils/validators.js:13` agora compara `title.trim().length > MAX_TITLE_LENGTH`.
   `API.md:30` também foi atualizado para dizer explicitamente "Máximo 255 caracteres após trim
   (espaços em branco no início/fim não contam para o limite)". Confirmado via `curl`: um título
   com 250 `"a"` + 10 espaços à direita (260 caracteres brutos) foi aceito com `201` (antes era
   rejeitado com `400`).

4. **Achado #7 do relatório anterior (`isCompleted` sem validação de tipo) está corrigido.**
   `utils/validators.js:40-46` adiciona `validateIsCompleted`, conectada em `validateCreateTask`
   (linha 61-66) e `validateUpdateTask` (linha 100-105). Confirmado via `curl -X POST /api/tasks
   {"title":"t","isCompleted":"yes"}` → `400 {"error":"isCompleted deve ser um valor booleano
   (true ou false)."}` (antes era `201` com coerção silenciosa para `true`). Mensagem também
   documentada em `API.md:136-141` e `API.md:434-439`.

5. **Achado #6 do relatório anterior (mensagens de erro de tags não documentadas) está
   corrigido.** `API.md:122-134` (seção POST) e `API.md:420-432` (seção PUT) agora listam
   `"Cada tag deve ser uma string."` e `"Tags não podem ser vazias."`, batendo com
   `utils/validators.js:160-166`. Confirmado via `curl -X POST /api/tasks {"title":"t",
   "tags":[123]}` → `400 {"error":"Cada tag deve ser uma string."}`.

6. **Achado #1 do relatório anterior (`API.md` dizia "armazenados em memória") está corrigido.**
   `API.md:799` agora diz: *"Os dados são persistidos em um banco SQLite local (`tasks.db`) via
   `better-sqlite3` — não são perdidos ao reiniciar o servidor."* Confirmado na prática: subi o
   servidor real (`node server.js`), criei uma tarefa (`id: 10`), e ela já existia de uma execução
   anterior à desta sessão (evidência de persistência real entre reinicializações).

7. **Achado #2 do relatório anterior (`CLAUDE.md` se contradizia sobre a camada de dados) está
   corrigido.** A seção "Architecture" (`CLAUDE.md:136-148`) não menciona mais "In-memory array";
   agora descreve corretamente `app.js`, `server.js`, e a "Data Layer" com `services/task-service.js`
   rodando SQL via `better-sqlite3` contra `tasks.db`, com link cruzado para a seção "State &
   Persistence" — consistente entre si e com o código (`services/db.js`, `services/task-service.js`).

8. **Achado #8 do relatório anterior (Project Structure/`server.js` desatualizados) está
   corrigido.** `CLAUDE.md:101-126` agora lista `app.js`, `services/db.js`, `tests/` e `audits/` na
   árvore, e descreve corretamente a divisão de responsabilidades: `app.js` faz "Express app
   initialization, middleware setup, route mounting" e `server.js` apenas "Starts the HTTP server
   (`app.listen`)". Isso bate exatamente com o código real: `app.js:1-15` (setup do Express) e
   `server.js:1-7` (só `require('./app')` + `app.listen`).

9. **Achado #9 do relatório anterior (seção "Testing" não mencionava Jest) está corrigido.**
   `CLAUDE.md:190-196` adicionou a subseção "Automated tests (Jest)" com `npm test`, e descreve
   corretamente que `app.js` exporta o Express app sem chamar `.listen()` para uso com `supertest`,
   e que `services/db.js` é mockado com SQLite em memória nos testes de rota — **confirmado
   lendo `tests/task-routes.test.js:1-27`**, que de fato usa `jest.mock('../services/db', ...)`
   com `new Database(':memory:')`, nunca o `tasks.db` real.

10. **`npm test` roda limpo e com cobertura ampliada**: `3 suítes, 126 testes, todos passando`
    (`Test Suites: 3 passed, 3 total`, `Tests: 126 passed, 126 total`) — acima dos 92 testes da
    auditoria anterior, refletindo os novos casos de validação de `isCompleted`, `id` malformado e
    tags.

11. **Demais itens confirmados corretos na auditoria anterior continuam corretos**: os 10
    endpoints batem com `routes/task-routes.js:6-15`; ordem de rotas evita shadowing de `:id`;
    formato de erro `{ "error": "..." }` consistente em todos os `catch` de
    `controllers/task-controller.js`; campos imutáveis `id`/`createdAt` rejeitados com a mensagem
    exata no PUT (`controllers/task-controller.js:103-105`); valores padrão de criação
    (`services/task-service.js:19-30`) batem com o Data Model.

---

## ⚠️ Inconsistências encontradas

1. **Novo bug funcional: `PUT /api/tasks/:id` com `description: 0` ou `description: false` quebra
   com `500` em vez de validar/aceitar corretamente — mesma classe de bug do achado #3 anterior,
   só que não foi coberta no caminho de atualização.** Causa raiz:
   `utils/validators.js:20-23` (`validateDescription`) tem `if (!description) { return {
   isValid: true }; }` **antes** da checagem `typeof description !== 'string'` (linha 25). Isso
   faz com que valores falsy-mas-não-string (`0`, `false`, `NaN`) passem a validação como válidos
   sem nunca passar pela checagem de tipo. Em `validateUpdateTask`
   (`utils/validators.js:93-98`), `validateDescription` é chamada incondicionalmente sempre que
   `body.description !== undefined` — diferente de `validateCreateTask`
   (`utils/validators.js:54-59`), que só chama `validateDescription` dentro de um guard
   `if (body.description)`, o que mascara o problema na criação (valores falsy viram `''` sem
   nunca chegar em `.trim()`, ver `services/task-service.js:21`). No update,
   `services/task-service.js:66-69` (`updateById`) chama `updates.description.trim()`
   incondicionalmente quando `updates.description !== undefined`, e `(0).trim`/`(false).trim` não
   existem → `TypeError` capturado pelo `catch` genérico de
   `controllers/task-controller.js:119-121` → `500 {"error":"Erro ao atualizar tarefa"}`.
   **Reproduzido ao vivo**:
   - `PUT /api/tasks/10 {"description":0}` → `500 {"error":"Erro ao atualizar tarefa"}`
   - `PUT /api/tasks/10 {"description":false}` → `500 {"error":"Erro ao atualizar tarefa"}`
   - Por comparação, `POST /api/tasks {"title":"t3","description":0}` → `201` (caminho de criação
     não quebra, pois o guard `if (body.description)` evita chamar `.trim()` em valor falsy).
   Não há nenhum teste cobrindo este caso: `grep -rn "validateDescription" tests/` não retornou
   nenhuma ocorrência — a suíte de 126 testes não exercita `validateDescription` isoladamente nem
   o cenário de `description` falsy-não-string no PUT.

2. **A Skill `add-endpoint` documenta um padrão de validação de `id` desatualizado que, se
   seguido, reintroduziria o bug de ID malformado já corrigido no código real (achado #4 da
   auditoria anterior).** `.claude/skills/add-endpoint/SKILL.md:66` instrui: *"Validar `id` de
   path params: `parseInt(id); if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.
   Use um número inteiro.' })`"* — este é exatamente o padrão `parseInt`+`isNaN` que foi
   substituído no código real por `validateId()` (`utils/validators.js:176-184`, regex
   `^\d+$`), usado consistentemente em todos os handlers atuais
   (`controllers/task-controller.js:75,96,126,147,173`) precisamente porque `parseInt("7abc")`
   retorna `7` em vez de `NaN`, aceitando IDs malformados silenciosamente. A Skill não foi
   atualizada para referenciar o helper `validateId()` compartilhado — ela ainda descreve a
   validação inline com o bug que a correção eliminou. Um agente futuro que seguir a Skill
   literalmente para criar um novo endpoint com parâmetro `:id` reintroduziria o mesmo defeito
   (aceitar `"7abc"` como `7`) em código novo, mesmo com o resto da base já corrigida.

3. **Observação menor (não é violação de contrato documentado, mas é inconsistência interna):**
   o limite de tamanho do `title` agora é validado sobre a string *trimada*
   (`utils/validators.js:13`, corrigido conforme achado #5), mas o limite de `description`
   continua validado sobre a string *crua*, sem trim
   (`utils/validators.js:33`: `description.length > MAX_DESCRIPTION_LENGTH`, antes de qualquer
   `.trim()`). `API.md:31` diz apenas "Máximo 2000 caracteres" para `description`, sem
   especificar se é antes ou depois do trim — portanto isso não contradiz o texto documentado
   hoje, mas é uma assimetria de comportamento entre dois campos que a documentação trata de forma
   paralela ("Trimagem automática" no item 1 de "Notas Importantes", `API.md:796`, sem
   diferenciar `title` de `description`). Vale decidir e documentar explicitamente.

---

## 📋 Recomendação final

**As 9 inconsistências da auditoria anterior foram de fato resolvidas** — cada uma foi
reconferida de forma independente nesta sessão (leitura de código, `npm test` com 126/126 testes
passando, e chamadas `curl` reais contra o servidor) e nenhuma delas persiste no comportamento
atual do código ou da documentação.

Porém, o processo de correção introduziu (ou deixou exposta) uma variante do mesmo bug já
corrigido, e um novo tipo de risco de regressão via Skill desatualizada:

1. **Alta prioridade / bug funcional real**: corrigir `validateDescription`
   (`utils/validators.js:20-38`) para checar `typeof description !== 'string'` **antes** do early
   return `if (!description)`, ou trocar a condição para `if (description === undefined ||
   description === null || description === '')` — de forma que `0`/`false`/`NaN` sejam
   rejeitados como tipo inválido em vez de silenciosamente aceitos e depois quebrarem em
   `.trim()` no `PUT`. Adicionar teste de regressão explícito cobrindo `PUT` com `description`
   falsy-não-string (análogo ao que já existe para `dueDate` não-string).
2. **Média prioridade / risco de regressão futura**: atualizar
   `.claude/skills/add-endpoint/SKILL.md:66` para referenciar o helper `validateId()` de
   `utils/validators.js` em vez do padrão inline `parseInt`+`isNaN`, para que novos endpoints
   criados via essa Skill não reintroduzam o bug de IDs malformados já corrigido no restante da
   base.
3. **Baixa prioridade / consistência de documentação**: decidir e documentar explicitamente se o
   limite de 2000 caracteres de `description` deve ser aplicado antes ou depois do trim (hoje é
   antes, ao contrário de `title`, que já foi corrigido para ser depois do trim), e ajustar
   `utils/validators.js:33` ou o texto do `API.md` para eliminar a assimetria.
