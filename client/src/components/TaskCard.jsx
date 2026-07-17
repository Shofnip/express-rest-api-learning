import { T, PRIORITY } from '../theme';
import { dueInfo } from '../utils/validation';

function TaskCard({ task, onToggle, onEdit }) {
  const p = PRIORITY[String(task.priority)];
  const due = dueInfo(task.dueDate, task.isCompleted);
  const dueColor = due.tone === 'danger' ? T.danger : due.tone === 'warn' ? T.warn : T.muted;

  const isOverdue = !task.isCompleted && due.tone === 'danger';
  const cardBg = task.isCompleted ? T.doneBg : isOverdue ? T.overdueBg : T.card;
  const cardBorder = task.isCompleted ? T.doneBorder : isOverdue ? T.overdueBorder : T.border;

  return (
    <div
      className="relative rounded-xl border px-5 py-4 flex gap-4 items-start transition-shadow hover:shadow"
      style={{ opacity: task.isCompleted ? 0.85 : 1, background: cardBg, borderColor: cardBorder }}
    >
      <span aria-hidden className="absolute left-0 top-3 bottom-3 w-1 rounded-r" style={{ background: p.rail }} />
      <button
        onClick={() => onToggle(task)}
        aria-label={task.isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
        className="mt-1 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: task.isCompleted ? T.check : '#C2BDAE',
          background: task.isCompleted ? T.check : 'transparent',
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
            style={{ color: T.ink, textDecoration: task.isCompleted ? 'line-through' : 'none' }}
          >
            {task.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border"
              style={{ background: p.chipBg, color: p.chipFg, borderColor: p.chipBorder, letterSpacing: '0.04em' }}
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
            {due.tone === 'danger' ? '⚠ ' : ''}{due.text}
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

export default TaskCard;
