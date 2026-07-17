# DESIGN.md — Painel de Tarefas

Documento de design da interface web da Task API (Node.js + Express + SQLite).
Cobre duas telas: **Listagem** (`/`) e **Criação/Edição** (modal sobre a listagem).

Referência de implementação: `painel-tarefas.jsx` (protótipo React com API mockada).

---

## 1. Princípios

1. **A UI espelha o contrato da API.** Cada campo do formulário mapeia 1:1 para uma
   propriedade do modelo; cada regra de validação inline replica uma regra do backend.
   O front nunca aceita o que o backend rejeitaria.
2. **Baixa fadiga visual.** Nenhum branco puro, nenhum preto puro, nenhuma cor saturada.
   A tela é feita para sessões longas de triagem de backlog.
3. **Sinalizar, não alarmar.** Status (concluída/atrasada) usa fundos quase imperceptíveis.
   O que precisa de leitura rápida — prioridade, contagem de atrasadas — recebe contraste.
4. **Separação de responsabilidades.** A listagem cuida do *status*; o formulário cuida do
   *conteúdo*. Os dois não se sobrepõem.

---

## 2. Fundamentos visuais

### 2.1 Paleta

Todas as cores vivem no objeto `T` no topo do componente. Na migração para produção,
esse objeto vira CSS custom properties (`--color-page-bg`, etc.).

| Token | Hex | Uso |
|---|---|---|
| `pageBg` | `#ECEAE2` | Fundo da página (cinza-areia) |
| `card` | `#FAF8F1` | Superfície de cards, inputs e modal (marfim) |
| `border` | `#DDD9CC` | Bordas de cards e divisores |
| `inputBorder` | `#CBC6B7` | Bordas de inputs e botões secundários |
| `ink` | `#3E4146` | Títulos e valores em destaque |
| `text` | `#6C6A61` | Corpo de texto, labels de filtro |
| `muted` | `#98948A` | Metadados, contadores, placeholders |
| `accent` | `#8A6A55` | Ação primária (terracota amadeirado) |
| `accentBorder` | `#6B4A3A` | Borda da ação primária |
| `danger` | `#A85A4B` | Erros de validação, texto de atraso |
| `warn` | `#8A6A2F` | Prazos próximos, limite de tags atingido |
| `check` | `#6E9C87` | Checkbox de conclusão (sálvia) |
| `readOnlyBg` | `#EFECE2` | Campos não editáveis, chips de tag |

**Fundos de status** (deliberadamente fracos — sinalizam sem dominar):

| Estado | Fundo | Borda |
|---|---|---|
| Concluída | `#F0F5EC` (verde aquecido) | `#D9E3D2` |
| Atrasada (pendente + prazo vencido) | `#F8F0EA` (terroso) | `#EADACE` |
| Normal | `#FAF8F1` | `#DDD9CC` |

### 2.2 Prioridade

Cada nível tem quatro valores: barra lateral, fundo do chip, texto do chip, borda do chip.

| Valor da API | Rótulo | Barra / Borda | Fundo chip | Texto chip |
|---|---|---|---|---|
| `"high"` | ALTA | `#C96A5C` | `#F2DEDA` | `#84392E` |
| `"medium"` | MÉDIA | `#C99C4E` | `#F0E5CC` | `#6F521C` |
| `"low"` | BAIXA | `#6E9C87` | `#E0EBE1` | `#39604E` |
| `null` | SEM PRIORIDADE | `#C2BDAE` | `#EAE7DC` | `#6C6A61` |

`null` é um estado de primeira classe, com rótulo próprio — nunca um espaço vazio.

### 2.3 Tipografia

- Família: **Sora**, fallback `ui-sans-serif, system-ui, sans-serif`.
- Título da página: 24px / bold / `ink`.
- Eyebrow do cabeçalho: 12px / semibold / uppercase / tracking largo / `muted`.
- Título do card e do modal: 16–18px / semibold–bold / `ink`.
- Corpo e descrição: 14px / regular / `text`.
- Metadados, contadores, erros: 12px / medium.
- Números (contadores, IDs, paginação) usam `tabular-nums` para não dançar entre renders.

### 2.4 Forma e espaço

- Raio: `12px` (cards), `16px` (modal), `8px` (inputs, botões), `full` (chips).
- Container: máx. `768px`, centralizado, padding `32px` vertical.
- Espaço entre cards: `12px`. Entre campos do formulário: `20px`.
- Elevação: cards sem sombra em repouso, sombra leve no hover. Só o modal tem sombra forte.

---

## 3. Tela 1 — Listagem

### 3.1 Estrutura

```
┌─ TASK API · PAINEL DE GESTÃO ─────────────────────────┐
│ Minhas tarefas      9 pendentes  2 atrasadas [+ Nova] │
├───────────────────────────────────────────────────────┤
│ Status ▾   Prioridade ▾   Por página ▾                │
├───────────────────────────────────────────────────────┤
│ ▌☐ Título da tarefa                  [ALTA]  [✎]      │
│    Descrição em duas linhas no máximo…                │
│    ⚠ 14 jul · atrasada há 2 d   [tag] [tag]      #5   │
├───────────────────────────────────────────────────────┤
│ Total de 14 tarefas · página 1 de 3   [←][1][2][3][→] │
└───────────────────────────────────────────────────────┘
```

### 3.2 Cabeçalho

- **Eyebrow + título** à esquerda.
- **Contadores** de pendentes e atrasadas. O de atrasadas fica `danger` quando > 0 e
  `muted` quando zero — a ausência de problema não deve chamar atenção.
- **Botão "+ Nova tarefa"**: única ação primária da tela. Fundo `accent`, texto
  `#FBF9F3`, bold, ícone "+", sombra `0 2px 6px rgba(107,74,58,.28)`, elevação de 1px
  no hover. É o único elemento colorido fora da escala de cinzas quentes.

### 3.3 Filtros

Três selects que mapeiam para query params: `status` → `?isCompleted=`,
`priority` → `?priority=`, `limit` → `?limit=`. Qualquer mudança **reseta `page` para 1**
(evita cair numa página inexistente do novo conjunto).

### 3.4 Card de tarefa

| Elemento | Comportamento |
|---|---|
| Barra lateral | 4px, cor da prioridade, reforço secundário |
| Checkbox | Alterna `isCompleted` → `PATCH /api/tasks/:id`. Sálvia quando marcado |
| Título | `line-through` + opacidade 0.85 quando concluída |
| Chip de prioridade | Uppercase, bold, tracking `.04em`, borda colorida — âncora visual |
| Botão editar (✎) | Abre o modal em modo edição |
| Descrição | Opcional; omitida se `description === ''` |
| Prazo | Relativo e contextual (ver abaixo) |
| Tags | Chips neutros, ordem da API preservada |
| ID | `#{id}`, alinhado à direita, `muted` |

**Lógica de prazo** (`dueInfo`):

| Condição | Exibição | Cor |
|---|---|---|
| `dueDate === null` | "Sem prazo" | `muted` |
| Concluída | Só a data | `muted` |
| Vencido | "14 jul · atrasada há 2 d" + ⚠ | `danger` |
| Vence hoje | "16 jul · vence hoje" | `warn` |
| ≤ 7 dias | "22 jul · em 6 d" | `warn` |
| > 7 dias | "04 ago" | `muted` |

Concluída sempre neutraliza o prazo: uma tarefa entregue com atraso não é mais um problema.

### 3.5 Estados

- **Carregando**: 3–5 skeletons com a altura real do card. Sem spinner, sem layout shift.
- **Vazio**: card tracejado, "Nenhuma tarefa com esses filtros. Ajuste os filtros acima
  ou crie uma nova tarefa." Distingue "não há nada" de "seu filtro não achou nada".
- **Paginação**: "Total de **14** tarefas · página 1 de 3" (14px, total em bold `ink`),
  botões anterior/próxima com `disabled` nos extremos, página atual em grafite sólido.

---

## 4. Tela 2 — Criação / Edição

Modal centrado sobre a listagem, máx. `576px`, overlay `rgba(62,65,70,.4)`.
Fecha por clique no overlay ou "Cancelar". Um só componente serve aos dois modos —
`task == null` significa criação.

### 4.1 Diferenças entre modos

| | Criação | Edição |
|---|---|---|
| Título | "Nova tarefa" | "Editar tarefa" |
| Subtítulo | "Só o título é obrigatório — o resto é opcional." | "Os campos gerados pelo sistema não podem ser alterados." |
| Bloco `id` / `createdAt` | Ausente | Visível, não editável |
| Botão primário | "Criar tarefa" | "Salvar alterações" |
| Requisição | `POST /api/tasks` | `PATCH /api/tasks/:id` |

### 4.2 Campos gerados pelo sistema (só em edição)

`id` e `createdAt` aparecem lado a lado no topo, antes dos campos editáveis:
fundo `readOnlyBg`, borda `border`, texto `text`, `cursor: not-allowed`, sem label `*`.
`createdAt` é formatado em pt-BR com o ISO 8601 completo no `title` do elemento.

O contraste é a mensagem: campos editáveis são marfim sobre a página; campos de sistema
são acinzentados. Nenhum `<input disabled>` — não são inputs, são leitura.

### 4.3 Campos editáveis

| Campo | Controle | Regras |
|---|---|---|
| `title` | text, obrigatório (`*` em `danger`) | ≤ 255 após trim, contador ao vivo |
| `description` | textarea 3 linhas, redimensionável | ≤ 2000 após trim, contador ao vivo |
| `priority` | select | "Sem prioridade" (`""` → `null`), Baixa, Média, Alta |
| `dueDate` | `<input type="date">` | Opcional; `""` → `null` |
| `tags` | input + Enter/botão | ≤ 10 tags, ≤ 50 chars cada, sem duplicatas |

**`isCompleted` não aparece no formulário.** O status é responsabilidade exclusiva do
checkbox do card. Em edição, o payload preserva o valor atual (`isCompleted: editing ?
task.isCompleted : false`) — sem isso, salvar uma edição reverteria uma tarefa concluída.

### 4.4 UI de tags

Digitar + Enter (ou botão "Adicionar") cria um chip com "×" para remover.
Contador `n/10` fica `warn` ao atingir o teto. Três erros distintos:

- `> 50 chars`: "Cada tag tem no máximo 50 caracteres (63 no momento)."
- Duplicada: "A tag \"backend\" já foi adicionada."
- Teto: "Limite de 10 tags atingido. Remova uma para adicionar outra."

### 4.5 Validação

`validateTask(values)` é uma função pura, isolada dos componentes — deve ser extraída
para um módulo compartilhado com o backend, onde alimenta o `422`.

| Campo | Regra | Mensagem |
|---|---|---|
| `title` | Não vazio após trim | "O título é obrigatório." |
| `title` | ≤ 255 após trim | "O título passou do limite de 255 caracteres (X no momento)." |
| `description` | ≤ 2000 após trim | "A descrição passou do limite de 2000 caracteres (X no momento)." |
| `tags` | ≤ 10 | "Máximo de 10 tags por tarefa." |

**Comportamento:**
- Validação roda **no submit**, não a cada tecla. Não se acusa erro em campo inacabado.
- Erro aparece inline abaixo do campo: 12px, `danger`, ícone circular, `role="alert"`,
  `aria-invalid` no input, borda do input em `danger`.
- O erro **limpa ao editar o campo** — corrigir já é sinal de intenção.
- Contadores de caracteres ficam `danger` ao estourar, antes mesmo do submit.

### 4.6 Normalização do payload

O que o formulário envia difere do que ele coleta:

```js
{
  title: values.title.trim(),
  description: values.description.trim(),        // '' quando vazio, nunca null
  priority: values.priority || null,             // '' → null
  tags: values.tags,
  dueDate: values.dueDate ? `${values.dueDate}T23:59:00Z` : null,  // YYYY-MM-DD → ISO
  isCompleted: editing ? task.isCompleted : false,
}
```

**Ponto em aberto:** `<input type="date">` só captura o dia, então o horário é fixado em
`23:59:00Z`. Se o produto exigir prazo com hora, trocar por `datetime-local` e resolver a
conversão de fuso (a UI exibe local, a API persiste UTC).

---

## 5. Acessibilidade

- Todo controle só-ícone tem `aria-label` (checkbox, editar, remover tag).
- Inputs com erro: `aria-invalid`, mensagem com `role="alert"`.
- Lista com `aria-busy` durante o carregamento.
- Modal com `role="dialog"`, `aria-modal`, `aria-label`.
- Enter adiciona tag sem submeter o formulário (`preventDefault`).
- Cor nunca é o único sinal: atraso tem ⚠ e texto; conclusão tem line-through e checkbox;
  prioridade tem rótulo textual.

**Pendências conhecidas:** foco não é aprisionado no modal; Esc não fecha; o foco não
retorna ao gatilho ao fechar. Resolver antes de produção.

---

## 6. Notas de implementação

- **Mock isolado**: `fetchTasks()` e `saveTask()` no topo do arquivo, com delay artificial
  (380ms / 420ms) para que skeletons e estado "Salvando…" sejam exercitados. Trocar por
  `fetch()` real não deve tocar em nenhum componente.
- **Estado do painel**: `page`, `limit`, `status`, `priority` e `form`. `form === null`
  fecha o modal; `{task: null}` cria; `{task}` edita.
- **Após salvar**: modal fecha e a listagem recarrega (`load()`), recalculando a paginação.
- **"Hoje" fixo**: `new Date("2026-07-16T12:00:00Z")` está hardcoded para o protótipo
  mostrar atrasos de forma estável. **Substituir por `new Date()` em produção.**
- **Tokens centralizados**: `T`, `PRIORITY` e `LIMITS` no topo. `LIMITS` deve ser
  importado do mesmo módulo que o backend usa, não redeclarado.
