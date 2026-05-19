import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';

const DEMO_PROJECTS = [
  { id: 'proj-1', title: 'EFRIS Integration v2', description: 'URA EFRIS API upgrade for multi-country support', status: 'Active', start_date: '2024-11-01', due_date: '2025-01-31' },
  { id: 'proj-2', title: 'Pi Wallet Mobile App', description: 'React Native app for Pi Wallet on iOS and Android', status: 'Active', start_date: '2024-10-15', due_date: '2025-02-28' },
  { id: 'proj-3', title: 'ARIA AI Engine v3', description: 'Anthropic-ready financial forecasting upgrade', status: 'Planning', start_date: '2025-01-01', due_date: '2025-06-30' },
];

const DEMO_TASKS = [
  { id: 't1', task_id: 'T-001', title: 'API gateway setup', project: 'EFRIS Integration v2', assignee: 'David M', priority: 'High', due_date: '2024-12-20', status: 'Done', progress: 100 },
  { id: 't2', task_id: 'T-002', title: 'URA sandbox testing', project: 'EFRIS Integration v2', assignee: 'Sarah A', priority: 'High', due_date: '2024-12-31', status: 'In Progress', progress: 65 },
  { id: 't3', task_id: 'T-003', title: 'QR code generation module', project: 'EFRIS Integration v2', assignee: 'James O', priority: 'Medium', due_date: '2025-01-15', status: 'Todo', progress: 0 },
  { id: 't4', task_id: 'T-004', title: 'MoMo payment flow', project: 'Pi Wallet Mobile App', assignee: 'Amina H', priority: 'High', due_date: '2025-01-20', status: 'In Progress', progress: 40 },
  { id: 't5', task_id: 'T-005', title: 'Anthropic API adapter', project: 'ARIA AI Engine v3', assignee: 'Grace N', priority: 'High', due_date: '2025-03-15', status: 'Todo', progress: 0 },
];

const STATUS_COLS = ['Todo', 'In Progress', 'Review', 'Done'];

export default function Projects() {
  const [tab, setTab] = useState('kanban');
  const [projects, setProjects] = useState(DEMO_PROJECTS);
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', project: '', assignee: '', priority: 'Medium', due_date: '', status: 'Todo' });
  const [projectForm, setProjectForm] = useState({ title: '', description: '', start_date: '', due_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('eicToken');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    apiFetch('/api/projects', { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setProjects(d); })
      .catch(() => {});

    apiFetch('/api/tasks', { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setTasks(d); })
      .catch(() => {});
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await apiFetch('/api/tasks', { method: 'POST', headers, body: JSON.stringify(taskForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(prev => [data, ...prev]);
      setTaskForm({ title: '', project: '', assignee: '', priority: 'Medium', due_date: '', status: 'Todo' });
      setShowAddTask(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await apiFetch('/api/projects', { method: 'POST', headers, body: JSON.stringify(projectForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProjects(prev => [data, ...prev]);
      setProjectForm({ title: '', description: '', start_date: '', due_date: '' });
      setShowAddProject(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const moveTask = async (task, newStatus) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ ...task, status: newStatus }),
      });
    } catch (_) {}
  };

  const priorityColor = (p) =>
    p === 'High' ? 'bg-white/10 text-white' : p === 'Medium' ? 'bg-white/5 text-neutral-300' : 'bg-white/5 text-neutral-400';

  const statusColor = () => 'bg-white/5 text-neutral-400';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Project Management</h1>
          <p className="text-neutral-500 text-sm mt-1">Kanban board, task assignment, milestones, progress tracking.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setShowAddProject(!showAddProject); setShowAddTask(false); }} className="bg-white/8 border border-white/10 text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-white/15 transition-all">
            + New Project
          </button>
          <button onClick={() => { setShowAddTask(!showAddTask); setShowAddProject(false); }} className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
            + Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: projects.filter(p => p.status === 'Active').length.toString() },
          { label: 'Total Tasks', value: tasks.length.toString() },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length.toString() },
          { label: 'Completed', value: tasks.filter(t => t.status === 'Done').length.toString() },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">{s.label}</div>
            <div className="text-2xl font-black tracking-tight text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {showAddProject && (
        <form onSubmit={handleAddProject} className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">New Project</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Project Title *</label>
              <input required value={projectForm.title} onChange={e => setProjectForm(p => ({ ...p, title: e.target.value }))} placeholder="EFRIS Integration v3" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Description</label>
              <input value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief project description" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Start Date</label>
              <input type="date" value={projectForm.start_date} onChange={e => setProjectForm(p => ({ ...p, start_date: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Due Date</label>
              <input type="date" value={projectForm.due_date} onChange={e => setProjectForm(p => ({ ...p, due_date: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-50">{saving ? 'Saving…' : 'Create Project'}</button>
            <button type="button" onClick={() => setShowAddProject(false)} className="text-sm text-neutral-500 hover:text-white px-4 py-2.5">Cancel</button>
          </div>
        </form>
      )}

      {showAddTask && (
        <form onSubmit={handleAddTask} className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">New Task</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Task Title *</label>
              <input required value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Implement QR invoice generation" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Project</label>
              <select value={taskForm.project} onChange={e => setTaskForm(p => ({ ...p, project: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm">
                <option value="">— Select project —</option>
                {projects.map(proj => <option key={proj.id} value={proj.title}>{proj.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Assignee</label>
              <input value={taskForm.assignee} onChange={e => setTaskForm(p => ({ ...p, assignee: e.target.value }))} placeholder="David M" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Priority</label>
              <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Due Date</label>
              <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-50">{saving ? 'Saving…' : 'Create Task'}</button>
            <button type="button" onClick={() => setShowAddTask(false)} className="text-sm text-neutral-500 hover:text-white px-4 py-2.5">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {[
          { id: 'kanban', label: 'Kanban Board' },
          { id: 'list', label: 'Task List' },
          { id: 'projects', label: 'Projects' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'kanban' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-h-[400px]">
          {STATUS_COLS.map(col => (
            <div key={col} className="bg-[#141414] border border-white/6 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{col}</span>
                <span className="text-xs text-neutral-600 font-semibold">{tasks.filter(t => t.status === col).length}</span>
              </div>
              <div className="space-y-2">
                {tasks.filter(t => t.status === col).map(task => (
                  <div key={task.id} className="bg-[#0a0a0a] border border-white/6 rounded-xl p-3 group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold text-white leading-snug">{task.title}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${priorityColor(task.priority)}`}>{task.priority}</span>
                    </div>
                    {task.project && <p className="text-[10px] text-neutral-600 mb-2 truncate">{task.project}</p>}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                          {(task.assignee || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-[10px] text-neutral-600">{task.assignee || 'Unassigned'}</span>
                      </div>
                      {task.due_date && <span className="text-[10px] text-neutral-600">{task.due_date}</span>}
                    </div>
                    {task.progress > 0 && (
                      <div className="mt-2">
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-white/30 rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="hidden group-hover:flex gap-1 mt-2 justify-end">
                      {STATUS_COLS.filter(s => s !== col).map(s => (
                        <button key={s} onClick={() => moveTask(task, s)} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10">
                          → {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === col).length === 0 && (
                  <div className="text-center py-6 text-neutral-700 text-xs">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'list' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">ID</th>
              <th className="pb-3 text-left font-semibold">Task</th>
              <th className="pb-3 text-left font-semibold">Project</th>
              <th className="pb-3 text-left font-semibold">Assignee</th>
              <th className="pb-3 text-left font-semibold">Priority</th>
              <th className="pb-3 text-left font-semibold">Due</th>
              <th className="pb-3 text-left font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">Progress</th>
            </tr></thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={t.id} className="border-b border-white/4 hover:bg-white/[0.02]">
                  <td className="py-3 text-neutral-600 font-mono text-xs">{t.task_id || `T-${i + 1}`}</td>
                  <td className="py-3 text-white font-medium">{t.title}</td>
                  <td className="py-3 text-neutral-400 text-xs">{t.project || '—'}</td>
                  <td className="py-3 text-neutral-400">{t.assignee || '—'}</td>
                  <td className="py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(t.priority)}`}>{t.priority}</span></td>
                  <td className="py-3 text-neutral-500 text-xs">{t.due_date || '—'}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${t.status === 'Done' ? 'bg-white/10 text-white' : t.status === 'In Progress' ? 'bg-white/8 text-neutral-300' : 'bg-white/5 text-neutral-400'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-white/40 rounded-full" style={{ width: `${t.progress || 0}%` }} />
                      </div>
                      <span className="text-xs text-neutral-600 w-8 text-right">{t.progress || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && <div className="text-center py-12 text-neutral-600">No tasks yet.</div>}
        </div>
      )}

      {tab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj, i) => {
            const projTasks = tasks.filter(t => t.project === proj.title || t.project_id === proj.id);
            const done = projTasks.filter(t => t.status === 'Done').length;
            const progress = projTasks.length ? Math.round((done / projTasks.length) * 100) : 0;
            return (
              <div key={proj.id || i} className="bg-[#141414] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-bold text-sm leading-tight">{proj.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(proj.status)}`}>{proj.status || 'Active'}</span>
                </div>
                {proj.description && <p className="text-xs text-neutral-600 mb-4 leading-relaxed">{proj.description}</p>}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Progress</span>
                    <span className="text-neutral-300 font-semibold">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-white/40 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-neutral-600">
                  <span>{projTasks.length} tasks</span>
                  {proj.due_date && <span>Due {proj.due_date}</span>}
                </div>
              </div>
            );
          })}
          {projects.length === 0 && <div className="col-span-3 text-center py-12 text-neutral-600">No projects yet.</div>}
        </div>
      )}
    </div>
  );
}
