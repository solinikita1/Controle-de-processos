import React, { useState, useMemo } from 'react';
import { Project, Task, TeamMember } from '../types';
import { GanttTimeline } from './GanttTimeline';
import { InteractiveD3Gantt } from './InteractiveD3Gantt';
import { Calendar, Building2, Filter, GripHorizontal, List, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface OverallTimelineProps {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  onEditTask: (task: Task) => void;
  onSelectProject: (projectId: string) => void;
  onUpdateTaskDates: (taskId: string, newStartDate: string, newEndDate: string) => void;
}

export const OverallTimeline: React.FC<OverallTimelineProps> = ({
  projects,
  tasks,
  teamMembers,
  onEditTask,
  onSelectProject,
  onUpdateTaskDates,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'d3_interactive' | 'classic_gantt'>('d3_interactive');

  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.completed || t.status === 'concluida').length;
    const inProgress = filteredTasks.filter((t) => t.status === 'em_andamento').length;
    const critical = filteredTasks.filter((t) => t.priority === 'critica' && !t.completed).length;
    return { total, completed, inProgress, critical };
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Workplace Arquitetura Corporativa
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Motor D3 Integrado
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Cronograma Físico Interativo do Escritório
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Visualização contínua com arraste interativo de tarefas e prazos via D3.js. Mova qualquer entrega diretamente na linha do tempo.
          </p>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Switcher */}
          <div className="bg-neutral-100 p-1 rounded-xl border border-neutral-200 flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('d3_interactive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'd3_interactive'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <GripHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Cronograma D3 (Arrastar)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('classic_gantt')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'classic_gantt'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Gantt Clássico</span>
            </button>
          </div>

          {/* Project Selector Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs border-0 bg-transparent text-neutral-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">Todos os Projetos ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metric summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-neutral-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Tarefas no Período</span>
          <span className="text-lg font-bold font-mono text-neutral-900 tabular-nums">{stats.total}</span>
        </div>
        <div className="p-3 bg-white border border-neutral-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Em Andamento</span>
          <span className="text-lg font-bold font-mono text-amber-600 tabular-nums">{stats.inProgress}</span>
        </div>
        <div className="p-3 bg-white border border-neutral-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Concluídas</span>
          <span className="text-lg font-bold font-mono text-emerald-600 tabular-nums">{stats.completed}</span>
        </div>
        <div className="p-3 bg-white border border-neutral-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Prioridade Crítica</span>
          <span className="text-lg font-bold font-mono text-rose-600 tabular-nums">{stats.critical}</span>
        </div>
      </div>

      {/* Projects Timeline Strip (Each Project's Macro Date Range) */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-stone-700" />
            Prazos Contratuais dos Projetos Corporativos
          </h3>
          <span className="text-[11px] text-neutral-500">
            Clique em um projeto para filtrar o cronograma
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {projects.map((p) => {
            const projectTasks = tasks.filter((t) => t.projectId === p.id);
            const done = projectTasks.filter((t) => t.completed || t.status === 'concluida').length;
            const pct = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;
            const isSelected = selectedProjectId === p.id;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(isSelected ? 'all' : p.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400'
                    : 'border-neutral-200 bg-stone-50/50 hover:bg-white hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mb-1">
                  <span className="font-bold text-stone-900">{p.code}</span>
                  <span className="font-sans font-bold text-neutral-900 tabular-nums">{pct}%</span>
                </div>
                <h4 className="text-xs font-bold text-neutral-900 truncate mb-1">{p.name}</h4>
                <div className="text-[11px] font-mono text-neutral-600 tabular-nums">
                  {p.startDate} → {p.targetEndDate}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* D3 Interactive Timeline OR Classic Gantt */}
      {viewMode === 'd3_interactive' ? (
        <InteractiveD3Gantt
          tasks={filteredTasks}
          projects={projects}
          teamMembers={teamMembers}
          onEditTask={onEditTask}
          onUpdateTaskDates={onUpdateTaskDates}
          onSelectProject={onSelectProject}
        />
      ) : (
        <GanttTimeline
          tasks={filteredTasks}
          teamMembers={teamMembers}
          onEditTask={onEditTask}
        />
      )}

    </div>
  );
};
