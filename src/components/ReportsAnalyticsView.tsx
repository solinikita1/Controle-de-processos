import React, { useState } from 'react';
import { Project, Task, TeamMember, StudioStats } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { formatDatePT, formatDateShort, checkDateStatus } from '../utils/dateUtils';
import { exportAllProjectsToCsv } from '../utils/exportUtils';
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  Users,
  Layers,
  Filter,
  Download,
  ShieldAlert,
  Calendar,
  Sparkles,
  ArrowRight,
  Archive
} from 'lucide-react';

interface ReportsAnalyticsViewProps {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  stats: StudioStats;
  onSelectProject: (projectId: string) => void;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  projects,
  tasks,
  teamMembers,
  stats,
  onSelectProject,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativos' | 'arquivados' | 'atrasados'>('ativos');

  const filteredProjects = projects.filter((p) => {
    if (filterStatus === 'ativos') return !p.isArchived;
    if (filterStatus === 'arquivados') return p.isArchived;
    if (filterStatus === 'atrasados') {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const isDone = pTasks.length > 0 && pTasks.every((t) => t.completed || t.status === 'concluida');
      return checkDateStatus(p.targetEndDate, isDone).isOverdue;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    exportAllProjectsToCsv(projects, tasks);
  };

  // Team productivity breakdown
  const teamReport = teamMembers.map((member) => {
    const memberTasks = tasks.filter((t) => t.responsibleId === member.id);
    const completed = memberTasks.filter((t) => t.completed || t.status === 'concluida').length;
    const pending = memberTasks.length - completed;
    const overdue = memberTasks.filter((t) => {
      if (t.completed || t.status === 'concluida') return false;
      return checkDateStatus(t.endDate, false).isOverdue;
    }).length;
    const rate = memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0;

    return {
      member,
      total: memberTasks.length,
      completed,
      pending,
      overdue,
      rate,
    };
  });

  // Financial summary
  const totalCapex = projects.reduce((acc, p) => acc + (p.estimatedBudgetBRL || 0), 0);
  const totalM2 = projects.reduce((acc, p) => acc + (p.areaM2 || 0), 0);
  const avgM2Cost = totalM2 > 0 ? totalCapex / totalM2 : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Workplace Intelligence
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Painel de Relatórios & SLA (Estilo monday.com)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Central Executiva de Relatórios & Produtividade
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5 max-w-3xl">
            Visão consolidada de prazos contratuais, orçamento em carteira, desempenho técnico dos 18 colaboradores e esteira de entregas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Exportar Excel (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold text-stone-900 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-neutral-700" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Top Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Capex em Gestão</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 font-mono tabular-nums">
            R$ {(totalCapex / 1000000).toFixed(1)}M
          </div>
          <span className="text-[10px] text-neutral-400">R$ {avgM2Cost.toFixed(0)} / m² médio</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Área Corporativa</span>
            <Building2 className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 font-mono tabular-nums">
            {totalM2.toLocaleString('pt-BR')} m²
          </div>
          <span className="text-[10px] text-neutral-400">{projects.length} lajes e sedes corporativas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Taxa Global de Entregas</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono tabular-nums">
            {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
          </div>
          <span className="text-[10px] text-neutral-400">
            {stats.completedTasks} de {stats.totalTasks} tarefas concluídas
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold">Tarefas em Atraso</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono tabular-nums">
            {stats.overdueTasks}
          </div>
          <span className="text-[10px] text-rose-500">{stats.criticalTasks} com prioridade alta/crítica</span>
        </div>
      </div>

      {/* SECTION 1: RELATÓRIO DE DESEMPENHO E CARGA DA EQUIPE */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-800" />
              1. Relatório de Produtividade & Carga da Equipe ({teamMembers.length} Colaboradores)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Volume de tarefas entregues, pendentes e em risco por arquiteto e engenheiro.
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
            Sincronizado @workplace.arq.br
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                <th className="pb-2.5">Profissional</th>
                <th className="pb-2.5">Cargo / Área</th>
                <th className="pb-2.5 text-center">Total Tarefas</th>
                <th className="pb-2.5 text-center">Concluídas</th>
                <th className="pb-2.5 text-center">Pendentes</th>
                <th className="pb-2.5 text-center">Em Atraso</th>
                <th className="pb-2.5 text-right">Taxa de Conclusão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {teamReport.map(({ member, total, completed, pending, overdue, rate }, idx) => (
                <tr key={`${member.id}-${idx}`} className="hover:bg-neutral-50/70 transition-colors">
                  <td className="py-2.5 flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${member.avatarColor}`}>
                      {member.initials}
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block leading-tight">{member.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{member.email}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-neutral-600">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-mono font-bold text-neutral-900">{total}</td>
                  <td className="py-2.5 text-center font-mono text-emerald-700 font-semibold">{completed}</td>
                  <td className="py-2.5 text-center font-mono text-neutral-600">{pending}</td>
                  <td className="py-2.5 text-center font-mono">
                    {overdue > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                        {overdue} atrasada{overdue > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-neutral-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-neutral-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-stone-900 h-full rounded-full"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-neutral-900 tabular-nums">{rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: RELATÓRIO DO PORTFÓLIO DE PROJETOS COM STATUS E ARQUIVAMENTO */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-800" />
              2. Status Consolidado do Portfólio de Projetos
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Acompanhamento de prazos, entregas, arquivamento e SLA contratual.
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('ativos')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                filterStatus === 'ativos' ? 'bg-white text-stone-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Ativos ({projects.filter((p) => !p.isArchived).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('arquivados')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                filterStatus === 'arquivados' ? 'bg-white text-stone-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Arquivados ({projects.filter((p) => p.isArchived).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('atrasados')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                filterStatus === 'atrasados' ? 'bg-white text-rose-700 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Em Atraso
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 font-semibold rounded-md transition-all ${
                filterStatus === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Todos ({projects.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-semibold uppercase text-[10px]">
                <th className="pb-2.5">Código / Projeto</th>
                <th className="pb-2.5">Cliente</th>
                <th className="pb-2.5">Fase Atual</th>
                <th className="pb-2.5">Prioridade</th>
                <th className="pb-2.5">Prazo Contratual</th>
                <th className="pb-2.5 text-center">Status</th>
                <th className="pb-2.5 text-right">Progresso</th>
                <th className="pb-2.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProjects.map((project) => {
                const pTasks = tasks.filter((t) => t.projectId === project.id);
                const done = pTasks.filter((t) => t.completed || t.status === 'concluida').length;
                const progress = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
                const phase = ARCHITECTURE_PHASES.find((ph) => ph.id === project.currentPhase);
                const dateCheck = checkDateStatus(project.targetEndDate, progress === 100);

                return (
                  <tr key={project.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-2.5">
                      <span className="font-mono text-[10px] text-neutral-400 font-bold block">{project.code}</span>
                      <strong className="font-bold text-neutral-900 hover:text-stone-700 cursor-pointer" onClick={() => onSelectProject(project.id)}>
                        {project.name}
                      </strong>
                    </td>
                    <td className="py-2.5 text-neutral-700 font-medium">{project.client}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-stone-100 text-stone-800 text-[11px] font-semibold">
                        <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: phase?.color || '#000' }} />
                        {phase?.shortName || project.currentPhase}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {project.priority === 'p1_urgente' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          P1 Urgente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700">
                          {project.priority ? project.priority.toUpperCase().replace('_', ' ') : 'P2 ALTA'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 font-mono text-[11px]">
                      {formatDateShort(project.startDate)} → {formatDateShort(project.targetEndDate)}
                      {dateCheck.isOverdue && (
                        <span className="block text-[10px] font-bold text-rose-600">{dateCheck.label}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {project.isArchived ? (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold flex items-center justify-center gap-1">
                          <Archive className="w-3 h-3" />
                          Arquivado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          {project.status}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-neutral-900">
                      {progress}%
                      <span className="block text-[10px] text-neutral-400 font-normal">
                        ({done}/{pTasks.length} tarefas)
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectProject(project.id)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-md transition-colors"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
