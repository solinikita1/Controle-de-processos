import React from 'react';
import { Task, TaskStatus, TeamMember, TaskPriority } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { formatDateShort, checkDateStatus, calculateDaysDifference } from '../utils/dateUtils';
import { CheckCircle2, Circle, Clock, AlertTriangle, AlertCircle, Calendar, Edit2, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onToggleComplete: (task: Task) => void;
  onUpdateStatus: (task: Task, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMNS: { id: TaskStatus; title: string; countColor: string }[] = [
  { id: 'a_fazer', title: 'A Fazer', countColor: 'text-neutral-600 bg-neutral-100' },
  { id: 'em_andamento', title: 'Em Andamento', countColor: 'text-sky-700 bg-sky-50' },
  { id: 'em_revisao', title: 'Em Revisão', countColor: 'text-amber-800 bg-amber-50' },
  { id: 'concluida', title: 'Concluídas (Já Fez)', countColor: 'text-emerald-700 bg-emerald-50' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  teamMembers,
  onToggleComplete,
  onUpdateStatus,
  onEditTask,
  onDeleteTask,
}) => {
  const getMember = (id: string) => teamMembers.find((m) => m.id === id);

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'critica':
        return { text: 'Crítica', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' };
      case 'alta':
        return { text: 'Alta', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
      case 'media':
        return { text: 'Média', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' };
      default:
        return { text: 'Baixa', color: 'text-neutral-600', bg: 'bg-neutral-100 border-neutral-200' };
    }
  };

  const getPhaseName = (phaseId: string) => {
    const p = ARCHITECTURE_PHASES.find((item) => item.id === phaseId);
    return p ? p.shortName : phaseId;
  };

  const moveColumn = (task: Task, direction: 'prev' | 'next') => {
    const order: TaskStatus[] = ['a_fazer', 'em_andamento', 'em_revisao', 'concluida'];
    const currentIndex = order.indexOf(task.status);
    if (direction === 'next' && currentIndex < order.length - 1) {
      onUpdateStatus(task, order[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      onUpdateStatus(task, order[currentIndex - 1]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col bg-neutral-100/60 rounded-xl border border-neutral-200/80 p-3 min-h-[420px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1.5 pb-3 border-b border-neutral-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                {col.title}
              </span>
              <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${col.countColor} tabular-nums`}>
                {colTasks.length}
              </span>
            </div>

            {/* Tasks in Column */}
            <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-0.5">
              {colTasks.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-lg">
                  Nenhuma tarefa aqui
                </div>
              ) : (
                colTasks.map((task) => {
                  const responsible = getMember(task.responsibleId);
                  const priority = getPriorityStyle(task.priority);
                  const dateStatus = checkDateStatus(task.endDate, task.completed || task.status === 'concluida');
                  const duration = calculateDaysDifference(task.startDate, task.endDate);
                  const completedChecklist = task.checklist ? task.checklist.filter(c => c.completed).length : 0;
                  const totalChecklist = task.checklist ? task.checklist.length : 0;

                  const isDone = task.completed || task.status === 'concluida';
                  const borderClass = isDone
                    ? 'border-emerald-200/70 bg-emerald-50/10'
                    : dateStatus.isOverdue
                    ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-200'
                    : (dateStatus.isToday || dateStatus.isSoon)
                    ? 'border-amber-300 bg-amber-50/15'
                    : 'border-neutral-200/90';

                  return (
                    <div
                      key={task.id}
                      className={`group relative p-3.5 bg-white rounded-lg border transition-all hover:shadow-md ${borderClass}`}
                    >
                      {/* Top Row: Phase + Priority + "Já Fez" button */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <span className="font-mono font-semibold text-[11px] text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded-sm">
                            {getPhaseName(task.phase)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={`text-[11px] font-medium border px-1.5 py-0.2 rounded-sm ${priority.bg} ${priority.color}`}>
                            {priority.text}
                          </span>
                        </div>

                        {/* Quick Completed Toggle Button ("Já fez") */}
                        <button
                          type="button"
                          onClick={() => onToggleComplete(task)}
                          title={isDone ? 'Marcar como pendente' : 'Marcar como concluída (Já fez)'}
                          className={`p-1 rounded-md transition-colors ${
                            isDone
                              ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50'
                              : 'text-neutral-400 hover:text-emerald-600 hover:bg-neutral-100'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Title with Alert Icon */}
                      <h4
                        className={`text-xs font-semibold mb-2 leading-relaxed flex items-start gap-1.5 ${
                          isDone ? 'line-through text-neutral-400' : 'text-neutral-900'
                        }`}
                      >
                        {!isDone && dateStatus.isOverdue && (
                          <span title={`Prazo expirado: ${dateStatus.label}`} className="shrink-0 flex items-center mt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          </span>
                        )}
                        {!isDone && dateStatus.isToday && (
                          <span title="Vence hoje!" className="shrink-0 flex items-center mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          </span>
                        )}
                        {!isDone && dateStatus.isSoon && (
                          <span title={`Conclusão próxima: ${dateStatus.label}`} className="shrink-0 flex items-center mt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                        <span className="flex-1">{task.title}</span>
                      </h4>

                      {/* Description Preview (if any) */}
                      {task.description && (
                        <p className="text-[11px] text-neutral-500 line-clamp-2 mb-2.5">
                          {task.description}
                        </p>
                      )}

                      {/* Mandatory Dates and Duration Box */}
                      <div className="p-2 rounded-md bg-stone-50 border border-stone-200/60 mb-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-neutral-700">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-neutral-400" />
                            {formatDateShort(task.startDate)} → {formatDateShort(task.endDate)}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {duration}d
                          </span>
                        </div>

                        {/* Overdue / Due status */}
                        {!isDone && (
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            {dateStatus.isOverdue ? (
                              <span className="text-rose-700 font-semibold flex items-center gap-1 bg-rose-100/60 px-1.5 py-0.2 rounded-xs">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                {dateStatus.label}
                              </span>
                            ) : dateStatus.isToday ? (
                              <span className="text-amber-800 font-semibold flex items-center gap-1 bg-amber-100/60 px-1.5 py-0.2 rounded-xs">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Vence hoje!
                              </span>
                            ) : dateStatus.isSoon ? (
                              <span className="text-amber-800 font-medium flex items-center gap-1 bg-amber-50 px-1.5 py-0.2 rounded-xs border border-amber-200/60">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                {dateStatus.label}
                              </span>
                            ) : (
                              <span className="text-stone-500 font-mono">
                                {dateStatus.label}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Checklist count (if present) */}
                      {totalChecklist > 0 && (
                        <div className="text-[11px] text-neutral-500 font-mono mb-2 flex items-center gap-1">
                          <span>Checklist: {completedChecklist}/{totalChecklist}</span>
                        </div>
                      )}

                      {/* Footer: Responsible + Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                        {/* Responsible */}
                        <div className="flex items-center gap-1.5 min-w-0" title={responsible ? `${responsible.name} (${responsible.role})` : 'Sem responsável'}>
                          {responsible ? (
                            <>
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 ${responsible.avatarColor}`}>
                                {responsible.initials}
                              </div>
                              <span className="text-[11px] text-neutral-700 truncate max-w-[100px]">
                                {responsible.name.split(' ')[0]}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-neutral-400 italic">Não atribuído</span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          {col.id !== 'a_fazer' && (
                            <button
                              type="button"
                              onClick={() => moveColumn(task, 'prev')}
                              title="Mover para coluna anterior"
                              className="p-1 text-neutral-400 hover:text-neutral-700 rounded hover:bg-neutral-100"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {col.id !== 'concluida' && (
                            <button
                              type="button"
                              onClick={() => moveColumn(task, 'next')}
                              title="Avançar para próxima coluna"
                              className="p-1 text-neutral-400 hover:text-neutral-700 rounded hover:bg-neutral-100"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            title="Editar tarefa"
                            className="p-1 text-neutral-400 hover:text-stone-800 rounded hover:bg-neutral-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            title="Excluir tarefa"
                            className="p-1 text-neutral-400 hover:text-rose-600 rounded hover:bg-neutral-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
