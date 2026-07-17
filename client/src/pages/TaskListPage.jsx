import { useCallback, useEffect, useState } from 'react';
import { T } from '../theme';
import { getTasks, getTasksByStatus, getTasksByPriority, updateTask } from '../api/tasks';
import Select from '../components/Select';
import Skeleton from '../components/Skeleton';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

// GET /api/tasks pagina mas não filtra; /status/:status e /priority/:priority filtram
// mas não paginam, e não existe um endpoint que combine os dois. Junta a base mais
// estreita que a API oferece para o filtro ativo e resolve o resto (filtro restante +
// paginação) no cliente — ver resumo final para a justificativa completa.
async function fetchAllTasks() {
  const limit = 100;
  let page = 1;
  let all = [];
  let totalPages = 1;
  do {
    const res = await getTasks({ page, limit });
    all = all.concat(res.data);
    totalPages = res.totalPages;
    page += 1;
  } while (page <= totalPages);
  return all;
}

async function fetchFilteredTasks({ page, limit, status, priority }) {
  if (status === 'all' && priority === 'all') {
    return getTasks({ page, limit });
  }

  let rows;
  if (status !== 'all') {
    rows = await getTasksByStatus(status);
    if (priority !== 'all') {
      rows = rows.filter((t) => String(t.priority) === priority);
    }
  } else if (priority !== 'null') {
    rows = await getTasksByPriority(priority);
  } else {
    // API rejeita /priority/null (só aceita low/medium/high) — única combinação sem
    // endpoint estreito disponível, então varremos a base inteira e filtramos aqui.
    rows = await fetchAllTasks();
    rows = rows.filter((t) => String(t.priority) === priority);
  }

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const data = rows.slice((safePage - 1) * limit, safePage * limit);
  return { data, page: safePage, limit, total, totalPages };
}

function TaskListPage() {
  const [resp, setResp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [form, setForm] = useState(null);
  const [openCount, setOpenCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchFilteredTasks({ page, limit, status, priority });
    setResp(r);
    if (r.page !== page) setPage(r.page);
    setLoading(false);
  }, [page, limit, status, priority]);

  const loadCounts = useCallback(async () => {
    const pending = await getTasksByStatus('pending');
    setOpenCount(pending.length);
    const now = new Date();
    setOverdueCount(pending.filter((t) => t.dueDate && new Date(t.dueDate) < now).length);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  const toggle = async (task) => {
    await updateTask(task.id, { isCompleted: !task.isCompleted });
    await load();
    await loadCounts();
  };

  const tasks = resp?.data ?? [];
  const btnStyle = { background: T.card, color: T.ink, borderColor: T.inputBorder };

  return (
    <div className="min-h-screen" style={{ background: T.pageBg, fontFamily: "'Sora', ui-sans-serif, system-ui, sans-serif" }}>
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
                  color: '#FBF9F3',
                  borderColor: T.accentBorder,
                  boxShadow: '0 2px 6px rgba(107, 74, 58, 0.28)',
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
            options={[['all', 'Todas'], ['pending', 'Pendentes'], ['completed', 'Concluídas']]} />
          <Select label="Prioridade" value={priority} onChange={(v) => { setPriority(v); setPage(1); }}
            options={[['all', 'Todas'], ['high', 'Alta'], ['medium', 'Média'], ['low', 'Baixa'], ['null', 'Sem prioridade']]} />
          <Select label="Por página" value={String(limit)} onChange={(v) => { setLimit(Number(v)); setPage(1); }}
            options={[['5', '5'], ['10', '10']]} />
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
              Total de <strong style={{ color: T.ink }}>{resp.total}</strong> {resp.total === 1 ? 'tarefa' : 'tarefas'} · página {resp.page} de {resp.totalPages}
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
                      ? { background: '#55584F', color: '#F5F3EA', borderColor: '#55584F' }
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
          onSaved={() => { setForm(null); load(); loadCounts(); }}
        />
      )}
    </div>
  );
}

export default TaskListPage;
