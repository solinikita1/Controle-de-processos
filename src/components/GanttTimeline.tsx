import React, { useState, useMemo } from 'react';
import { Task, TeamMember } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { formatDateShort, calculateDaysDifference, checkDateStatus } from '../utils/dateUtils';
import { Calendar, User, Flag, CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface GanttTimelineProps {
  tasks: Task[];
  teamMembers: TeamMember[];
  onEditTask: (task: Task) => void;
  projectStartDate?: string;
  projectEndDate?: string;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  tasks,
  teamMembers,
  onEditTask,
}) => {
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterPhase !== 'all' && t.phase !== filterPhase) return false;
      if (filterResponsible !== 'all' && t.responsibleId !== filterResponsible) return false;
      return true;
    });
  }, [tasks, filterPhase, filterResponsible]);

  // Compute overall timeline bounds
  const { minDate, maxDate, totalTimelineDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      const min = new Date(now.getFullYear(), now.getMonth(), 1);
      const max = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return {
        minDate: min,
        maxDate: max,
        totalTimelineDays: Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;

    tasks.forEach((t) => {
      if (t.startDate) {
        const s = new Date(t.startDate + 'T00:00:00').getTime();
        if (s < minTime) minTime = s;
      }
      if (t.endDate) {
        const e = new Date(t.endDate + 'T00:00:00').getTime();
        if (e > maxTime) maxTime = e;
      }
    });

    // Add padding of 3 days before and 5 days after
    const padMin = new Date(minTime - 3 * 24 * 60 * 60 * 1000);
    const padMax = new Date(maxTime + 5 * 24 * 60 * 60 * 1000);
    const totalDays = Math.max(Math.ceil((padMax.getTime() - padMin.getTime()) / (1000 * 60 * 60 * 24)) + 1, 14);

    return {
      minDate: padMin,
      maxDate: padMax,
      totalTimelineDays: totalDays,
    };
  }, [tasks]);

  // Today offset percentage
  const todayOffset = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = today.getTime() - minDate.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0 || days > totalTimelineDays) return null;
    return (days / totalTimelineDays) * 100;
  }, [minDate, totalTimelineDays]);

  // Calculate task bar positioning
  const getTaskPosition = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');

    const startDiff = (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1, 1);

    const left = Math.max(0, (startDiff / totalTimelineDays) * 100);
    const width = Math.min(100 - left, Math.max((duration / totalTimelineDays) * 100, 2.5));

    return { left: `${left.toFixed(2)}%`, width: `${width.toFixed(2)}%` };
  };

  const getPhaseColor = (phaseId: string) => {
    const p = ARCHITECTURE_PHASES.find((item) => item.id === phaseId);
    return p ? p.color : '#64748B';
  };

  const getMember = (id: string) => teamMembers.find((m) => m.id === id);

  // Generate week marks
  const weekTicks = useMemo(() => {
    const ticks: { date: Date; leftPct: number; label: string }[] = [];
    const curr = new Date(minDate);
    curr.setDate(curr.getDate() + (7 - curr.getDay())); // Next Sunday/Monday

    while (curr <= maxDate) {
      const diff = (curr.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      const leftPct = (diff / totalTimelineDays) * 100;
      if (leftPct >= 0 && leftPct <= 100) {
        ticks.push({
          date: new Date(curr),
          leftPct,
          label: `${curr.getDate()}/${curr.getMonth() + 1}`,
        });
      }
      curr.setDate(curr.getDate() + 7);
    }
    return ticks;
  }, [minDate, maxDate, totalTimelineDays]);

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
      
      {/* Timeline Controls */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Cronograma Físico de Execução (Gantt)
          </h4>
          <span className="text-xs font-mono text-neutral-500 tabular-nums">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'tarefa' : 'tarefas'} no período
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Phase Filter */}
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 focus:outline-hidden"
          >
            <option value="all">Todas as Fases</option>
            {ARCHITECTURE_PHASES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortName} - {p.name}
              </option>
            ))}
          </select>

          {/* Responsible Filter */}
          <select
            value={filterResponsible}
            onChange={(e) => setFilterResponsible(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 focus:outline-hidden"
          >
            <option value="all">Todos os Responsáveis</option>
            {teamMembers.map((m, idx) => (
              <option key={`gantt-resp-${m.id}-${idx}`} value={m.id}>
                {m.name} ({m.initials})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Gantt Area */}
      <div className="overflow-x-auto">
        <div className="min-w-[840px]">
          
          {/* Timeline Time Header */}
          <div className="grid grid-cols-12 border-b border-neutral-200 bg-stone-50/60 text-[11px] font-semibold text-neutral-500 select-none">
            <div className="col-span-4 p-3 border-r border-neutral-200 uppercase tracking-wider">
              Atividade & Responsável
            </div>
            <div className="col-span-8 p-3 relative h-10">
              <div className="absolute inset-0 flex items-center px-2">
                <span className="text-[10px] font-mono text-neutral-400">
                  {formatDateShort(minDate.toISOString().slice(0, 10))}
                </span>
                <span className="flex-1 text-center text-[10px] font-mono text-neutral-400">
                  Escala Temporal (Dias de Obra e Projeto)
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {formatDateShort(maxDate.toISOString().slice(0, 10))}
                </span>
              </div>

              {/* Week Tick Marks */}
              {weekTicks.map((tick, i) => (
                <div
                  key={i}
                  style={{ left: `${tick.leftPct}%` }}
                  className="absolute bottom-1 -translate-x-1/2 text-[9px] font-mono text-neutral-400"
                >
                  {tick.label}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Rows */}
          <div className="divide-y divide-neutral-100 relative">
            
            {/* "Hoje" vertical line indicator across all rows */}
            {todayOffset !== null && (
              <div
                style={{ left: `calc(33.333% + ${todayOffset * 0.6666}%)` }}
                className="absolute top-0 bottom-0 w-px bg-rose-500 z-20 pointer-events-none"
              >
                <div className="sticky top-0 -translate-x-1/2 bg-rose-500 text-white text-[9px] font-mono font-bold px-1 rounded-b shadow-xs">
                  HOJE
                </div>
              </div>
            )}

            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                Nenhuma tarefa correspondente aos filtros selecionados.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const responsible = getMember(task.responsibleId);
                const pos = getTaskPosition(task.startDate, task.endDate);
                const phaseColor = getPhaseColor(task.phase);
                const dateStatus = checkDateStatus(task.endDate, task.completed || task.status === 'concluida');
                const duration = calculateDaysDifference(task.startDate, task.endDate);

                return (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className="grid grid-cols-12 items-center hover:bg-stone-50/70 cursor-pointer transition-colors group"
                  >
                    {/* Left Column: Task Info & Responsible */}
                    <div className="col-span-4 p-3 border-r border-neutral-200 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {task.completed || task.status === 'concluida' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : dateStatus.isOverdue ? (
                            <span title={`Atrasada: ${dateStatus.label}`} className="shrink-0 flex items-center">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            </span>
                          ) : dateStatus.isToday ? (
                            <span title="Vence hoje!" className="shrink-0 flex items-center">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            </span>
                          ) : dateStatus.isSoon ? (
                            <span title={`Conclusão próxima: ${dateStatus.label}`} className="shrink-0 flex items-center">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          )}
                          <span
                            className={`text-xs font-semibold truncate ${
                              task.completed || task.status === 'concluida'
                                ? 'line-through text-neutral-400'
                                : 'text-neutral-900 group-hover:text-stone-900'
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                          <span className="font-mono tabular-nums">
                            {formatDateShort(task.startDate)} → {formatDateShort(task.endDate)} ({duration}d)
                          </span>
                          {responsible && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[120px]">{responsible.name.split(' ')[0]}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {responsible && (
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 ${responsible.avatarColor}`}
                          title={responsible.name}
                        >
                          {responsible.initials}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Visual Timeline Bar */}
                    <div className="col-span-8 p-3 relative h-12 flex items-center">
                      
                      {/* Grid background lines */}
                      {weekTicks.map((tick, i) => (
                        <div
                          key={i}
                          style={{ left: `${tick.leftPct}%` }}
                          className="absolute top-0 bottom-0 w-px bg-neutral-100 pointer-events-none"
                        />
                      ))}

                      {/* Task Bar */}
                      <div
                        style={{
                          left: pos.left,
                          width: pos.width,
                        }}
                        className={`absolute h-7 rounded-md shadow-xs flex items-center px-2 text-white overflow-hidden transition-all group-hover:scale-[1.02] ${
                          task.completed || task.status === 'concluida'
                            ? 'bg-emerald-600 opacity-90'
                            : dateStatus.isOverdue
                            ? 'bg-rose-600 ring-2 ring-rose-400'
                            : (dateStatus.isToday || dateStatus.isSoon)
                            ? 'bg-amber-600 ring-2 ring-amber-400'
                            : 'bg-stone-800'
                        }`}
                      >
                        {/* Progress or phase stripe */}
                        <div
                          style={{ backgroundColor: phaseColor }}
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                        />
                        <span className="text-[11px] font-medium truncate ml-1 text-white select-none">
                          {task.completed ? '✓ ' : ''}{task.title}
                        </span>
                      </div>

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </div>
      </div>

      {/* Legend Footer */}
      <div className="p-3 bg-stone-50/70 border-t border-neutral-200 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-neutral-700">Legenda de Fases:</span>
          {ARCHITECTURE_PHASES.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: p.color }} />
              <span className="text-[11px] text-neutral-600">{p.shortName}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
            <span className="text-[11px]">Concluída (Já fez)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600" />
            <span className="text-[11px]">Atrasada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-600" />
            <span className="text-[11px]">Conclusão Próxima</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-stone-800" />
            <span className="text-[11px]">No Prazo</span>
          </div>
        </div>
      </div>

    </div>
  );
};
