import { useState } from 'react';
import { T, LIMITS } from '../theme';
import { validateTask } from '../utils/validation';
import { createTask, updateTask, setTaskDueDate } from '../api/tasks';

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
        style={{ background: T.readOnlyBg, borderColor: T.border, color: T.text, cursor: 'not-allowed' }}
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
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? '',
    tags: task?.tags ? [...task.tags] : [],
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
    set('tags', [...values.tags, tag]);
    setTagInput('');
    setTagError('');
  };

  const removeTag = (tag) => {
    set('tags', values.tags.filter((t) => t !== tag));
    setTagError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateTask(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority || null,
      tags: values.tags,
      // Status não é editável aqui: preserva o atual em edição, nasce false na criação.
      // A conclusão é feita pelo checkbox do card (PUT /api/tasks/:id).
      isCompleted: editing ? task.isCompleted : false,
    };

    setSaving(true);
    setSubmitError('');
    try {
      // dueDate não é aceito por POST/PUT (API.md) — só pela rota dedicada abaixo.
      const saved = editing ? await updateTask(task.id, payload) : await createTask(payload);
      if (values.dueDate) {
        await setTaskDueDate(saved.id, `${values.dueDate}T23:59:00Z`);
      }
      onSaved();
    } catch (error) {
      setSubmitError(error.message);
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:py-10"
      style={{ background: 'rgba(62, 65, 70, 0.4)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'Editar tarefa' : 'Nova tarefa'}
    >
      <div className="w-full max-w-xl rounded-2xl border shadow-xl" style={{ background: T.card, borderColor: T.border }}>
        <form onSubmit={submit}>
          <header className="px-6 pt-5 pb-4 border-b" style={{ borderColor: T.border }}>
            <h2 className="text-lg font-bold" style={{ color: T.ink }}>
              {editing ? 'Editar tarefa' : 'Nova tarefa'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: T.muted }}>
              {editing ? 'Os campos gerados pelo sistema não podem ser alterados.' : 'Só o título é obrigatório — o resto é opcional.'}
            </p>
          </header>

          <div className="px-6 py-5 space-y-5">
            {editing && (
              <div className="flex gap-3">
                <ReadOnlyField label="ID" value={`#${task.id}`} />
                <ReadOnlyField
                  label="Criada em"
                  value={new Date(task.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                onChange={(e) => set('title', e.target.value)}
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
                onChange={(e) => set('description', e.target.value)}
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
                  onChange={(e) => set('priority', e.target.value)}
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
                  onChange={(e) => set('dueDate', e.target.value)}
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
                  onChange={(e) => { setTagInput(e.target.value); setTagError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Digite e pressione Enter"
                  className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={inputStyle(tagError)}
                  aria-invalid={!!tagError}
                />
                <button
                  type="button"
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
                        type="button"
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

            <ErrorText>{submitError}</ErrorText>
          </div>

          <footer className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: T.border }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:opacity-80 disabled:opacity-40"
              style={{ background: T.card, borderColor: T.inputBorder, color: T.text }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#55584F', color: '#F5F3EA' }}
            >
              {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;
