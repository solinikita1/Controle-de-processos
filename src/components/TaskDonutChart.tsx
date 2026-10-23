import React, { useState, useMemo } from 'react';
import { Project, Task } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Building2, PieChart as PieIcon } from 'lucide-react';

interface TaskDonutChartProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject: (projectId: string) => void;
}

export const TaskDonutChart: React.FC<TaskDonutChartProps> = ({
  projects,
  tasks,
  onSelectProject,
}) => {
  // Selected project ID for the donut chart (or 'all' for office-wide)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Compute tasks for the selected project or all projects
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const relevantTasks = useMemo(() => {
    if (selectedProjectId === 'all') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const { completedCount, pendingCount, overdueCount, totalCount, completionRate } = useMemo(() => {
    const total = relevantTasks.length;
    const completed = relevantTasks.filter((t) => t.completed || t.status === 'concluida').length;
    const pending = total - completed;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = relevantTasks.filter((t) => {
      if (t.completed || t.status === 'concluida') return false;
      if (!t.endDate) return false;
      const end = new Date(t.endDate + 'T00:00:00');
      return end.getTime() < today.getTime();
    }).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completedCount: completed,
      pendingCount: pending,
      overdueCount: overdue,
      totalCount: total,
      completionRate: rate,
    };
  }, [relevantTasks]);

  // Chart data for Recharts Pie
  const chartData = useMemo(() => {
    if (totalCount === 0) {
      return [{ name: 'Sem tarefas', value: 1, color: '#E5E7EB' }];
    }
    return [
      {
        name: 'Concluídas (Já Fez)',
        value: completedCount,
        color: '#10B981', // emerald-500
      },
      {
        name: 'Pendentes / Em Andamento',
        value: pendingCount,
        color: '#44403C', // stone-700
      },
    ];
  }, [completedCount, pendingCount, totalCount]);

  // Projects comparison stats
  const projectComparisons = useMemo(() => {
    return projects.map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const done = pTasks.filter((t) => t.completed || t.status === 'concluida').length;
      const total = pTasks.length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        client: p.client,
        done,
        pending: total - done,
        total,
        rate,
      };
    });
  }, [projects, tasks]);

  // Custom Recharts Tooltip
  const renderTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const item = payload[0];
      const pct = totalCount > 0 ? ((item.value / totalCount) * 100).toFixed(0) : 0;
      return (
        <div className="bg-stone-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-stone-800">
          <div className="font-semibold text-stone-200">{item.name}</div>
          <div className="font-mono text-sm font-bold text-amber-400 mt-0.5 tabular-nums">
            {item.value} {item.value === 1 ? 'tarefa' : 'tarefas'} ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
      
      {/* Header and Project Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-stone-100 text-stone-800 rounded-md">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Proporção de Tarefas: Concluídas vs. Pendentes
            </h3>
            <p className="text-[11px] text-neutral-500">
              Acompanhamento gráfico em tempo real por projeto ou geral do escritório.
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-neutral-500 hidden md:inline">Filtrar por:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs px-3 py-1.5 border border-neutral-300 rounded-lg bg-neutral-50/50 hover:bg-white text-neutral-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-stone-400 cursor-pointer"
          >
            <option value="all">Visão Geral (Todos os Projetos)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Donut Chart on Left, Project Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-center">
        
        {/* Left Side: Donut Chart + Central Percentage */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
          <div className="relative w-full max-w-[260px] h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={66}
                  outerRadius={92}
                  paddingAngle={totalCount > 1 ? 3 : 0}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={renderTooltip} />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Donut Overlay Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-3xl font-extrabold font-mono text-neutral-900 tracking-tight tabular-nums">
                {completionRate}%
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mt-0.5">
                Concluído
              </span>
              <span className="text-[10px] font-mono text-neutral-500 tabular-nums">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex items-center justify-center gap-5 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 shrink-0" />
              <span className="text-neutral-700 font-medium">Concluídas ({completedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-stone-700 shrink-0" />
              <span className="text-neutral-700 font-medium">Pendentes ({pendingCount})</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center gap-1 text-rose-600 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{overdueCount} em atraso</span>
              </div>
            )}
          </div>

          {/* Quick Info Text */}
          <div className="mt-3 text-center">
            <span className="text-[11px] text-neutral-500">
              {currentProject ? (
                <>
                  Projeto: <strong className="text-neutral-900">{currentProject.name}</strong> ({currentProject.client})
                </>
              ) : (
                <>Mostrando a soma de todas as tarefas de arquitetura corporativa do escritório.</>
              )}
            </span>
          </div>
        </div>

        {/* Right Side: Comparative Breakdown by Project */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="font-bold uppercase tracking-wider text-neutral-700">
              Comparativo de Desempenho por Projeto
            </span>
            <span className="text-neutral-400 text-[11px]">Clique para abrir o projeto</span>
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {projectComparisons.map((item) => {
              const isSelected = selectedProjectId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedProjectId(item.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-stone-900 bg-stone-50/90 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-neutral-500 shrink-0">{item.code}</span>
                      <span className="text-xs font-bold text-neutral-900 truncate">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-neutral-900 tabular-nums">
                        {item.rate}%
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(item.id);
                        }}
                        title="Abrir tela deste projeto"
                        className="p-1 text-neutral-400 hover:text-stone-900 hover:bg-neutral-200/60 rounded"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dual color progress bar representing Completed vs Pending */}
                  <div className="w-full bg-stone-700 h-2 rounded-full overflow-hidden flex">
                    {/* Emerald completed segment */}
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${item.rate}%` }}
                      title={`${item.done} concluídas (${item.rate}%)`}
                    />
                    {/* The rest is stone-700 representing pending */}
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-500 font-mono tabular-nums">
                    <span>
                      <strong className="text-emerald-700">{item.done}</strong> feitas · <strong className="text-neutral-700">{item.pending}</strong> pendentes
                    </span>
                    <span>Total: {item.total} tarefas</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
