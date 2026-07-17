import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// MOCK DA API — simula GET /api/tasks, POST /api/tasks e PATCH /api/tasks/:id
// Quando a API real existir, basta trocar fetchTasks/saveTask por fetch() de
// verdade: formatos de request/response já espelham o contrato planejado.
// ---------------------------------------------------------------------------

const DB = [
  { id: 1,  title: "Configurar migrations do SQLite", description: "Criar tabela tasks com índices em isCompleted e dueDate. Avaliar better-sqlite3 vs node:sqlite.", isCompleted: true,  priority: "high",   tags: ["backend", "banco de dados"], dueDate: "2026-07-02T23:59:00Z", createdAt: "2026-06-20T14:12:00Z" },
  { id: 2,  title: "Validação do payload de criação", description: "Trim em title/description, limite de 255/2000 chars, máx 10 tags de 50 chars. Retornar 422 com detalhes por campo.", isCompleted: true,  priority: "high",   tags: ["backend", "validação"], dueDate: "2026-07-05T23:59:00Z", createdAt: "2026-06-21T09:30:00Z" },
  { id: 3,  title: "Endpoint de listagem paginada", description: "GET /api/tasks com page e limit. Responder { data, page, limit, total, totalPages }. Limit máximo de 100.", isCompleted: true,  priority: "medium", tags: ["backend", "api"], dueDate: null, createdAt: "2026-06-22T11:00:00Z" },
  { id: 4,  title: "Filtro por status e prioridade na API", description: "Query params ?isCompleted= e ?priority=. Combinar com paginação sem quebrar o total.", isCompleted: false, priority: "medium", tags: ["backend", "api"], dueDate: "2026-07-18T23:59:00Z", createdAt: "2026-06-25T16:45:00Z" },
  { id: 5,  title: "Testes de integração dos endpoints", description: "Cobrir CRUD completo com supertest + banco em memória. Casos de erro: 404, 422, limite de tags.", isCompleted: false, priority: "high",   tags: ["testes", "backend"], dueDate: "2026-07-14T23:59:00Z", createdAt: "2026-06-26T10:20:00Z" },
  { id: 6,  title: "Documentar API no README", description: "Tabela de endpoints, exemplos de request/response e códigos de erro.", isCompleted: false, priority: "low",    tags: ["docs"], dueDate: "2026-07-30T23:59:00Z", createdAt: "2026-06-27T08:05:00Z" },
  { id: 7,  title: "Rate limiting básico", description: "express-rate-limit com 100 req/min por IP nas rotas de escrita.", isCompleted: false, priority: null,     tags: ["backend", "segurança"], dueDate: null, createdAt: "2026-06-28T13:40:00Z" },
  { id: 8,  title: "Ordenação por dueDate e createdAt", description: "Query param ?sort=dueDate|-createdAt. Nulls de dueDate vão pro fim.", isCompleted: false, priority: "medium", tags: ["backend", "api"], dueDate: "2026-07-22T23:59:00Z", createdAt: "2026-06-30T17:10:00Z" },
  { id: 9,  title: "Tratar timezone das datas no front", description: "Exibir dueDate no fuso local mas persistir sempre em UTC (ISO 8601).", isCompleted: false, priority: "low",    tags: ["frontend", "datas"], dueDate: "2026-07-12T23:59:00Z", createdAt: "2026-07-01T09:55:00Z" },
  { id: 10, title: "Soft delete de tarefas", description: "Coluna deletedAt em vez de DELETE físico. Excluir deletadas da listagem padrão.", isCompleted: false, priority: null,     tags: ["backend", "banco de dados"], dueDate: null, createdAt: "2026-07-02T12:00:00Z" },
  { id: 11, title: "Busca por texto no título", description: "?q= com LIKE case-insensitive. Avaliar FTS5 do SQLite se a base crescer.", isCompleted: false, priority: "low",    tags: ["backend", "api", "busca"], dueDate: "2026-08-04T23:59:00Z", createdAt: "2026-07-03T15:25:00Z" },
  { id: 12, title: "CI com lint e testes no GitHub Actions", description: "Workflow rodando eslint + testes em push e PR para main.", isCompleted: true,  priority: "medium", tags: ["devops", "ci"], dueDate: "2026-07-08T23:59:00Z", createdAt: "2026-07-04T10:15:00Z" },
  { id: 13, title: "Padronizar respostas de erro", description: "Middleware único: { error: { code, message, details } }. Nunca vazar stack em produção.", isCompleted: false, priority: "high",   tags: ["backend", "api"], dueDate: "2026-07-15T23:59:00Z", createdAt: "2026-07-06T14:50:00Z" },
  { id: 14, title: "Seed de dados para desenvolvimento", description: "Script npm run seed populando ~30 tarefas variadas para testar paginação.", isCompleted: false, priority: null,     tags: ["backend", "dx"], dueDate: null, createdAt: "2026-07-08T18:30:00Z" },
];

function fetchTasks({ page = 1, limit = 5, status = "all", priority = "all" }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let rows = DB;
      if (status === "open") rows = rows.filter((t) => !t.isCompleted);
      if (status === "done") rows = rows.filter((t) => t.isCompleted);
      if (priority !== "all") rows = rows.filter((t) => String(t.priority) === priority);
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = Math.min(page, totalPages);
      const data = rows.slice((safePage - 1) * limit, safePage * limit);
      resolve({ data, page: safePage, limit, total, totalPages });
    }, 380);
  });
}

// Simula POST /api/tasks (sem id) ou PATCH /api/tasks/:id (com id)
function saveTask(payload, id = null) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (id == null) {
        const task = {
          ...payload,
          id: Math.max(...DB.map((t) => t.id)) + 1,
          createdAt: new Date().toISOString(),
        };
        DB.unshift(task);
        resolve(task);
      } else {
        const i = DB.findIndex((t) => t.id === id);
        DB[i] = { ...DB[i], ...payload };
        resolve(DB[i]);
      }
    }, 420);
  });
}

// ---------------------------------------------------------------------------
// Tema — paleta quente e de baixo contraste, pensada para longas sessões.
// ---------------------------------------------------------------------------

const T = {
  pageBg: "#ECEAE2",
  card: "#FAF8F1",
  border: "#DDD9CC",
  inputBorder: "#CBC6B7",
  ink: "#3E4146",
  text: "#6C6A61",
  muted: "#98948A",
  doneBg: "#F0F5EC",
  doneBorder: "#D9E3D2",
  overdueBg: "#F8F0EA",
  overdueBorder: "#EADACE",
  danger: "#A85A4B",
  warn: "#8A6A2F",
  check: "#6E9C87",
  readOnlyBg: "#EFECE2",
  accent: "#8A6A55",        // terracota amadeirado: destaca sem berrar
  accentBorder: "#6B4A3A",
};

const PRIORITY = {
  high:   { label: "Alta",  rail: "#C96A5C", chipBg: "#F2DEDA", chipFg: "#84392E", chipBorder: "#C96A5C" },
  medium: { label: "Média", rail: "#C99C4E", chipBg: "#F0E5CC", chipFg: "#6F521C", chipBorder: "#C99C4E" },
  low:    { label: "Baixa", rail: "#6E9C87", chipBg: "#E0EBE1", chipFg: "#39604E", chipBorder: "#6E9C87" },
  null:   { label: "Sem prioridade", rail: "#C2BDAE", chipBg: "#EAE7DC", chipFg: "#6C6A61", chipBorder: "#C2BDAE" },
};

const LIMITS = { title: 255, description: 2000, tag: 50, tags: 10 };

function dueInfo(dueDate, isCompleted) {
  if (!dueDate) return { text: "Sem prazo", tone: "muted" };
  const due = new Date(dueDate);
  const now = new Date("2026-07-16T12:00:00Z"); // "hoje" fixo p/ o protótipo
  const days = Math.ceil((due - now) / 86400000);
  const fmt = due.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (isCompleted) return { text: fmt, tone: "muted" };
  if (days < 0) return { text: `${fmt} · atrasada há ${-days} d`, tone: "danger" };
  if (days === 0) return { text: `${fmt} · vence hoje`, tone: "warn" };
  if (days <= 7) return { text: `${fmt} · em ${days} d`, tone: "warn" };
  return { text: fmt, tone: "normal" };
}

// Espelha a validação que o backend fará (422 com detalhes por campo)
function validateTask(v) {
  const errors = {};
  const title = v.title.trim();
  if (!title) errors.title = "O título é obrigatório.";
  else if (title.length > LIMITS.title) errors.title = `O título passou do limite de ${LIMITS.title} caracteres (${title.length} no momento).`;
  if (v.description.trim().length > LIMITS.description) {
    errors.description = `A descrição passou do limite de ${LIMITS.description} caracteres (${v.description.trim().length} no momento).`;
  }
  if (v.tags.length > LIMITS.tags) errors.tags = `Máximo de ${LIMITS.tags} tags por tarefa.`;
  return errors;
}

// ---------------------------------------------------------------------------
// Componentes da listagem
// ---------------------------------------------------------------------------

function TaskCard({ task, onToggle, onEdit }) {
  const p = PRIORITY[String(task.priority)];
  const due = dueInfo(task.dueDate, task.isCompleted);
  const dueColor = due.tone === "danger" ? T.danger : due.tone === "warn" ? T.warn : T.muted;

  const isOverdue = !task.isCompleted && due.tone === "danger";
  const cardBg = task.isCompleted ? T.doneBg : isOverdue ? T.overdueBg : T.card;
  const cardBorder = task.isCompleted ? T.doneBorder : isOverdue ? T.overdueBorder : T.border;

  return (
    <div
      className="relative rounded-xl border px-5 py-4 flex gap-4 items-start transition-shadow hover:shadow"
      style={{ opacity: task.isCompleted ? 0.85 : 1, background: cardBg, borderColor: cardBorder }}
    >
      <span aria-hidden className="absolute left-0 top-3 bottom-3 w-1 rounded-r" style={{ background: p.rail }} />
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.isCompleted ? "Marcar como pendente" : "Marcar como concluída"}
        className="mt-1 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: task.isCompleted ? T.check : "#C2BDAE",
          background: task.isCompleted ? T.check : "transparent",
        }}
      >
        {task.isCompleted && (
          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
            <path d="M2 6.5L4.8 9L10 3.5" stroke="#FAF8F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3
            className="font-semibold leading-snug"
            style={{ color: T.ink, textDecoration: task.isCompleted ? "line-through" : "none" }}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border"
              style={{ background: p.chipBg, color: p.chipFg, borderColor: p.chipBorder, letterSpacing: "0.04em" }}
            >
              {p.label}
            </span>
            <button
              onClick={() => onEdit(task)}
              aria-label={`Editar tarefa ${task.title}`}
              className="w-7 h-7 rounded-lg border flex items-center justify-center transition-colors hover:opacity-80"
              style={{ background: T.card, borderColor: T.inputBorder, color: T.text }}
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.3 2.2l2.5 2.5L5.5 13H3v-2.5l8.3-8.3z" />
              </svg>
            </button>
          </div>
        </div>

        {task.description && (
          <p className="mt-1 text-sm leading-relaxed" style={{ color: T.text }}>{task.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-xs font-medium tabular-nums" style={{ color: dueColor }}>
            {due.tone === "danger" ? "⚠ " : ""}{due.text}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded border" style={{ background: T.readOnlyBg, color: T.text, borderColor: T.border }}>
                {tag}
              </span>
            ))}
          </div>
          <span className="ml-auto text-xs tabular-nums" style={{ color: T.muted }}>#{task.id}</span>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-xl border px-5 py-4 animate-pulse" style={{ background: T.card, borderColor: T.border }}>
      <div className="h-4 rounded w-2/3 mb-3" style={{ background: "#E4E1D5" }} />
      <div className="h-3 rounded w-full mb-2" style={{ background: "#ECE9DE" }} />
      <div className="h-3 rounded w-1/3" style={{ background: "#ECE9DE" }} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: T.text }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
        style={{ background: T.card, color: T.ink, borderColor: T.inputBorder }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Formulário de criação/edição
// ---------------------------------------------------------------------------

function FieldLabel({ children, htmlFor, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold mb-1" style={{ color: T.ink }}>
      {children}
      {required && <span style={{ color: T.danger }}> *</span>}
    </label>
  );
}

function CharCount({ value, max }) {
  const n = value.trim().length;
  const over = n > max;
  return (
    <span className="text-xs tabular-nums" style={{ color: over ? T.danger : T.muted }}>
      {n}/{max}
    </span>
  );
}

function ErrorText({ children }) {
  if (!children) return null;
  return (
    <p className="mt-1 text-xs font-medium flex items-center gap-1" style={{ color: T.danger }} role="alert">
      <svg viewBox="0 0 12 12" className="w-3 h-3 shrink-0" fill="currentColor">
        <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm-.75 3h1.5v4h-1.5V3zm0 5h1.5v1.5h-1.5V8z" />
      </svg>
      {children}
    </p>
  );
}

function ReadOnlyField({ label, value, hint }) {
  return (
    <div className="flex-1 min-w-0">
      <span className="block text-sm font-semibold mb-1" style={{ color: T.muted }}>{label}</span>
      <div
        className="rounded-lg border px-3 py-2 text-sm tabular-nums truncate"
        style={{ background: T.readOnlyBg, borderColor: T.border, color: T.text, cursor: "not-allowed" }}
        title={hint || String(value)}
      >
        {value}
      </div>
    </div>
  );
}

const inputStyle = (hasError) => ({
  background: T.card,
  color: T.ink,
  borderColor: hasError ? T.danger : T.inputBorder,
});

function TaskForm({ task, onClose, onSaved }) {
  const editing = task != null;
  const [values, setValues] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    priority: task?.priority ?? "",
    tags: task?.tags ? [...task.tags] : [],
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
  });
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field, val) => {
    setValues((v) => ({ ...v, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (tag.length > LIMITS.tag) return setTagError(`Cada tag tem no máximo ${LIMITS.tag} caracteres (${tag.length} no momento).`);
    if (values.tags.includes(tag)) return setTagError(`A tag "${tag}" já foi adicionada.`);
    if (values.tags.length >= LIMITS.tags) return setTagError(`Limite de ${LIMITS.tags} tags atingido. Remova uma para adicionar outra.`);
    set("tags", [...values.tags, tag]);
    setTagInput("");
    setTagError("");
  };

  const removeTag = (tag) => {
    set("tags", values.tags.filter((t) => t !== tag));
    setTagError("");
  };

  const submit = () => {
    const errs = validateTask(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority || null,
      tags: values.tags,
      dueDate: values.dueDate ? `${values.dueDate}T23:59:00Z` : null,
      // Status não é editável aqui: preserva o atual em edição, nasce false na criação.
      // A conclusão é feita pelo checkbox do card (PATCH /api/tasks/:id).
      isCompleted: editing ? task.isCompleted : false,
    };
    // No app real: POST /api/tasks ou PATCH /api/tasks/:id
    saveTask(payload, editing ? task.id : null).then(() => {
      setSaving(false);
      onSaved();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:py-10"
      style={{ background: "rgba(62, 65, 70, 0.4)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Editar tarefa" : "Nova tarefa"}
    >
      <div className="w-full max-w-xl rounded-2xl border shadow-xl" style={{ background: T.card, borderColor: T.border }}>
        <header className="px-6 pt-5 pb-4 border-b" style={{ borderColor: T.border }}>
          <h2 className="text-lg font-bold" style={{ color: T.ink }}>
            {editing ? "Editar tarefa" : "Nova tarefa"}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: T.muted }}>
            {editing ? "Os campos gerados pelo sistema não podem ser alterados." : "Só o título é obrigatório — o resto é opcional."}
          </p>
        </header>

        <div className="px-6 py-5 space-y-5">
          {editing && (
            <div className="flex gap-3">
              <ReadOnlyField label="ID" value={`#${task.id}`} />
              <ReadOnlyField
                label="Criada em"
                value={new Date(task.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                hint={task.createdAt}
              />
            </div>
          )}

          <div>
            <div className="flex items-end justify-between">
              <FieldLabel htmlFor="f-title" required>Título</FieldLabel>
              <CharCount value={values.title} max={LIMITS.title} />
            </div>
            <input
              id="f-title"
              type="text"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex.: Implementar endpoint de busca"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={inputStyle(errors.title)}
              aria-invalid={!!errors.title}
            />
            <ErrorText>{errors.title}</ErrorText>
          </div>

          <div>
            <div className="flex items-end justify-between">
              <FieldLabel htmlFor="f-desc">Descrição</FieldLabel>
              <CharCount value={values.description} max={LIMITS.description} />
            </div>
            <textarea
              id="f-desc"
              rows={3}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detalhes, critérios de aceite, links…"
              className="w-full rounded-lg border px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2"
              style={inputStyle(errors.description)}
              aria-invalid={!!errors.description}
            />
            <ErrorText>{errors.description}</ErrorText>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-40">
              <FieldLabel htmlFor="f-priority">Prioridade</FieldLabel>
              <select
                id="f-priority"
                value={values.priority}
                onChange={(e) => set("priority", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle(false)}
              >
                <option value="">Sem prioridade</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <FieldLabel htmlFor="f-due">Vencimento</FieldLabel>
              <input
                id="f-due"
                type="date"
                value={values.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle(false)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between">
              <FieldLabel htmlFor="f-tag">Tags</FieldLabel>
              <span className="text-xs tabular-nums" style={{ color: values.tags.length >= LIMITS.tags ? T.warn : T.muted }}>
                {values.tags.length}/{LIMITS.tags}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                id="f-tag"
                type="text"
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); setTagError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Digite e pressione Enter"
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={inputStyle(tagError)}
                aria-invalid={!!tagError}
              />
              <button
                onClick={addTag}
                className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:opacity-80"
                style={{ background: T.readOnlyBg, borderColor: T.inputBorder, color: T.ink }}
              >
                Adicionar
              </button>
            </div>
            <ErrorText>{tagError || errors.tags}</ErrorText>
            {values.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {values.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border"
                    style={{ background: T.readOnlyBg, color: T.text, borderColor: T.border }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      aria-label={`Remover tag ${tag}`}
                      className="hover:opacity-70 font-bold"
                      style={{ color: T.muted }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        <footer className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: T.border }}>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:opacity-80 disabled:opacity-40"
            style={{ background: T.card, borderColor: T.inputBorder, color: T.text }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "#55584F", color: "#F5F3EA" }}
          >
            {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar tarefa"}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel
// ---------------------------------------------------------------------------

export default function TaskDashboard() {
  const [resp, setResp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [form, setForm] = useState(null); // null = fechado, {task: null} = criar, {task} = editar

  const load = useCallback(() => {
    setLoading(true);
    fetchTasks({ page, limit, status, priority }).then((r) => {
      setResp(r);
      if (r.page !== page) setPage(r.page);
      setLoading(false);
    });
  }, [page, limit, status, priority]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id) => {
    const t = DB.find((x) => x.id === id);
    if (t) t.isCompleted = !t.isCompleted; // no app real: PATCH /api/tasks/:id
    setResp((r) => r && { ...r, data: r.data.map((x) => (x.id === id ? { ...x, isCompleted: t.isCompleted } : x)) });
  };

  const tasks = resp?.data ?? [];
  const openCount = DB.filter((t) => !t.isCompleted).length;
  const overdueCount = DB.filter((t) => !t.isCompleted && t.dueDate && new Date(t.dueDate) < new Date("2026-07-16T12:00:00Z")).length;

  const btnStyle = { background: T.card, color: T.ink, borderColor: T.inputBorder };

  return (
    <div className="min-h-screen" style={{ background: T.pageBg, fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');`}</style>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-6">
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: T.muted }}>
            Task API · painel de gestão
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-2xl font-bold" style={{ color: T.ink }}>Minhas tarefas</h1>
            <div className="flex items-center gap-4 text-sm">
              <span style={{ color: T.text }}>
                <strong className="tabular-nums" style={{ color: T.ink }}>{openCount}</strong> pendentes
              </span>
              <span style={{ color: overdueCount ? T.danger : T.muted }}>
                <strong className="tabular-nums">{overdueCount}</strong> atrasadas
              </span>
              <button
                onClick={() => setForm({ task: null })}
                className="ml-1 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg border transition-all hover:brightness-105 hover:-translate-y-px active:translate-y-0"
                style={{
                  background: T.accent,
                  color: "#FBF9F3",
                  borderColor: T.accentBorder,
                  boxShadow: "0 2px 6px rgba(107, 74, 58, 0.28)",
                }}
              >
                <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M7 2v10M2 7h10" />
                </svg>
                Nova tarefa
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
            options={[["all", "Todas"], ["open", "Pendentes"], ["done", "Concluídas"]]} />
          <Select label="Prioridade" value={priority} onChange={(v) => { setPriority(v); setPage(1); }}
            options={[["all", "Todas"], ["high", "Alta"], ["medium", "Média"], ["low", "Baixa"], ["null", "Sem prioridade"]]} />
          <Select label="Por página" value={String(limit)} onChange={(v) => { setLimit(Number(v)); setPage(1); }}
            options={[["5", "5"], ["10", "10"]]} />
        </div>

        <div className="space-y-3" aria-busy={loading}>
          {loading
            ? Array.from({ length: Math.min(limit, 5) }).map((_, i) => <Skeleton key={i} />)
            : tasks.length
              ? tasks.map((t) => <TaskCard key={t.id} task={t} onToggle={toggle} onEdit={(task) => setForm({ task })} />)
              : (
                <div className="rounded-xl border border-dashed p-10 text-center text-sm" style={{ background: T.card, borderColor: T.inputBorder, color: T.text }}>
                  Nenhuma tarefa com esses filtros. Ajuste os filtros acima ou crie uma nova tarefa.
                </div>
              )}
        </div>

        {resp && (
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm tabular-nums" style={{ color: T.text }}>
              Total de <strong style={{ color: T.ink }}>{resp.total}</strong> {resp.total === 1 ? "tarefa" : "tarefas"} · página {resp.page} de {resp.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={resp.page <= 1 || loading}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 transition-colors"
                style={btnStyle}
              >
                ← Anterior
              </button>
              {Array.from({ length: resp.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  disabled={loading}
                  className="w-8 h-8 text-sm rounded-lg border transition-colors tabular-nums"
                  style={
                    resp.page === i + 1
                      ? { background: "#55584F", color: "#F5F3EA", borderColor: "#55584F" }
                      : btnStyle
                  }
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(resp.totalPages, p + 1))}
                disabled={resp.page >= resp.totalPages || loading}
                className="px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 transition-colors"
                style={btnStyle}
              >
                Próxima →
              </button>
            </div>
          </footer>
        )}
      </div>

      {form && (
        <TaskForm
          task={form.task}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); load(); }}
        />
      )}
    </div>
  );
}
