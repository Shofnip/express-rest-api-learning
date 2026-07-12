---
name: add-field
description: Adiciona um novo campo ao Data Model de tarefa da API — validação em utils/validators.js, inicialização/atualização em services/task-service.js e atualização em TODOS os endpoints do API.md. Não requer CLAUDE.md.
when_to_use: Disparar quando o usuário pedir para "adicionar um campo", "adicionar um atributo à tarefa", "incluir uma nova propriedade no modelo de dados", ou equivalente para este projeto de tarefas.
---

Você vai adicionar um novo campo ao modelo de dados de tarefa. Este processo é **obrigatório em todas as etapas**, sem exceção — nenhuma etapa pode ser pulada.

## Padrões do Projeto

**Estrutura em camadas:**
- `services/task-service.js` — Inicialização e atualização de campos
- `utils/validators.js` — Validações (retorna `{ isValid: boolean, error?: string }`)
- `API.md` — Documentação em TODOS os endpoints

**Convenções:**
- Nomes técnicos: sempre em inglês
- Mensagens de erro: português
- Sempre `async/await`, nunca `.then()`
- Comentários: só quando o "porquê" não for óbvio

**Data Model atual:**
```javascript
{
  id: number,                    // Auto-incrementado
  title: string,                 // Obrigatório, max 255 chars
  description: string,           // Opcional, max 2000 chars, padrão: ""
  completed: boolean,            // Opcional, padrão: false
  dueDate: ISO8601 string,       // Opcional, padrão: null
  priority: string,              // Opcional: 'low'|'medium'|'high', padrão: null
  tags: string[],                // Opcional, max 10 tags, cada max 50 chars, padrão: []
  createdAt: ISO8601 string      // Auto-setado, não editável
}
```

**Respostas de erro:**
```json
{ "error": "mensagem em português" }
```
- HTTP 400: validação/dados inválidos
- HTTP 404: recurso não encontrado
- HTTP 500: erro de servidor

## 1. Reunir as informações necessárias

Se o usuário não informou, pergunte antes de prosseguir:

1. **Nome do campo** — em `camelCase`, em inglês (ex: `priority`, `tags`, `assignee`)
2. **Tipo de dado** — `string`, `number`, `boolean`, ISO 8601, enum, array, etc.
3. **Obrigatório?** — sim ou não. Se sim, em qual(is) endpoint(s).
4. **Valor padrão** — usado quando opcional e não informado (ex: `null`, `''`, `false`, `[]`)
5. **Validação específica?** — tamanho máximo, formato, valores permitidos
6. **Atualizável?** — via `PUT /api/tasks/:id` ou endpoint dedicado (ex: PATCH `/due-date`)?

## 2. Checklist de implementação (nesta ordem, sem exceção)

### 2.1. services/task-service.js — Inicialização e atualização

**Em `save()`:**
- Adicionar campo ao objeto `newTask` com o valor padrão definido

**Em `updateById()` (se atualizável via PUT):**
- Adicionar bloco `if (updates.<campo> !== undefined) { task.<campo> = ...; }`
- Incluir `.trim()` se for string
- Replicar padrão dos campos existentes

**Se endpoint dedicado (ex: PATCH próprio):**
- Usar skill `add-endpoint` para essa parte

### 2.2. utils/validators.js — Validação (se houver restrições)

- Criar função `validateXxx(value)` retornando `{ isValid: boolean, error?: string }`
- Mensagens em português, tom consistente com validações existentes
- Conectar em:
  - `validateCreateTask()` — se aceito/obrigatório na criação
  - `validateUpdateTask()` — se atualizável via PUT (chamar só quando `body.<campo> !== undefined`)
- Se sem validação além de tipo trivial (ex: booleano simples), não criar função nova

### 2.3. controllers/task-controller.js

- Só alterar se precisar chamar validação nova em handler existente (`create`/`update`)
- Se endpoint dedicado, usar skill `add-endpoint`
- Não adicionar lógica de negócio

### 2.4. API.md — Atualizar TODOS os endpoints, sem exceção

Revisar **cada seção** explicitamente:

1. **Data Model** (final) — sempre atualizar
2. **POST /api/tasks** — adicionar em "Parâmetros" se aceito na criação; adicionar no JSON de resposta; adicionar erro 400 se houver validação
3. **GET /api/tasks** — atualizar JSON de exemplo (lista)
4. **GET /api/tasks/status/:status** — atualizar JSON de exemplo
5. **GET /api/tasks/:id** — atualizar JSON de exemplo
6. **PUT /api/tasks/:id** — se atualizável: adicionar em "Parâmetros", JSON, erro 400; se não: adicionar nota junto aos campos imutáveis
7. **PATCH /api/tasks/:id/complete** — atualizar JSON de resposta
8. **PATCH /api/tasks/:id/due-date** — atualizar JSON de resposta
9. **DELETE /api/tasks/:id** — atualizar JSON de resposta (dentro de `task`)
10. **GET /api/tasks/count** — se aplicável, atualizar
11. **GET /api/tasks/priority/:priority** — se aplicável, atualizar
12. **Seção "Data Model"** — documentar o campo com seu tipo, obrigatoriedade e padrão

Se campo tiver endpoint dedicado novo:
- Documentar seguindo padrão de `add-endpoint`
- Renumerar seções se inserido no meio; se anexado ao final, ajustar numeração antes de "Códigos de Status HTTP"

**Verificação final:** Fazer `grep` por `"id":`, `"title":`, etc. em `API.md` para confirmar que todos os blocos JSON de tarefa têm o novo campo.

### 2.5. teste.http (recomendado)

Sugerir exemplos cobrindo:
- Criação com o campo
- Criação sem o campo (valor padrão)
- Atualização do campo (se aplicável)
- Erro de validação (se houver)

## 3. Depois de implementar

Apresente checklist confirmando cada etapa (2.1–2.5), listando **cada endpoint do API.md** revisado/atualizado — essa é a parte mais fácil de deixar incompleta.
