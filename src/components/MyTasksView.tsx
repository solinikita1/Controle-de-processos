import React, { useState } from 'react';
import { Task, Project, TeamMember, AuthUser, TaskStatus, TaskPriority } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { DeadlineAlert } from './DeadlineAlert';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  FolderKanban, 
  AlertTriangle, 
  CheckSquare, 
  User, 
  ArrowRight,
  Filter,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const PRIORITY_MAP: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  critica: { label: 'Crítica', color: 'text-rose-700', bgColor: 'bg-rose-50 border border-rose-200' },
  alta: { label: 'Alta', color: 'text-amber-700', bgColor: 'bg-amber-50 border border-amber-200' },
  media: { label: 'Média', color: 'text-blue-700', bgColor: 'bg-blue-50 border border-blue-200' },
  baixa: { label: 'Baixa', color: 'text-neutral-700', bgColor: 'bg-neutral-100 border border-neutral-200' },
};

interface MyTasksViewProps {
  currentUser: AuthUser;
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  onToggleTaskComplete: (task: Task) => void;
  onUpdateTaskStatus: (task: Task, newStatus: TaskStatus) => void;
  onSelectProject: (projectId: string) => void;
  onEditTask: (task: Task) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  currentUser,
  projects,
  tasks,
  teamMembers,
  onToggleTaskComplete,
  onUpdateTaskStatus,
  onSelectProject,
  onEditTask,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'critical'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Filter tasks where the responsible is the current user
  const userTasks = tasks.filter((t) => t.responsibleId === currentUser.id);

  const filteredTasks = userTasks.filter((t) => {
    // Project filter
    if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) {
      return false;
    }

    // Status filter
    if (statusFilter === 'pending' && (t.completed || t.status === 'concluida')) {
      return false;
    }
    if (statusFilter === 'completed' && !t.completed && t.status !== 'concluida') {
      return false;
    }
    if (statusFilter === 'critical') {
      if (t.completed || t.status === 'concluida') return false;
      return t.priority === 'critica' || t.priority === 'alta';
    }

    return true;
  });

  const totalUserTasks = userTasks.length;
  const completedCount = userTasks.filter((t) => t.completed || t.status === 'concluida').length;
  const pendingCount = totalUserTasks - completedCount;
  const criticalCount = userTasks.filter(
    (t) => !t.completed && t.status !== 'concluida' && (t.priority === 'critica' || t.priority === 'alta')
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Microsoft User Persona */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${currentUser.avatarColor}`}>
              {currentUser.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                  Painel Individual: {currentUser.name}
                </h1>
                {currentUser.isDirector && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 rounded-md uppercase">
                    {currentUser.role?.includes('CEO') ? 'CEO' : currentUser.role?.includes('CSO') ? 'CSO' : 'Diretoria'}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {currentUser.role} · <span className="font-mono text-neutral-600">{currentUser.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200 shrink-0">
            {/* Microsoft 4-color grid */}
            <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5 shrink-0">
              <div className="bg-[#f25022] rounded-3xs" />
              <div className="bg-[#7fba00] rounded-3xs" />
              <div className="bg-[#00a4ef] rounded-3xs" />
              <div className="bg-[#ffb900] rounded-3xs" />
            </div>
            <span className="font-semibold text-neutral-700">Autenticado via Microsoft 365</span>
          </div>
        </div>

        {/* User Mini KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-100">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
            <span className="text-[11px] font-semibold text-neutral-500 block">Total Atribuídas</span>
            <span className="text-xl font-extrabold text-neutral-900">{totalUserTasks}</span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70">
            <span className="text-[11px] font-semibold text-amber-800 block">Pendentes</span>
            <span className="text-xl font-extrabold text-amber-900">{pendingCount}</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/70">
            <span className="text-[11px] font-semibold text-emerald-800 block">Concluídas (Já Fez)</span>
            <span className="text-xl font-extrabold text-emerald-900">{completedCount}</span>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/70">
            <span className="text-[11px] font-semibold text-rose-800 block">Críticas / Alta Prioridade</span>
            <span className="text-xl font-extrabold text-rose-900">{criticalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Todas ({totalUserTasks})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('critical')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'critical'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Críticas ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Concluídas ({completedCount})
          </button>
        </div>

        {/* Project selector */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">Projeto:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-1.5 rounded-lg border border-neutral-300 bg-white font-medium text-neutral-800 focus:outline-hidden focus:border-stone-900"
          >
            <option value="all">Todos os Projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-900">
              Nenhuma tarefa encontrada neste filtro!
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Todas as tarefas do seu perfil nesta categoria foram concluídas ou você não possui atribuições pendentes com esses critérios.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const project = projects.find((p) => p.id === task.projectId);
            const phase = ARCHITECTURE_PHASES.find((ph) => ph.id === task.phase);
            const priorityInfo = PRIORITY_MAP[task.priority];

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border p-4.5 transition-all shadow-2xs hover:shadow-xs ${
                  task.completed ? 'border-neutral-200/60 bg-neutral-50/50 opacity-80' : 'border-neutral-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Left: Checkbox + Title + Metadata */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTaskComplete(task)}
                      className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
                        task.completed ? 'text-emerald-600' : 'text-neutral-400 hover:text-stone-800'
                      }`}
                      aria-label={task.completed ? 'Desmarcar conclusão' : 'Marcar como concluída (Já Fez)'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-bold ${
                            task.completed ? 'line-through text-neutral-500' : 'text-neutral-900'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>

                        {/* Phase */}
                        {phase && (
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${phase.color}`}>
                            {phase.name}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Project reference */}
                      {project && (
                        <div className="flex items-center gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => onSelectProject(project.id)}
                            className="text-[11px] font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 group/proj"
                          >
                            <FolderKanban className="w-3.5 h-3.5 text-neutral-400 group-hover/proj:text-stone-900" />
                            <span>{project.code} · {project.name}</span>
                            <ArrowRight className="w-3 h-3 text-neutral-400 group-hover/proj:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      )}

                      {/* Deliverables */}
                      {task.deliverables && (
                        <div className="mt-2 text-[11px] text-neutral-500 bg-neutral-50 px-2.5 py-1.5 rounded-md border border-neutral-200/70 inline-block">
                          <span className="font-semibold text-neutral-700">Entregável:</span> {task.deliverables}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Dates + Deadline Alert + Edit action */}
                  <div className="shrink-0 flex flex-col sm:items-end gap-2 text-xs">
                    {/* Mandatory Dates display */}
                    <div className="flex items-center gap-2 text-neutral-600 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{task.startDate}</span>
                      <span className="text-neutral-300">até</span>
                      <span className="font-bold text-neutral-900">{task.endDate}</span>
                    </div>

                    {/* Deadline Alert Indicator */}
                    <DeadlineAlert endDate={task.endDate} isCompleted={task.completed} />

                    {/* Edit button */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                      >
                        Editar Tarefa
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
