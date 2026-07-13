# Auditoria — Terceira Verificação Independente (2026-07-13)

Terceira rodada de auditoria desta sessão, reconferindo de forma independente os 3 achados da
segunda rodada (`audits/auditoria-pos-correcoes.md`) — que por sua vez já haviam confirmado as 9
correções da primeira rodada (`audits/auditoria-retroativa.md`) — contra o estado atual do
código, `npm test` e chamadas `curl` reais contra o servidor. Nenhum arquivo de código-fonte foi
alterado nesta sessão (apenas leitura, testes e este relatório).

## ✅ O que está correto

1. **Achado #1 da rodada anterior (bug de `validateDescription` com `0`/`false` quebrando o `PUT`
   com `500`) está corrigido.** `utils/validators.js:20-38` agora restringe o "early return de
   vazio" a `description === undefined || description === null || description === ''`
   (linha 21) — valores falsy-mas-não-string como `0`/`false` caem na checagem
   `typeof description !== 'string'` (linha 25) e são rejeitados com `400`. O guard em
   `validateCreateTask` (linha 54) também foi apertado de `if (body.description)` para
   `if (body.description !== undefined && body.description !== null)`, fechando a mesma lacuna no
   caminho de criação. **Confirmado ao vivo** contra o servidor real (`node server.js`, PID
   capturado e encerrado ao final):
   - `PUT /api/tasks/16 {"description":0}` → `400 {"error":"A descrição deve ser um texto"}`
     (antes: `500`)
   - `PUT /api/tasks/16 {"description":false}` → `400 {"error":"A descrição deve ser um texto"}`
   - `POST /api/tasks {"title":"t","description":0}` → `400` (antes era `201` com o guard antigo)
   - Reproduzido também diretamente via `node -e` chamando `validateCreateTask`/`validateUpdateTask`
     com `description: 0` e `description: false` → ambos retornam
     `{"isValid":false,"error":"A descrição deve ser um texto"}` nos dois caminhos.
   - Cobertura de regressão existe em `tests/validators-extra.test.js` (`test.each([0, false])`,
     dois blocos — criação e update) e em `tests/task-routes.test.js` (`test.each([0, false])`
     no describe de `PUT /api/tasks/:id`), confirmada via leitura direta dos arquivos.
   - A mensagem `"A descrição deve ser um texto"` está documentada em `API.md:87-92` (seção POST)
     e `API.md:385-390` (seção PUT).

2. **Achado #2 da rodada anterior (Skill `add-endpoint` desatualizada, instruindo
   `parseInt`+`isNaN` para `:id`) está corrigido.** `.claude/skills/add-endpoint/SKILL.md:66` hoje
   diz: *"Validar `id` de path params com `validateId(req.params.id)`
   (`utils/validators.js`) — usa regex `^\d+$` sobre a string bruta, não `parseInt`/`isNaN` (que
   aceitam sufixos não-numéricos como `"7abc"`)"*. Isso bate com o comportamento real do código
   (`controllers/task-controller.js:75,96,126,147,173`, todos usando `validateId`). Confirmado
   por leitura direta do arquivo da Skill.

3. **Achado #3 da rodada anterior (assimetria: `title` validado pós-trim, `description`
   pré-trim) está corrigido.** `utils/validators.js:33` agora usa
   `description.trim().length > MAX_DESCRIPTION_LENGTH`, simétrico ao `title`
   (`utils/validators.js:13`). `API.md:31` e `API.md:319` foram atualizados para dizer
   explicitamente "Máximo 2000 caracteres **após trim**". Confirmado ao vivo: uma descrição com
   1995 `"a"` + 10 espaços à direita (2005 caracteres brutos, 1995 após trim) foi aceita com
   `201` — comportamento coerente com o texto documentado. Também confirmado por teste dedicado
   em `tests/validators-extra.test.js` ("aceita descrição que só excede 2000 caracteres por
   espaços à direita").

4. **Nenhuma das 9 inconsistências das rodadas 1 e 2 regrediu.** Reconferido por amostragem viva
   contra o servidor real: IDs malformados (`GET /api/tasks/7abc` → `400
   {"error":"ID inválido. Use um número inteiro."}`), `isCompleted` não-booleano
   (`POST {"title":"t","isCompleted":"yes"}` → `400`), campos imutáveis no PUT
   (`PUT /api/tasks/15 {"id":99}` → `400 {"error":"Não é permitido atualizar id ou
   createdAt."}`), `GET /api/tasks/count?status=completed` → `200 {"count":1}`,
   `GET /api/tasks/priority/high` → `200 []`, `GET /api/tasks/status/bogus` → `400`. Todos batem
   com `API.md`.

5. **Persistência SQLite e schema seguem consistentes** entre `CLAUDE.md` ("State &
   Persistence"), `services/db.js:8-19` (colunas `title, description, is_completed, due_date,
   priority, tags, created_at`) e `services/task-service.js:3-12` (`rowToTask`), sem divergência
   de nomes ou tipos.

6. **`npm test` roda limpo**: `Test Suites: 3 passed, 3 total`, `Tests: 133 passed, 133 total`
   (acima dos 126 da rodada anterior, refletindo os 7 novos testes de regressão do commit
   `67f95c7`).

7. **Demais validadores auxiliares testados diretamente não apresentam a mesma classe de bug**
   (checagem de tipo ausente antes de operação que quebra): `validatePriority`, `validateTags`,
   `validateStatus` e `validateId` foram exercitados via `node -e` com entradas não-string/falsy
   (`0`, `null`, array com `null`, string com espaço) e todos retornaram erros de validação
   coerentes (`400`), sem lançar exceção.

8. **Working tree do git permanece limpo** (`git status` → "nothing to commit, working tree
   clean") — as correções da rodada 2 já estavam commitadas (`67f95c7`) antes desta auditoria
   começar, e esta sessão não alterou nenhum arquivo de código.

---

## ⚠️ Inconsistências encontradas

Nenhuma inconsistência nova foi encontrada nesta rodada, e nenhum dos 3 achados anteriores
persiste no código ou na documentação atual.

---

## 📋 Recomendação final

As 3 inconsistências apontadas em `audits/auditoria-pos-correcoes.md` (bug de `validateDescription`
com `0`/`false`, Skill `add-endpoint` desatualizada, e assimetria de trim entre `title`/`description`)
foram corrigidas no commit `67f95c7` e foram reconferidas de forma independente nesta terceira
rodada — via leitura de código, `npm test` (133/133 passando) e chamadas `curl` reais contra o
servidor (subido e encerrado dentro desta sessão) — sem que nenhuma delas persista.

Nenhum achado novo foi identificado nesta rodada: os demais validadores (`validatePriority`,
`validateTags`, `validateStatus`, `validateId`) foram testados diretamente contra entradas
falsy/não-string análogas às que causaram o bug de `validateDescription`, e nenhum apresenta o
mesmo padrão de falha. A documentação (`CLAUDE.md`, `API.md`, `.claude/rules/api-design.md`,
Skills `add-endpoint`/`add-field`) permanece consistente com o comportamento real do código.

Não há pendências de auditoria nesta rodada. Recomenda-se apenas o processo padrão: se novos
campos/endpoints forem adicionados no futuro, reconferir se eles seguem o mesmo cuidado de
checagem de tipo (`typeof === 'string'`) antes de qualquer `.trim()`/operação que assuma o tipo,
já que esse foi o padrão de bug recorrente nas três rodadas anteriores.
