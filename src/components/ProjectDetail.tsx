import React, { useState, useMemo } from 'react';
import { Project, Task, TeamMember, TaskPriority, TaskStatus, ArchitecturePhase } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { formatDatePT, formatDateShort, checkDateStatus, calculateDaysDifference } from '../utils/dateUtils';
import { KanbanBoard } from './KanbanBoard';
import { GanttTimeline } from './GanttTimeline';
import {
  Plus,
  Edit2,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  Circle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Layers,
  Search,
  Filter,
  Users,
  FileText,
  DollarSign,
  Maximize2,
  CheckSquare,
  ArrowUpDown,
  Trash2,
  Share2,
  Printer,
  FileDown,
  FolderOpen,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  ChevronDown,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  Download,
  HeartPulse,
  Mail,
  Phone,
  Briefcase,
  Handshake,
  Trophy,
  CheckCircle,
  ShieldCheck,
  Flame,
  Zap,
  Droplets,
  Wind,
  FileCheck
} from 'lucide-react';
import { PdfExportModal } from './PdfExportModal';
import { InteractiveD3Gantt } from './InteractiveD3Gantt';

interface ProjectDetailProps {
  project: Project;
  tasks: Task[];
  allTeamMembers: TeamMember[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (task: Task) => void;
  onUpdateTaskStatus: (task: Task, newStatus: TaskStatus) => void;
  onEditProject: () => void;
  onUpdateProjectTeam: (updatedMemberIds: string[]) => void;
  onUpdateTaskDates?: (taskId: string, newStartDate: string, newEndDate: string) => void;
  onEditBriefing?: (project: Project) => void;
  onAdvanceToNextPhase?: (project: Project) => void;
  onAdvanceToPhase?: (project: Project, phase: ArchitecturePhase) => void;
  onOpenAwardModal?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onToggleArchiveProject?: (projectId: string) => void;
  onDuplicateProject?: (projectId: string) => void;
  onExportProjectCsv?: (project: Project) => void;
  onExportProjectJson?: (project: Project) => void;
}

type TabType = 'lista' | 'kanban' | 'cronograma' | 'equipe' | 'memorial';

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  tasks,
  allTeamMembers,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskComplete,
  onUpdateTaskStatus,
  onEditProject,
  onUpdateProjectTeam,
  onUpdateTaskDates,
  onEditBriefing,
  onAdvanceToNextPhase,
  onAdvanceToPhase,
  onOpenAwardModal,
  onDeleteProject,
  onToggleArchiveProject,
  onDuplicateProject,
  onExportProjectCsv,
  onExportProjectJson,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('lista');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'pendentes' | 'concluidas' | 'atrasadas' | 'proximas'>('all');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<'all' | 'criacao_all' | 'executivo_all' | ArchitecturePhase>('all');
  const [sortBy, setSortBy] = useState<'endDate' | 'startDate' | 'priority' | 'title'>('endDate');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Filter tasks belonging to this project
  const projectTasks = useMemo(() => {
    return tasks.filter((t) => t.projectId === project.id);
  }, [tasks, project.id]);

  // Project team members
  const projectTeam = useMemo(() => {
    return allTeamMembers.filter((m) => project.teamMemberIds.includes(m.id));
  }, [allTeamMembers, project.teamMemberIds]);

  // Project completion calculation
  const stats = useMemo(() => {
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.completed || t.status === 'concluida').length;
    const pending = total - completed;
    const overdue = projectTasks.filter((t) => {
      if (t.completed || t.status === 'concluida') return false;
      return checkDateStatus(t.endDate, false).isOverdue;
    }).length;
    const soon = projectTasks.filter((t) => {
      if (t.completed || t.status === 'concluida') return false;
      const s = checkDateStatus(t.endDate, false);
      return s.isSoon || s.isToday;
    }).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, soon, percentage };
  }, [projectTasks]);

  // Filtered and sorted tasks for the list view
  const displayTasks = useMemo(() => {
    return projectTasks
      .filter((task) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = task.description?.toLowerCase().includes(q) || false;
          if (!matchesTitle && !matchesDesc) return false;
        }

        // Responsible filter
        if (selectedResponsible !== 'all' && task.responsibleId !== selectedResponsible) {
          return false;
        }

        // Priority filter
        if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
          return false;
        }

        // Status filter
        if (selectedStatusFilter === 'pendentes' && (task.completed || task.status === 'concluida')) {
          return false;
        }
        if (selectedStatusFilter === 'concluidas' && !task.completed && task.status !== 'concluida') {
          return false;
        }
        if (selectedStatusFilter === 'atrasadas') {
          if (task.completed || task.status === 'concluida') return false;
          return checkDateStatus(task.endDate, false).isOverdue;
        }
        // Phase filter
        if (selectedPhaseFilter !== 'all') {
          if (selectedPhaseFilter === 'criacao_all') {
            const isCriacao = 
              task.phase === 'criacao_conceitual' || 
              task.phase === 'criacao_orcamento' || 
              task.phase === 'criacao_apresentacao' ||
              task.phase === 'estudo_preliminar' ||
              task.phase === 'anteprojeto';
            if (!isCriacao) return false;
          } else if (selectedPhaseFilter === 'executivo_all') {
            const isExec = 
              task.phase.startsWith('executivo_') || 
              task.phase === 'projeto_executivo' || 
              task.phase === 'detalhamento' || 
              task.phase === 'projeto_legal';
            if (!isExec) return false;
          } else if (task.phase !== selectedPhaseFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'endDate') {
          return a.endDate.localeCompare(b.endDate);
        }
        if (sortBy === 'startDate') {
          return a.startDate.localeCompare(b.startDate);
        }
        if (sortBy === 'priority') {
          const weight = { critica: 4, alta: 3, media: 2, baixa: 1 };
          return weight[b.priority] - weight[a.priority];
        }
        return a.title.localeCompare(b.title);
      });
  }, [projectTasks, searchQuery, selectedResponsible, selectedPriority, selectedStatusFilter, sortBy]);

  const currentPhaseInfo = ARCHITECTURE_PHASES.find((p) => p.id === project.currentPhase);
  const projectDateStatus = checkDateStatus(project.targetEndDate, stats.percentage === 100);
  const projectDurationDays = calculateDaysDifference(project.startDate, project.targetEndDate);

  const getMember = (id: string) => allTeamMembers.find((m) => m.id === id);

  const toggleTeamMemberInProject = (memberId: string) => {
    let nextIds: string[];
    if (project.teamMemberIds.includes(memberId)) {
      nextIds = project.teamMemberIds.filter((id) => id !== memberId);
    } else {
      nextIds = [...project.teamMemberIds, memberId];
    }
    onUpdateProjectTeam(nextIds);
  };

  const handlePrint = () => {
    setIsPdfModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Archived Notice Banner */}
      {project.isArchived && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Projeto Arquivado
                </span>
                {project.archivedAt && (
                  <span className="text-[11px] text-amber-700">
                    · em {new Date(project.archivedAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                {project.archivedReason || 'Este projeto está fora da esteira ativa. Todos os dados, tarefas e entregáveis foram preservados para consulta técnica.'}
              </p>
            </div>
          </div>
          {onToggleArchiveProject && (
            <button
              type="button"
              onClick={() => onToggleArchiveProject(project.id)}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-400 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <ArchiveRestore className="w-4 h-4 text-amber-700" />
              Reativar Projeto
            </button>
          )}
        </div>
      )}

      {/* Project Header Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1">
              <span>{project.code}</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans font-medium text-neutral-700">{project.client}</span>
              <span aria-hidden="true">·</span>
              <span className="font-sans text-stone-700">{project.typology}</span>
              {project.isArchived && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-stone-200 text-stone-700">
                  Arquivado
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs text-neutral-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              {project.location}
            </p>
          </div>

          {/* Primary Action Buttons (Monday.com Suite) */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            
            {/* Export Dropdown (Excel CSV, PDF, JSON) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen(!isExportMenuOpen);
                  setIsActionsMenuOpen(false);
                }}
                title="Exportar dados do projeto"
                className="px-3 py-2 text-xs font-semibold text-stone-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                <span>Exportar</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {isExportMenuOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-60 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsExportMenuOpen(false)}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Formatos de Exportação
                  </div>
                  <button
                    type="button"
                    onClick={() => onExportProjectCsv?.(project)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg transition-colors text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold">Planilha Excel (.CSV)</div>
                      <div className="text-[10px] text-neutral-500">Com tarefas, SLA e briefing (UTF-8 BOM)</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPdfModalOpen(true)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-colors text-left"
                  >
                    <FileDown className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-semibold">Relatório PDF Executivo</div>
                      <div className="text-[10px] text-neutral-500">Para clientes e diretoria executiva</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportProjectJson?.(project)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-indigo-50 hover:text-indigo-900 rounded-lg transition-colors text-left"
                  >
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-semibold">Backup Técnico (.JSON)</div>
                      <div className="text-[10px] text-neutral-500">Dados brutos estruturados</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Project Lifecycle Menu (Monday.com style: Duplicate, Archive, Delete) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsActionsMenuOpen(!isActionsMenuOpen);
                  setIsExportMenuOpen(false);
                }}
                title="Mais opções do projeto"
                className="p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors shadow-2xs"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isActionsMenuOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsActionsMenuOpen(false)}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Ações do Projeto
                  </div>

                  {/* Duplicate */}
                  {onDuplicateProject && (
                    <button
                      type="button"
                      onClick={() => onDuplicateProject(project.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-stone-900 rounded-lg transition-colors text-left"
                    >
                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                      <span>Duplicar como Template</span>
                    </button>
                  )}

                  {/* Archive / Restore */}
                  {onToggleArchiveProject && (
                    <button
                      type="button"
                      onClick={() => onToggleArchiveProject(project.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-colors text-left"
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

                  {/* Delete */}
                  {onDeleteProject && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(project.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Excluir Definitivamente</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onEditProject}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Imprimir relatório / ata"
              className="p-2 text-neutral-500 hover:text-neutral-800 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onAddTask}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Project Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 pt-5 items-center">
          
          {/* Phase */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
              Fase Atual
            </span>
            <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5 mt-0.5">
              <span
                className="w-2.5 h-2.5 rounded-xs"
                style={{ backgroundColor: currentPhaseInfo?.color || '#000' }}
              />
              {currentPhaseInfo ? currentPhaseInfo.name : project.currentPhase}
            </span>
          </div>

          {/* Area */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
              Área Corporativa
            </span>
            <span className="text-xs font-mono font-bold text-neutral-900 mt-0.5 block tabular-nums">
              {project.areaM2.toLocaleString('pt-BR')} m²
            </span>
          </div>

          {/* Mandatory Dates Range */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
              Prazo Contratual (Início → Fim)
            </span>
            <span className="text-xs font-mono text-neutral-800 mt-0.5 block tabular-nums">
              {formatDateShort(project.startDate)} → {formatDateShort(project.targetEndDate)} ({projectDurationDays}d)
            </span>
          </div>

          {/* Deadline Status */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
              Status do Prazo
            </span>
            <span className="text-xs font-medium mt-0.5 block">
              {projectDateStatus.isOverdue ? (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {projectDateStatus.label}
                </span>
              ) : projectDateStatus.isToday ? (
                <span className="text-amber-700 font-semibold">Entrega Hoje!</span>
              ) : (
                <span className="text-stone-700">{projectDateStatus.label}</span>
              )}
            </span>
          </div>

          {/* Progress % */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold uppercase tracking-wider text-neutral-500">
                Progresso ({stats.completed}/{stats.total})
              </span>
              <span className="font-mono font-bold text-neutral-900 tabular-nums">
                {stats.percentage}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-stone-900 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>

        </div>

        {/* WORKPLACE ARQUITETURA CORPORATIVA: ESTEIRA COMPLETA DE DESENVOLVIMENTO */}
        <div className="mt-5 pt-5 border-t border-neutral-200 space-y-4">
          
          {/* Workflow Header & Quick Stage Nav */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900 text-stone-100">
                Workplace Esteira
              </span>
              <h3 className="text-xs font-bold text-neutral-800">
                Esteira de Desenvolvimento Completo de Projeto
              </h3>
            </div>

            {/* Quick Award Trigger if not yet awarded */}
            {onOpenAwardModal && (
              <button
                type="button"
                onClick={() => onOpenAwardModal(project)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
                  project.award?.status === 'awarded'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-linear-to-r from-amber-500 to-yellow-600 text-white hover:from-amber-600 hover:to-yellow-700'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>
                  {project.award?.status === 'awarded'
                    ? 'Editar Dados do Award'
                    : '🏆 Dar Award (Projeto Comprado)'}
                </span>
              </button>
            )}
          </div>

          {/* Stepper Timeline Bar: 4 Core Workplace Moments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            {/* Step 1: Captação & Encaixe na Esteira */}
            {(() => {
              const isCurrent = project.currentPhase === 'captacao_briefing';
              const isDone = project.currentPhase !== 'captacao_briefing';
              return (
                <div
                  onClick={() => onAdvanceToPhase && onAdvanceToPhase(project, 'captacao_briefing')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-pink-50 border-pink-400 ring-2 ring-pink-300 shadow-xs'
                      : isDone
                      ? 'bg-neutral-50/80 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-pink-700">
                      <FileText className="w-3.5 h-3.5" />
                      1. Captação & Esteira
                    </span>
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-pink-600" />}
                  </div>
                  <div className="text-[11px] text-neutral-600 leading-tight">
                    Demanda nova, briefing corporativo e SharePoint.
                  </div>
                </div>
              );
            })()}

            {/* Step 2: Área de Criação (3 Etapas Pré-Award) */}
            {(() => {
              const isCriacao =
                project.currentPhase === 'criacao_conceitual' ||
                project.currentPhase === 'criacao_orcamento' ||
                project.currentPhase === 'criacao_apresentacao' ||
                project.currentPhase === 'estudo_preliminar' ||
                project.currentPhase === 'anteprojeto';
              const isPastCriacao =
                project.currentPhase.startsWith('executivo_') ||
                project.currentPhase === 'acompanhamento_obra' ||
                project.currentPhase === 'projeto_executivo' ||
                project.currentPhase === 'detalhamento';
              return (
                <div
                  onClick={() => onAdvanceToPhase && onAdvanceToPhase(project, 'criacao_conceitual')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isCriacao
                      ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-xs'
                      : isPastCriacao
                      ? 'bg-neutral-50/80 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-purple-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      2. Área de Criação (3 Etapas)
                    </span>
                    {isPastCriacao && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <div className="text-[11px] text-neutral-600 leading-tight">
                    • Conceitual · Orçamento · Apresentação
                  </div>
                </div>
              );
            })()}

            {/* Step 3: Marco Decisório: Award do Cliente */}
            {(() => {
              const isAwarded = project.award?.status === 'awarded';
              return (
                <div
                  onClick={() => onOpenAwardModal && onOpenAwardModal(project)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isAwarded
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                      : 'bg-white border-dashed border-amber-300 hover:bg-amber-50/40 text-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      3. Award do Cliente
                    </span>
                    {isAwarded ? (
                      <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">
                        Comprado
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-medium">Aguardando</span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-600 leading-tight">
                    {isAwarded && project.award?.awardValueBRL
                      ? `R$ ${project.award.awardValueBRL.toLocaleString('pt-BR')}`
                      : 'Cliente compra o projeto conceitual + orçamento.'}
                  </div>
                </div>
              );
            })()}

            {/* Step 4: Segundo Momento: Projeto Executivo (4 Pilares) */}
            {(() => {
              const isExec =
                project.currentPhase.startsWith('executivo_') ||
                project.currentPhase === 'projeto_executivo' ||
                project.currentPhase === 'detalhamento' ||
                project.currentPhase === 'projeto_legal';
              const isObra = project.currentPhase === 'acompanhamento_obra';
              return (
                <div
                  onClick={() => onAdvanceToPhase && onAdvanceToPhase(project, 'executivo_plantas')}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isExec
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs'
                      : isObra
                      ? 'bg-neutral-50/80 border-neutral-200 text-neutral-600'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-sky-700">
                      <Layers className="w-3.5 h-3.5" />
                      4. Projeto Executivo (4 Pilares)
                    </span>
                    {isObra && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
                  </div>
                  <div className="text-[11px] text-neutral-600 leading-tight">
                    Plantas, Complementares, Condomínio, Seguros.
                  </div>
                </div>
              );
            })()}

          </div>

          {/* DYNAMIC CONTEXT BANNER ACCORDING TO CURRENT STAGE */}
          
          {/* BANNER A: Captação & Esteira */}
          {project.currentPhase === 'captacao_briefing' && (
            <div className="p-4 rounded-xl bg-pink-50 border border-pink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-600 text-white rounded-xl shadow-xs shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-pink-950">
                      1º Momento da Esteira: Captação & Briefing Comercial
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-200 text-pink-900 uppercase">
                      Entrada na Esteira
                    </span>
                  </div>
                  <p className="text-[11px] text-pink-800 mt-0.5">
                    {project.briefing?.submittedByName
                      ? `Demanda registrada por ${project.briefing.submittedByName} em ${project.briefing.submittedAt}. Pasta SharePoint configurada.`
                      : 'Demanda aguardando preenchimento do briefing corporativo.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onEditBriefing && (
                  <button
                    type="button"
                    onClick={() => onEditBriefing(project)}
                    className="px-3 py-1.5 text-xs font-semibold text-pink-900 bg-white border border-pink-300 rounded-lg hover:bg-pink-100 transition-colors"
                  >
                    Editar Briefing
                  </button>
                )}
                {onAdvanceToPhase && (
                  <button
                    type="button"
                    onClick={() => onAdvanceToPhase(project, 'criacao_conceitual')}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-pink-700 hover:bg-pink-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Liberar para Área de Criação</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* BANNER B: Área de Projeto de Criação (3 Etapas) */}
          {(project.currentPhase === 'criacao_conceitual' ||
            project.currentPhase === 'criacao_orcamento' ||
            project.currentPhase === 'criacao_apresentacao' ||
            project.currentPhase === 'estudo_preliminar' ||
            project.currentPhase === 'anteprojeto') && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-purple-950">
                        Área de Projeto de Criação (3 Etapas Pré-Award)
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 uppercase">
                        Em Desenvolvimento Criativo
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      Desenvolvimento do projeto conceitual, elaboração da planilha orçamentária do cliente e apresentação integrada dos 2 conteúdos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenAwardModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAwardModal(project)}
                      className="px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4 text-amber-100" />
                      <span>🏆 Registrar Award (Cliente Comprou)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3 Etapas da Criação Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-purple-200/80">
                
                {/* 2.1 Projeto Conceitual */}
                <div
                  onClick={() => onAdvanceToPhase && onAdvanceToPhase(project, 'criacao_conceitual')}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    project.currentPhase === 'criacao_conceitual' || project.currentPhase === 'estudo_preliminar'
                      ? 'bg-white border-purple-400 font-bold text-purple-950 shadow-2xs'
                      : 'bg-purple-100/60 border-purple-200 text-purple-900 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span>2.1 Projeto Conceitual</span>
                    {(project.currentPhase === 'criacao_conceitual' || project.currentPhase === 'estudo_preliminar') && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-purple-700 font-normal mt-0.5">
                    Layout espacial, volumetria 3D, salas acústicas e wellness.
                  </div>
                </div>

                {/* 2.2 Orçamento do Cliente */}
                <div
                  onClick={() => onAdvanceToPhase && onAdvanceToPhase(project, 'criacao_orcamento')}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    project.currentPhase === 'criacao_orcamento' || project.currentPhase === 'anteprojeto'
                      ? 'bg-white border-purple-400 font-bold text-purple-950 shadow-2xs'
                      : 'bg-purple-100/60 border-purple-200 text-purple-900 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span>2.2 Orçamento do Cliente</span>
                    {(project.currentPhase === 'criacao_orcamento' || project.currentPhase === 'anteprojeto') && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-purple-700 font-normal mt-0.5">
                    Planilha orçamentária, estimativa de CAPEX e marcenaria.
                  </div>
                </div>

                {/* 2.3 Apresentação dos 2 Conteúdos */}
                <div
                  onClick={() => onAdvanceToPhase && onAdvanceToPhase(project, 'criacao_apresentacao')}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    project.currentPhase === 'criacao_apresentacao'
                      ? 'bg-white border-purple-400 font-bold text-purple-950 shadow-2xs'
                      : 'bg-purple-100/60 border-purple-200 text-purple-900 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span>2.3 Apresentação (2 Conteúdos)</span>
                    {project.currentPhase === 'criacao_apresentacao' && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                    )}
                  </div>
                  <div className="text-[10px] text-purple-700 font-normal mt-0.5">
                    Defesa integrada (Conceito + Orçamento) para fechar o Award.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* BANNER C: PROJETO EXECUTIVO (Pós-Award - 4 Pilares Obrigatórios) */}
          {(project.award?.status === 'awarded' ||
            project.currentPhase.startsWith('executivo_') ||
            project.currentPhase === 'projeto_executivo' ||
            project.currentPhase === 'detalhamento' ||
            project.currentPhase === 'projeto_legal') && (
            <div className="p-4 rounded-xl bg-linear-to-r from-sky-50 via-cyan-50 to-emerald-50 border border-sky-300 flex flex-col gap-3">
              
              {/* Award Recognition Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-linear-to-br from-amber-500 to-yellow-600 text-white rounded-xl shadow-xs shrink-0">
                    <Trophy className="w-5 h-5 text-amber-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        ✓ PROJETO COMPRADO PELO CLIENTE (AWARD)
                      </span>
                      {project.award?.awardValueBRL && (
                        <span className="text-xs font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded-md border border-neutral-300">
                          R$ {project.award.awardValueBRL.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-700 mt-0.5">
                      {project.award?.clientDecisionMaker
                        ? `Award concedido por ${project.award.clientDecisionMaker} ${project.award.awardedAt ? `em ${project.award.awardedAt}` : ''}.`
                        : 'Award confirmado! Segundo momento da esteira ativado.'}{' '}
                      <span className="font-semibold text-sky-900">
                        Liberado para Projeto Executivo completo.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenAwardModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAwardModal(project)}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      Editar Dados do Award
                    </button>
                  )}
                  {onAdvanceToPhase && (
                    <button
                      type="button"
                      onClick={() => onAdvanceToPhase(project, 'acompanhamento_obra')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-2xs transition-colors"
                    >
                      Liberar para Obra →
                    </button>
                  )}
                </div>
              </div>

              {/* Os 4 Pilares Fundamentais do Executivo */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-600 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  <span>Os 4 Pilares Obrigatórios do Projeto Executivo Workplace:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  
                  {/* Pilar 1: Todas as Plantas */}
                  <div
                    onClick={() => {
                      setSelectedPhaseFilter('executivo_plantas');
                      setActiveTab('lista');
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      project.currentPhase === 'executivo_plantas' || project.currentPhase === 'projeto_executivo'
                        ? 'bg-white border-sky-400 font-bold text-sky-950 shadow-xs ring-1 ring-sky-300'
                        : 'bg-white/80 border-sky-200 text-neutral-800 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-900">
                      <span>3.1 Todas as Plantas</span>
                      <FileCheck className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      Demolição, construção, piso elevado, forro acústico, marcenaria e layout executivo.
                    </p>
                  </div>

                  {/* Pilar 2: Complementares (Engenharias) */}
                  <div
                    onClick={() => {
                      setSelectedPhaseFilter('executivo_complementares');
                      setActiveTab('lista');
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      project.currentPhase === 'executivo_complementares'
                        ? 'bg-white border-cyan-400 font-bold text-cyan-950 shadow-xs ring-1 ring-cyan-300'
                        : 'bg-white/80 border-cyan-200 text-neutral-800 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-cyan-900">
                      <span>3.2 Complementares</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <Wind className="w-3 h-3 text-sky-500" />
                        <Droplets className="w-3 h-3 text-blue-500" />
                        <Flame className="w-3 h-3 text-rose-500" />
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      Elétrica/dados, ar-condicionado (VRF), hidráulica e combate a incêndio (sprinklers/AVCB).
                    </p>
                  </div>

                  {/* Pilar 3: Aprovação no Condomínio */}
                  <div
                    onClick={() => {
                      setSelectedPhaseFilter('executivo_aprovacao_condominio');
                      setActiveTab('lista');
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      project.currentPhase === 'executivo_aprovacao_condominio' || project.currentPhase === 'projeto_legal'
                        ? 'bg-white border-amber-400 font-bold text-amber-950 shadow-xs ring-1 ring-amber-300'
                        : 'bg-white/80 border-amber-200 text-neutral-800 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                      <span>3.3 Aprovação Condomínio</span>
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      Engenharia predial, análise de sobrecarga, ART/RRT e liberação de acesso para a obra.
                    </p>
                  </div>

                  {/* Pilar 4: Seguros & Documentos Obrigatórios */}
                  <div
                    onClick={() => {
                      setSelectedPhaseFilter('executivo_seguros_documentos');
                      setActiveTab('lista');
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      project.currentPhase === 'executivo_seguros_documentos'
                        ? 'bg-white border-emerald-400 font-bold text-emerald-950 shadow-xs ring-1 ring-emerald-300'
                        : 'bg-white/80 border-emerald-200 text-neutral-800 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                      <span>3.4 Seguros & Docs</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      Seguro Risco de Engenharia (RC Obras), apólices, PGR, PCMSO, ASO e CNDs do cliente.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 gap-2 overflow-x-auto pb-px">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('lista')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'lista'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
            }`}
          >
            Lista de Tarefas ({projectTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'kanban'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
            }`}
          >
            Quadro Kanban
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cronograma')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'cronograma'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
            }`}
          >
            Cronograma (Gantt)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('equipe')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'equipe'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
            }`}
          >
            Equipe Alocada ({projectTeam.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memorial')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'memorial'
                ? 'border-pink-600 text-pink-900 font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-pink-600" />
            <span>Briefing Comercial & Documentos</span>
            {project.briefing && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Quick filters for active view */}
        {(activeTab === 'lista' || activeTab === 'kanban') && (
          <div className="flex items-center gap-2 shrink-0 py-1">
            <span className="text-[11px] text-neutral-400 hidden md:inline">Filtro rápido:</span>
            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  selectedStatusFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('pendentes')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  selectedStatusFilter === 'pendentes' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                }`}
              >
                Pendentes ({stats.pending})
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('concluidas')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  selectedStatusFilter === 'concluidas' ? 'bg-white text-emerald-800 shadow-xs' : 'text-neutral-600'
                }`}
              >
                Já Fez ({stats.completed})
              </button>
              {stats.soon > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('proximas')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                    selectedStatusFilter === 'proximas' ? 'bg-amber-100 text-amber-900 shadow-xs font-semibold' : 'text-amber-800'
                  }`}
                >
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  Próximas ({stats.soon})
                </button>
              )}
              {stats.overdue > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilter('atrasadas')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                    selectedStatusFilter === 'atrasadas' ? 'bg-rose-50 text-rose-700 shadow-xs font-semibold' : 'text-rose-600'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  Atrasadas ({stats.overdue})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: LISTA DE TAREFAS */}
      {activeTab === 'lista' && (
        <div className="space-y-4">
          
          {/* Search and Advanced Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-neutral-200 rounded-xl shadow-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por tarefa, prancha ou descrição..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Phase (Workplace Esteira) */}
              <select
                value={selectedPhaseFilter}
                onChange={(e) => setSelectedPhaseFilter(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-800 font-semibold focus:outline-hidden"
              >
                <option value="all">Todas as Fases da Esteira</option>
                <optgroup label="2. Área de Criação (Pré-Award)">
                  <option value="criacao_all">Toda Área de Criação (3 Etapas)</option>
                  <option value="criacao_conceitual">2.1 Projeto Conceitual</option>
                  <option value="criacao_orcamento">2.2 Orçamento do Cliente</option>
                  <option value="criacao_apresentacao">2.3 Apresentação (Conceito + Orçamento)</option>
                </optgroup>
                <optgroup label="3. Projeto Executivo (Pós-Award)">
                  <option value="executivo_all">Todo Projeto Executivo (4 Pilares)</option>
                  <option value="executivo_plantas">3.1 Todas as Plantas</option>
                  <option value="executivo_complementares">3.2 Complementares (Engenharias)</option>
                  <option value="executivo_aprovacao_condominio">3.3 Aprovação no Condomínio</option>
                  <option value="executivo_seguros_documentos">3.4 Seguros & Docs Obrigatórios</option>
                </optgroup>
                <optgroup label="Outras Fases">
                  <option value="captacao_briefing">1. Captação & Encaixe na Esteira</option>
                  <option value="acompanhamento_obra">4. Implantação e Obra</option>
                </optgroup>
              </select>

              {/* Filter Responsible */}
              <select
                value={selectedResponsible}
                onChange={(e) => setSelectedResponsible(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 focus:outline-hidden"
              >
                <option value="all">Todos os Responsáveis</option>
                {allTeamMembers.map((m, idx) => (
                  <option key={`resp-${m.id}-${idx}`} value={m.id}>
                    {m.name} ({m.initials})
                  </option>
                ))}
              </select>

              {/* Filter Priority */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 focus:outline-hidden"
              >
                <option value="all">Todas as Prioridades</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 focus:outline-hidden"
              >
                <option value="endDate">Prazo (Término)</option>
                <option value="startDate">Data de Início</option>
                <option value="priority">Importância</option>
                <option value="title">Ordem Alfabética</option>
              </select>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-stone-50/70 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider select-none">
                    <th className="py-3 px-3 w-12 text-center">Já Fez?</th>
                    <th className="py-3 px-4">Tarefa & Entregáveis</th>
                    <th className="py-3 px-3">Fase</th>
                    <th className="py-3 px-3">Importância</th>
                    <th className="py-3 px-3">Responsável</th>
                    <th className="py-3 px-4 font-mono">Início → Fim (Obrigatório)</th>
                    <th className="py-3 px-3">Situação</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {displayTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-400">
                        Nenhuma tarefa encontrada com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    displayTasks.map((task) => {
                      const responsible = getMember(task.responsibleId);
                      const phase = ARCHITECTURE_PHASES.find((p) => p.id === task.phase);
                      const isDone = task.completed || task.status === 'concluida';
                      const dateStatus = checkDateStatus(task.endDate, isDone);
                      const duration = calculateDaysDifference(task.startDate, task.endDate);

                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-stone-50/60 transition-colors ${
                            isDone ? 'bg-neutral-50/40 text-neutral-500' : ''
                          }`}
                        >
                          {/* Checkbox "Já Fez" */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleTaskComplete(task)}
                              title={isDone ? 'Marcar como não concluída' : 'Marcar como feita'}
                              className={`p-1 rounded-md transition-colors ${
                                isDone
                                  ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50'
                                  : 'text-neutral-400 hover:text-emerald-600 hover:bg-neutral-100'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>
                          </td>

                          {/* Task Title & Description */}
                          <td className="py-3 px-4 max-w-xs sm:max-w-md">
                            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                              {!isDone && dateStatus.isOverdue && (
                                <span title={`Prazo Expirado! ${dateStatus.label}`} className="shrink-0 p-0.5 rounded-sm bg-rose-100 text-rose-700">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {!isDone && dateStatus.isToday && (
                                <span title="Atenção: Prazo vence hoje!" className="shrink-0 p-0.5 rounded-sm bg-amber-100 text-amber-800">
                                  <Clock className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {!isDone && dateStatus.isSoon && (
                                <span title={`Atenção: Conclusão próxima (${dateStatus.label})`} className="shrink-0 p-0.5 rounded-sm bg-amber-50 text-amber-600 border border-amber-200">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </span>
                              )}
                              <span className={isDone ? 'line-through text-neutral-400' : ''}>
                                {task.title}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-[11px] text-neutral-500 truncate mt-0.5 max-w-sm">
                                {task.description}
                              </p>
                            )}
                            {task.deliverables && (
                              <div className="text-[10px] text-stone-600 font-mono mt-1">
                                Prancha: {task.deliverables}
                              </div>
                            )}
                          </td>

                          {/* Phase */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-xs bg-stone-100 text-stone-800">
                              {phase ? phase.shortName : task.phase}
                            </span>
                          </td>

                          {/* Importance / Priority */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {task.priority === 'critica' && (
                              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm">
                                Crítica
                              </span>
                            )}
                            {task.priority === 'alta' && (
                              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm">
                                Alta
                              </span>
                            )}
                            {task.priority === 'media' && (
                              <span className="text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-sm">
                                Média
                              </span>
                            )}
                            {task.priority === 'baixa' && (
                              <span className="text-[11px] text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-sm">
                                Baixa
                              </span>
                            )}
                          </td>

                          {/* Responsible Person */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {responsible ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold ${responsible.avatarColor}`}>
                                  {responsible.initials}
                                </div>
                                <div>
                                  <div className="font-medium text-neutral-800">{responsible.name}</div>
                                  <div className="text-[10px] text-neutral-400">{responsible.role.split(' ')[0]}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic">Não atribuído</span>
                            )}
                          </td>

                          {/* Mandatory Dates Range (Início -> Fim) */}
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-700 whitespace-nowrap tabular-nums">
                            <div>{formatDateShort(task.startDate)} → {formatDateShort(task.endDate)}</div>
                            <div className="text-[10px] text-neutral-400">{duration} dias corridos</div>
                          </td>

                          {/* Due Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isDone ? (
                              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Concluída
                              </span>
                            ) : dateStatus.isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-rose-50 border border-rose-300 text-rose-700 font-semibold text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                {dateStatus.label}
                              </span>
                            ) : dateStatus.isToday ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-amber-50 border border-amber-300 text-amber-800 font-semibold text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                Vence hoje!
                              </span>
                            ) : dateStatus.isSoon ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-amber-50/80 border border-amber-200 text-amber-800 font-medium text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                {dateStatus.label}
                              </span>
                            ) : (
                              <span className="text-[11px] text-stone-600 font-mono tabular-nums">
                                {dateStatus.label}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => onEditTask(task)}
                                title="Editar tarefa"
                                className="p-1.5 text-neutral-400 hover:text-stone-900 hover:bg-neutral-100 rounded-md transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTask(task.id)}
                                title="Excluir tarefa"
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-stone-50/70 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
              <span className="font-mono tabular-nums">
                Mostrando {displayTasks.length} de {projectTasks.length} tarefas
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-medium">{stats.completed} concluídas</span>
                <span>·</span>
                <span className="text-neutral-700">{stats.pending} a fazer</span>
                {stats.overdue > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-rose-600 font-semibold">{stats.overdue} atrasadas</span>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: KANBAN BOARD */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          tasks={displayTasks}
          teamMembers={allTeamMembers}
          onToggleComplete={onToggleTaskComplete}
          onUpdateStatus={onUpdateTaskStatus}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      )}

      {/* TAB 3: CRONOGRAMA GANTT INTERATIVO D3 */}
      {activeTab === 'cronograma' && (
        onUpdateTaskDates ? (
          <InteractiveD3Gantt
            tasks={projectTasks}
            projects={[project]}
            teamMembers={allTeamMembers}
            onEditTask={onEditTask}
            onUpdateTaskDates={onUpdateTaskDates}
          />
        ) : (
          <GanttTimeline
            tasks={projectTasks}
            teamMembers={allTeamMembers}
            onEditTask={onEditTask}
            projectStartDate={project.startDate}
            projectEndDate={project.targetEndDate}
          />
        )
      )}

      {/* TAB 4: EQUIPE ALOCADA NO PROJETO */}
      {activeTab === 'equipe' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Equipe Designada para Este Projeto
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Arquitetos, coordenadores e consultores com acesso e responsabilidades neste projeto corporativo.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-stone-100 rounded-md tabular-nums text-stone-800">
              {projectTeam.length} profissionais alocados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTeamMembers.map((member, idx) => {
              const isAllocated = project.teamMemberIds.includes(member.id);
              const memberTasks = projectTasks.filter((t) => t.responsibleId === member.id);
              const memberDoneTasks = memberTasks.filter((t) => t.completed || t.status === 'concluida').length;

              return (
                <div
                  key={`${member.id}-${idx}`}
                  className={`p-4 rounded-xl border transition-all ${
                    isAllocated
                      ? 'bg-white border-neutral-300 shadow-xs'
                      : 'bg-neutral-50/50 border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${member.avatarColor}`}>
                        {member.initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">{member.name}</h4>
                        <p className="text-[11px] text-neutral-500">{member.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Task allocation statistics */}
                  {isAllocated ? (
                    <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60 mb-3 text-xs flex items-center justify-between">
                      <span className="text-neutral-600">Tarefas no projeto:</span>
                      <span className="font-mono font-semibold text-neutral-900 tabular-nums">
                        {memberDoneTasks}/{memberTasks.length} concluídas
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-neutral-100/70 mb-3 text-xs text-neutral-400 italic text-center">
                      Não alocado neste projeto
                    </div>
                  )}

                  {/* Allocation Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleTeamMemberInProject(member.id)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      isAllocated
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'
                    }`}
                  >
                    {isAllocated ? 'Remover da Equipe' : 'Alocar no Projeto'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: BRIEFING COMERCIAL & DOCUMENTOS */}
      {activeTab === 'memorial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Commercial Intake & Audit Log Card */}
            <div className="bg-white border border-pink-200 rounded-xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                      Rastreamento da Entrada Comercial
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Registro de quando a demanda e os arquivos foram inseridos no sistema pela equipe de negócios.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onEditBriefing && (
                    <button
                      type="button"
                      onClick={() => onEditBriefing(project)}
                      className="px-3 py-1.5 text-xs font-semibold text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-pink-700" />
                      Editar Briefing
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                    Head Responsável
                  </span>
                  <span className="text-xs font-bold text-neutral-900 mt-0.5 block truncate">
                    {project.briefing?.submittedByName || 'Equipe de Negócios'}
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                    Data e Hora do Registro
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-900 mt-0.5 block">
                    {project.briefing?.submittedAt || project.entryDate || project.createdAt.slice(0, 16)}
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                    Prioridade na Esteira
                  </span>
                  <span className="text-xs font-bold text-rose-700 mt-0.5 block uppercase">
                    {project.priority ? project.priority.replace('_', ' ') : 'P2 ALTA'}
                  </span>
                </div>
              </div>

              {project.briefing?.commercialObservations && (
                <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-950">
                  <span className="font-bold block mb-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Observações de Bastidores do Comercial:
                  </span>
                  <p className="leading-relaxed">{project.briefing.commercialObservations}</p>
                </div>
              )}
            </div>

            {/* PONTO DE CONTATO & MODELO DA NEGOCIAÇÃO (BTS, CAPEX, TURNKEY) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Ponto de Contato no Cliente */}
              <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Ponto de Contato no Cliente
                  </h3>
                  <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                    Interlocutor
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Nome / Cargo</span>
                    <span className="font-bold text-neutral-900 block text-sm">
                      {project.briefing?.clientContactPerson || 'Não informado'}
                    </span>
                    {project.briefing?.clientContactRole && (
                      <span className="text-neutral-500 block text-[11px]">
                        {project.briefing.clientContactRole}
                      </span>
                    )}
                  </div>

                  {project.briefing?.clientContactEmail && (
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a
                        href={`mailto:${project.briefing.clientContactEmail}`}
                        className="text-blue-700 hover:underline font-mono truncate"
                      >
                        {project.briefing.clientContactEmail}
                      </a>
                    </div>
                  )}

                  {project.briefing?.clientContactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a
                        href={`tel:${project.briefing.clientContactPhone.replace(/[^0-9]/g, '')}`}
                        className="text-neutral-800 hover:underline font-mono"
                      >
                        {project.briefing.clientContactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Oferta da Negociação Comercial */}
              <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-emerald-600" />
                    Oferta & Modelo de Negociação
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                    {project.briefing?.negotiationModel === 'bts'
                      ? 'Built to Suit (BTS)'
                      : project.briefing?.negotiationModel === 'capex_direto'
                      ? 'CAPEX Direto'
                      : project.briefing?.negotiationModel === 'turnkey'
                      ? 'Turnkey Fechado'
                      : project.briefing?.negotiationModel === 'taxa_administracao'
                      ? 'Cost-Plus'
                      : project.briefing?.negotiationModel === 'projeto_arquitetura'
                      ? 'Escopo Fechado'
                      : 'Corporativo'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {project.briefing?.estimatedBudgetRange && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Faixa de Investimento (CAPEX)</span>
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {project.briefing.estimatedBudgetRange}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Premissas Comerciais da Oferta</span>
                    <p className="text-neutral-700 leading-relaxed text-[11px]">
                      {project.briefing?.negotiationNotes ||
                        (project.briefing?.negotiationModel === 'bts'
                          ? 'Operação Built to Suit estruturada com locador de longo prazo.'
                          : 'Investimento direto com cronograma de desembolso aprovado.')}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Documents Folder Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  Pasta Oficial de Documentos da Demanda (SharePoint / Nuvem)
                </h3>
                {project.briefing?.documentsFolderUrl && (
                  <a
                    href={project.briefing.documentsFolderUrl.startsWith('http') ? project.briefing.documentsFolderUrl : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Abrir no SharePoint</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Caminho da Pasta</span>
                  <span className="text-xs font-mono font-medium text-neutral-900 truncate block">
                    {project.briefing?.documentsFolderUrl || 'Nenhum link ou caminho de pasta cadastrado.'}
                  </span>
                </div>
              </div>

              {/* Sample catalog of essential documents in the folder */}
              <div>
                <span className="text-[11px] font-semibold text-neutral-600 block mb-2">
                  Documentos Técnicos Disponibilizados pelo Head para o Time Conceitual:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px]">DWG</span>
                      <div>
                        <span className="font-semibold text-neutral-900 block leading-tight">Planta Base Cadastral</span>
                        <span className="text-[10px] text-neutral-400">Arquitetura original do condomínio</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs">OK</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-[10px]">PDF</span>
                      <div>
                        <span className="font-semibold text-neutral-900 block leading-tight">Manual de Reformas do Edifício</span>
                        <span className="text-[10px] text-neutral-400">Regras de condomínio e horários</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs">OK</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-[10px]">ZIP</span>
                      <div>
                        <span className="font-semibold text-neutral-900 block leading-tight">Levantamento Fotográfico</span>
                        <span className="text-[10px] text-neutral-400">Vistoria in loco dos shafts e laje</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs">OK</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-neutral-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px]">XLS</span>
                      <div>
                        <span className="font-semibold text-neutral-900 block leading-tight">Quadro de Colaboradores</span>
                        <span className="text-[10px] text-neutral-400">Distribuição por departamentos</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs">OK</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Program of Needs (What architects need to design) */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                Programa de Necessidades de Arquitetura Corporativa
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase block">Postos de Trabalho</span>
                  <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                    {project.briefing?.programOfNeeds?.workstations || '—'}
                  </span>
                  <span className="text-[10px] text-neutral-400">Open space flexível</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase block">Salas de Reunião</span>
                  <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                    {project.briefing?.programOfNeeds?.meetingRooms || '—'}
                  </span>
                  <span className="text-[10px] text-neutral-400">Acústica Rw &gt; 45dB</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase block">Cabines de Foco</span>
                  <span className="text-xl font-bold font-mono text-neutral-900 mt-1 block">
                    {project.briefing?.programOfNeeds?.focusPods || '—'}
                  </span>
                  <span className="text-[10px] text-neutral-400">Phone booths acústicas</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase block">Crescimento Previsto</span>
                  <span className="text-xs font-bold text-neutral-900 mt-2 block">
                    {project.briefing?.programOfNeeds?.expansionForecast || 'Não informado'}
                  </span>
                </div>
              </div>

              {/* CARD DESTAQUE: ÁREA WELLNESS & BEM-ESTAR CORPORATIVO */}
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    Área Wellness & Saúde Corporativa
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    project.briefing?.programOfNeeds?.hasWellnessArea !== false
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {project.briefing?.programOfNeeds?.hasWellnessArea !== false ? 'Área Wellness Ativa' : 'Não Solicitado'}
                  </span>
                </div>

                {project.briefing?.programOfNeeds?.hasWellnessArea !== false && (
                  <p className="text-xs text-rose-950 leading-relaxed bg-white/70 p-3 rounded-lg border border-rose-200/60">
                    {project.briefing?.programOfNeeds?.wellnessDetails ||
                      'Espaço dedicado ao bem-estar corporativo com sala de descompressão, biofilia ativa, área de relaxamento e suporte à saúde física e mental dos colaboradores.'}
                  </p>
                )}
              </div>

              {project.briefing?.programOfNeeds?.specialRooms && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs">
                  <span className="font-bold text-neutral-700 block mb-1">Espaços Especiais Exigidos:</span>
                  <p className="text-neutral-800">{project.briefing.programOfNeeds.specialRooms}</p>
                </div>
              )}
            </div>

            {/* Premises & Condominium alerts */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Premissas Construtivas, Condomínio & Acústica
              </h3>
              <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 font-mono">
                {project.briefing?.premisesAndAlerts || project.notes || project.description}
              </p>
            </div>

            {/* Phase breakdown */}
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
                Ciclo de Fases de Arquitetura Corporativa
              </h3>
              <div className="space-y-3">
                {ARCHITECTURE_PHASES.map((p, idx) => {
                  const isCurrent = p.id === project.currentPhase;
                  const phaseTasks = projectTasks.filter((t) => t.phase === p.id);
                  const done = phaseTasks.filter((t) => t.completed || t.status === 'concluida').length;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                        isCurrent ? 'border-pink-600 bg-pink-50/50 font-semibold' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold bg-neutral-100 text-neutral-800">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs text-neutral-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: p.color }} />
                            {p.name}
                            {isCurrent && (
                              <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.2 rounded-xs ml-2">
                                Fase Atual
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 font-normal">{p.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono tabular-nums text-neutral-700">
                          {done}/{phaseTasks.length} tarefas
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right sidebar: Technical & Commercial Specs */}
          <div className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b pb-2">
                Ficha Técnica & Esteira
              </h3>

              <div>
                <span className="text-[11px] text-neutral-500 block">Identificador do Projeto</span>
                <span className="text-xs font-mono font-semibold text-neutral-900">{project.code}</span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-500 block">Cliente Corporativo</span>
                <span className="text-xs font-semibold text-neutral-900">{project.client}</span>
                {project.briefing?.clientContactPerson && (
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    {project.briefing.clientContactPerson}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-neutral-500 block">Classificação de Prioridade</span>
                <span className="mt-1 block">
                  {project.priority ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      {project.priority.toUpperCase().replace('_', ' ')}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-neutral-600">P2 ALTA</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-500 block">Área de Projeto</span>
                <span className="text-xs font-mono font-bold text-neutral-900 tabular-nums">
                  {project.areaM2.toLocaleString('pt-BR')} m²
                </span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-500 block">Data de Entrada da Demanda</span>
                <span className="text-xs font-mono text-neutral-900 tabular-nums">
                  {formatDatePT(project.entryDate || project.startDate)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-500 block">Início Previsto (Kickoff)</span>
                <span className="text-xs font-mono text-neutral-900 tabular-nums">
                  {formatDatePT(project.startDate)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-500 block">Data Limite de Inauguração</span>
                <span className="text-xs font-mono text-neutral-900 tabular-nums">
                  {formatDatePT(project.targetEndDate)}
                </span>
              </div>

              {project.estimatedBudgetBRL && (
                <div>
                  <span className="text-[11px] text-neutral-500 block">Orçamento Estimado</span>
                  <span className="text-xs font-mono font-semibold text-emerald-800 tabular-nums">
                    R$ {project.estimatedBudgetBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[11px] text-neutral-500 block">Status Operacional</span>
                <span className="text-xs font-medium text-neutral-800 uppercase tracking-wide">
                  {project.status}
                </span>
              </div>

              {/* Action Button to Launch Briefing Edit */}
              {onEditBriefing && (
                <div className="pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => onEditBriefing(project)}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Briefing Completo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        project={project}
        tasks={tasks}
        allTeamMembers={allTeamMembers}
      />

    </div>
  );
};
