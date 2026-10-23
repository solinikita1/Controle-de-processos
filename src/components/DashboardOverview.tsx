import React, { useState } from 'react';
import { Project, Task, TeamMember, StudioStats } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { formatDateShort, checkDateStatus, calculateDaysDifference } from '../utils/dateUtils';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Plus,
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  TrendingUp,
  FolderOpen,
  FileDown,
  Archive,
  ArchiveRestore,
  Copy,
  Trash2,
  FileSpreadsheet,
  MoreVertical,
  Download,
  Database
} from 'lucide-react';
import { PdfExportModal } from './PdfExportModal';
import { TaskDonutChart } from './TaskDonutChart';
import { AuthUser } from '../types';

interface DashboardOverviewProps {
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  stats: StudioStats;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onNewTeamMember: () => void;
  currentUser?: AuthUser | null;
  onOpenAuthModal?: () => void;
  onNavigateToMyTasks?: () => void;
  onNavigateToEsteira?: () => void;
  onNewBriefing?: () => void;
  onOpenBackupModal?: () => void;
  onDeleteProject?: (projectId: string) => void;
  onToggleArchiveProject?: (projectId: string) => void;
  onDuplicateProject?: (projectId: string) => void;
  onExportProjectCsv?: (project: Project) => void;
  onExportAllCsv?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  projects,
  tasks,
  teamMembers,
  stats,
  onSelectProject,
  onNewProject,
  onNewTeamMember,
  currentUser,
  onOpenAuthModal,
  onNavigateToMyTasks,
  onNavigateToEsteira,
  onNewBriefing,
  onDeleteProject,
  onToggleArchiveProject,
  onDuplicateProject,
  onExportProjectCsv,
  onExportAllCsv,
  onOpenBackupModal,
}) => {
  const [pdfProject, setPdfProject] = useState<Project | null>(null);
  const [projectFilterTab, setProjectFilterTab] = useState<'ativos' | 'todos' | 'arquivados'>('ativos');
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);
  const getMember = (id: string) => teamMembers.find((m) => m.id === id);

  // User tasks
  const userPendingTasks = currentUser
    ? tasks.filter((t) => t.responsibleId === currentUser.id && !t.completed && t.status !== 'concluida')
    : [];

  // Urgent upcoming or overdue tasks across the whole studio
  const urgentTasks = tasks
    .filter((t) => !t.completed && t.status !== 'concluida')
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      
      {/* Studio Header & Executive Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Workplace Arquitetura Corporativa
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="text-xs text-neutral-400">São Paulo - SP</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-950 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Criado & Desenvolvido por Solimar Isaac (Soli)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Painel Executivo de Arquitetura Corporativa
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestão integrada de projetos, cronogramas contratuais, esteira de novos briefings e equipe corporativa ({teamMembers.length} profissionais).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenBackupModal && (
            <button
              type="button"
              onClick={onOpenBackupModal}
              title="Abrir Central de Backup & Restauração"
              className="px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-amber-600" />
              Backup
            </button>
          )}
          <button
            type="button"
            onClick={onNewTeamMember}
            className="px-3 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            + Profissional
          </button>
          {onNewBriefing && (
            <button
              type="button"
              onClick={onNewBriefing}
              className="px-3.5 py-2 text-xs font-bold text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileDown className="w-3.5 h-3.5 text-pink-600" />
              + Nova Demanda (Briefing)
            </button>
          )}
          <button
            type="button"
            onClick={onNewProject}
            className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Novo Projeto
          </button>
        </div>
      </div>

      {/* Microsoft SSO Status Banner */}
      {currentUser && (
        <div className="bg-white rounded-xl border border-neutral-200 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5 shrink-0">
              <div className="bg-[#f25022] rounded-3xs" />
              <div className="bg-[#7fba00] rounded-3xs" />
              <div className="bg-[#00a4ef] rounded-3xs" />
              <div className="bg-[#ffb900] rounded-3xs" />
            </div>
            <div className="text-xs">
              <span className="text-neutral-500">Conectado via Microsoft 365: </span>
              <strong className="text-neutral-900">{currentUser.name}</strong>
              <span className="text-neutral-400 font-mono ml-1.5">({currentUser.email})</span>
              {currentUser.isDirector && (
                <span className="ml-2 px-1.5 py-0.2 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-xs uppercase">
                  {currentUser.role.includes('CEO') ? 'CEO' : currentUser.role.includes('CSO') ? 'CSO' : 'Diretoria'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToMyTasks && (
              <button
                type="button"
                onClick={onNavigateToMyTasks}
                className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                Minhas Tarefas ({userPendingTasks.length} pendentes)
              </button>
            )}
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Trocar Perfil
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Projects */}
        <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider">Projetos Ativos</span>
            <Building2 className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {stats.activeProjects}
            <span className="text-xs font-normal text-neutral-500 ml-1.5">/ {stats.totalProjects} total</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Escritórios e sedes em carteira</p>
        </div>

        {/* Metric 2: Total M2 */}
        <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider">Área Corporativa</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {stats.totalAreaM2.toLocaleString('pt-BR')}
            <span className="text-xs font-normal text-neutral-500 ml-1">m²</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Metragem quadrada total em projeto</p>
        </div>

        {/* Metric 3: Task Progress */}
        <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider">Tarefas Técnicas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {stats.completedTasks}
            <span className="text-xs font-normal text-neutral-500 ml-1.5">/ {stats.totalTasks} concluídas</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% de produtividade do escritório
          </p>
        </div>

        {/* Metric 4: Deadlines & Overdue */}
        <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1.5">
            <span className="font-semibold uppercase tracking-wider">Alertas de Prazo</span>
            {stats.overdueTasks > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <Clock className="w-4 h-4 text-neutral-400" />
            )}
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
            {stats.overdueTasks > 0 ? (
              <span className="text-rose-600">{stats.overdueTasks}</span>
            ) : (
              <span className="text-emerald-700">0</span>
            )}
            <span className="text-xs font-normal text-neutral-500 ml-1.5">
              {stats.overdueTasks === 1 ? 'atrasada' : 'atrasadas'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {stats.criticalTasks} tarefas com prioridade alta ou crítica
          </p>
        </div>

      </div>

      {/* Recharts Donut Chart: Completed vs Pending Tasks by Project */}
      <TaskDonutChart
        projects={projects}
        tasks={tasks}
        onSelectProject={onSelectProject}
      />

      {/* Esteira de Entrada & Novos Briefings Section */}
      <div className="bg-white rounded-2xl border border-pink-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-600 animate-pulse" />
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Esteira de Entrada & Briefings Comerciais
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-100 text-pink-800 rounded-full border border-pink-200">
                Fila de Kickoff
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Controle cronológico e de prioridade para que nenhum projeto fique perdido ou passe na frente dos outros.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNewBriefing && (
              <button
                type="button"
                onClick={onNewBriefing}
                className="px-3 py-1.5 text-xs font-bold text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-pink-600" />
                Nova Demanda
              </button>
            )}
            {onNavigateToEsteira && (
              <button
                type="button"
                onClick={onNavigateToEsteira}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>Ver Esteira Completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conveyor queue preview cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects
            .filter((p) => p.currentPhase === 'captacao_briefing' || p.status === 'briefing' || p.pipelineStage === 'briefing_concluido' || p.priority === 'p1_urgente')
            .slice(0, 3)
            .map((p, idx) => {
              const isP1 = p.priority === 'p1_urgente';
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-xs flex flex-col justify-between ${
                    isP1 ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400' : 'border-neutral-200 bg-stone-50/50 hover:border-neutral-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-neutral-500">
                        #{p.pipelineOrder || idx + 1} na Esteira
                      </span>
                      {isP1 ? (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          P1 · URGENTE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-full">
                          {p.priority ? p.priority.toUpperCase().replace('_', ' ') : 'P2 ALTA'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 leading-snug line-clamp-2">
                      {p.name}
                    </h4>

                    <div className="text-[11px] text-neutral-500">
                      Cliente: <strong className="text-neutral-800">{p.client}</strong>
                    </div>

                    {p.briefing && (
                      <div className="text-[10px] text-neutral-500 space-y-0.5 pt-1.5 border-t border-neutral-200/60">
                        <div className="text-pink-900 font-medium truncate">
                          Trazido por: {p.briefing.submittedByName}
                        </div>
                        <div className="text-neutral-400">
                          Entrada: {formatDateShort(p.entryDate || p.createdAt)} · Kickoff: {formatDateShort(p.briefing.targetKickoffDate)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Briefing OK
                    </span>
                    <span className="font-bold text-stone-900 flex items-center gap-0.5 hover:underline">
                      Abrir <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Grid of All Projects in Office */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Projetos do Escritório ({projects.length})
            </h2>
            <p className="text-xs text-neutral-500">
              Gerencie cronogramas, tarefas técnicas, arquivos e status de cada contrato.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center p-0.5 bg-neutral-200/70 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setProjectFilterTab('ativos')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  projectFilterTab === 'ativos'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-neutral-600 hover:text-stone-900'
                }`}
              >
                Ativos ({projects.filter((p) => !p.isArchived).length})
              </button>
              <button
                type="button"
                onClick={() => setProjectFilterTab('todos')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  projectFilterTab === 'todos'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-neutral-600 hover:text-stone-900'
                }`}
              >
                Todos ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectFilterTab('arquivados')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  projectFilterTab === 'arquivados'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-neutral-600 hover:text-stone-900'
                }`}
              >
                Arquivados ({projects.filter((p) => p.isArchived).length})
              </button>
            </div>

            {/* Export All to CSV */}
            {onExportAllCsv && (
              <button
                type="button"
                onClick={onExportAllCsv}
                title="Exportar planilha consolidada de todos os projetos em CSV Excel"
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Display filtered project list */}
        {(() => {
          const displayedProjects = projects.filter((p) => {
            if (projectFilterTab === 'ativos') return !p.isArchived;
            if (projectFilterTab === 'arquivados') return p.isArchived;
            return true;
          });

          if (displayedProjects.length === 0) {
            return (
              <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-xs text-neutral-500">
                {projectFilterTab === 'arquivados'
                  ? 'Nenhum projeto arquivado no momento. Você pode arquivar projetos concluídos a qualquer momento.'
                  : 'Nenhum projeto encontrado nesta categoria.'}
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayedProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const totalTasks = projectTasks.length;
                const completedTasks = projectTasks.filter((t) => t.completed || t.status === 'concluida').length;
                const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                const currentPhase = ARCHITECTURE_PHASES.find((p) => p.id === project.currentPhase);
                const dateStatus = checkDateStatus(project.targetEndDate, percentage === 100);
                const durationDays = calculateDaysDifference(project.startDate, project.targetEndDate);
                const isMenuOpen = activeMenuProjectId === project.id;

                return (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className={`group relative p-5 bg-white border rounded-xl hover:border-stone-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                      project.isArchived ? 'border-amber-200 bg-stone-50/50' : 'border-neutral-200'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Code + Phase + Action Menu */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-neutral-500">{project.code}</span>
                          {project.isArchived && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-xs bg-amber-100 text-amber-800 border border-amber-300">
                              Arquivado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-stone-100 text-stone-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: currentPhase?.color || '#000' }} />
                            {currentPhase ? currentPhase.shortName : project.currentPhase}
                          </span>

                          {/* Quick Card Context Menu */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuProjectId(isMenuOpen ? null : project.id)}
                              title="Opções do projeto"
                              className="p-1 text-neutral-400 hover:text-neutral-800 rounded-md hover:bg-neutral-100 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <div
                                className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-100"
                                onClick={() => setActiveMenuProjectId(null)}
                              >
                                {onExportProjectCsv && (
                                  <button
                                    type="button"
                                    onClick={() => onExportProjectCsv(project)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg text-left"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Exportar Excel (CSV)</span>
                                  </button>
                                )}

                                {onDuplicateProject && (
                                  <button
                                    type="button"
                                    onClick={() => onDuplicateProject(project.id)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 rounded-lg text-left"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-stone-600" />
                                    <span>Duplicar Projeto</span>
                                  </button>
                                )}

                                {onToggleArchiveProject && (
                                  <button
                                    type="button"
                                    onClick={() => onToggleArchiveProject(project.id)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-amber-50 rounded-lg text-left"
                                  >
                                    {project.isArchived ? (
                                      <>
                                        <ArchiveRestore className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Reativar Projeto</span>
                                      </>
                                    ) : (
                                      <>
                                        <Archive className="w-3.5 h-3.5 text-amber-700" />
                                        <span>Arquivar Projeto</span>
                                      </>
                                    )}
                                  </button>
                                )}

                                <div className="my-1 border-t border-neutral-100" />

                                {onDeleteProject && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteProject(project.id)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Excluir Projeto</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Project Name and Client */}
                      <h3 className="text-base font-bold text-neutral-900 group-hover:text-stone-900 leading-snug">
                        {project.name}
                      </h3>
                      <div className="text-xs text-neutral-500 font-medium mt-1">
                        Cliente: <span className="text-neutral-800">{project.client}</span>
                      </div>

                      <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </p>

                      {/* Specs Pill row */}
                      <div className="flex items-center gap-3 text-xs text-neutral-600 mt-3 pt-3 border-t border-neutral-100">
                        <div>
                          <span className="text-neutral-400 text-[11px] block">Área</span>
                          <span className="font-mono font-semibold text-neutral-900 tabular-nums">
                            {project.areaM2.toLocaleString('pt-BR')} m²
                          </span>
                        </div>
                        <span className="text-neutral-300">·</span>
                        <div>
                          <span className="text-neutral-400 text-[11px] block">Prazo Obrigatório</span>
                          <span className="font-mono text-neutral-800 tabular-nums">
                            {formatDateShort(project.startDate)} → {formatDateShort(project.targetEndDate)}
                          </span>
                        </div>
                        <span className="text-neutral-300">·</span>
                        <div>
                          <span className="text-neutral-400 text-[11px] block">Duração</span>
                          <span className="font-mono text-neutral-800 tabular-nums">{durationDays}d</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Team Avatars + Progress Bar */}
                    <div className="mt-5 pt-4 border-t border-neutral-100">
                      <div className="flex items-center justify-between mb-2">
                        {/* Team Members Avatars */}
                        <div className="flex items-center -space-x-1.5">
                          {Array.from(new Set(project.teamMemberIds || [])).slice(0, 4).map((memberId, idx) => {
                            const m = getMember(memberId);
                            if (!m) return null;
                            return (
                              <div
                                key={`${project.id}-member-${m.id}-${idx}`}
                                title={`${m.name} (${m.role})`}
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold ring-2 ring-white ${m.avatarColor}`}
                              >
                                {m.initials}
                              </div>
                            );
                          })}
                          {Array.from(new Set(project.teamMemberIds || [])).length > 4 && (
                            <div className="w-6 h-6 rounded-md bg-stone-200 text-stone-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                              +{Array.from(new Set(project.teamMemberIds || [])).length - 4}
                            </div>
                          )}
                        </div>

                        {/* Progress percentage */}
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-neutral-900 tabular-nums">
                            {percentage}%
                          </span>
                          <span className="text-[11px] text-neutral-400 ml-1">
                            ({completedTasks}/{totalTasks} tarefas)
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-stone-900 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Card Footer action */}
                      <div className="flex items-center justify-between mt-3 text-xs">
                        <span className="text-[11px]">
                          {dateStatus.isOverdue ? (
                            <span className="text-rose-600 font-semibold">{dateStatus.label}</span>
                          ) : (
                            <span className="text-neutral-500">{dateStatus.label}</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {onExportProjectCsv && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onExportProjectCsv(project);
                              }}
                              title="Exportar tarefas em planilha CSV"
                              className="px-2 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 border border-emerald-200"
                            >
                              <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                              <span>CSV</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPdfProject(project);
                            }}
                            title="Exportar Resumo do Projeto em PDF"
                            className="px-2 py-1 text-[11px] font-medium text-stone-700 bg-neutral-100 hover:bg-amber-100 hover:text-stone-900 rounded-md transition-colors flex items-center gap-1 border border-neutral-200"
                          >
                            <FileDown className="w-3 h-3 text-amber-600" />
                            <span>PDF</span>
                          </button>
                          <span className="font-medium text-stone-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ml-1">
                            Abrir <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Two Column Section: Upcoming Urgent Deliveries & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Next Urgent Deliveries across the studio */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Próximas Entregas Técnicas do Escritório
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-500 tabular-nums">
              {urgentTasks.length} prioritárias
            </span>
          </div>

          <div className="divide-y divide-neutral-100 mt-2">
            {urgentTasks.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400">
                Nenhuma tarefa pendente no momento.
              </p>
            ) : (
              urgentTasks.map((t) => {
                const proj = projects.find((p) => p.id === t.projectId);
                const resp = getMember(t.responsibleId);
                const dateStatus = checkDateStatus(t.endDate, false);

                return (
                  <div
                    key={t.id}
                    onClick={() => proj && onSelectProject(proj.id)}
                    className="py-3 flex items-start justify-between gap-3 hover:bg-stone-50/60 p-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 truncate">
                        {dateStatus.isOverdue ? (
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
                        ) : null}
                        <span className="truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                        <span className="font-medium text-stone-800">{proj?.name.split('-')[0]}</span>
                        <span aria-hidden="true">·</span>
                        <span>{resp?.name.split(' ')[0]}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs block tabular-nums text-neutral-700">
                        {formatDateShort(t.endDate)}
                      </span>
                      {dateStatus.isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.2 rounded-xs border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {dateStatus.label}
                        </span>
                      ) : dateStatus.isToday ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.2 rounded-xs border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Vence hoje!
                        </span>
                      ) : dateStatus.isSoon ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-medium bg-amber-50/80 px-1.5 py-0.2 rounded-xs border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          {dateStatus.label}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-mono">{dateStatus.label}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Team Workload & Allocation */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Quadro de Equipe & Ocupação
              </h3>
            </div>
            <button
              type="button"
              onClick={onNewTeamMember}
              className="text-xs font-medium text-stone-900 hover:underline"
            >
              + Adicionar
            </button>
          </div>

          <div className="divide-y divide-neutral-100 mt-2">
            {teamMembers.map((member, idx) => {
              const memberTasks = tasks.filter((t) => t.responsibleId === member.id);
              const pending = memberTasks.filter((t) => !t.completed && t.status !== 'concluida').length;
              const completed = memberTasks.filter((t) => t.completed || t.status === 'concluida').length;
              const assignedProjects = projects.filter((p) => p.teamMemberIds.includes(member.id));

              return (
                <div key={`${member.id}-${idx}`} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${member.avatarColor}`}>
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-900 truncate">
                        {member.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">
                        {member.role}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-medium text-neutral-900 tabular-nums">
                      {pending} <span className="text-[11px] font-normal text-neutral-500">tarefas ativas</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      em {assignedProjects.length} {assignedProjects.length === 1 ? 'projeto' : 'projetos'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* PDF Export Modal */}
      {pdfProject && (
        <PdfExportModal
          isOpen={!!pdfProject}
          onClose={() => setPdfProject(null)}
          project={pdfProject}
          tasks={tasks}
          allTeamMembers={teamMembers}
        />
      )}

    </div>
  );
};
