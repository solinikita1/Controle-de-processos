import React, { useState } from 'react';
import { Project, TeamMember, ProjectPriority, PipelineStage } from '../types';
import { formatDateShort, calculateDaysDifference } from '../utils/dateUtils';
import {
  FileText,
  FolderOpen,
  Calendar,
  AlertTriangle,
  Users,
  Building2,
  Clock,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  ArrowUpDown,
  HeartPulse,
  Handshake,
  Mail,
  Phone,
  Trophy
} from 'lucide-react';

interface EsteiraPipelineViewProps {
  projects: Project[];
  allTeamMembers: TeamMember[];
  onSelectProject: (projectId: string) => void;
  onNewBriefing: () => void;
  onEditBriefing: (project: Project) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onReorderProjects: (orderedProjects: Project[]) => void;
  onOpenAwardModal?: (project: Project) => void;
}

export const EsteiraPipelineView: React.FC<EsteiraPipelineViewProps> = ({
  projects,
  allTeamMembers,
  onSelectProject,
  onNewBriefing,
  onEditBriefing,
  onUpdateProject,
  onReorderProjects,
  onOpenAwardModal,
}) => {
  const [viewMode, setViewMode] = useState<'fila' | 'kanban'>('fila');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedHead, setSelectedHead] = useState<string>('all');

  const getMember = (id: string) => allTeamMembers.find((m) => m.id === id);

  // Sort projects primarily by pipelineOrder, falling back to priority and entryDate
  const sortedProjects = [...projects].sort((a, b) => {
    const orderA = a.pipelineOrder ?? 99;
    const orderB = b.pipelineOrder ?? 99;
    if (orderA !== orderB) return orderA - orderB;

    const prioWeight: { [key: string]: number } = {
      p1_urgente: 1,
      p2_alta: 2,
      p3_media: 3,
      p4_baixa: 4,
    };
    const pA = prioWeight[a.priority || 'p3_media'];
    const pB = prioWeight[b.priority || 'p3_media'];
    if (pA !== pB) return pA - pB;

    return (a.entryDate || a.createdAt).localeCompare(b.entryDate || b.createdAt);
  });

  const filteredProjects = sortedProjects.filter((p) => {
    if (selectedPriority !== 'all' && p.priority !== selectedPriority) return false;
    if (selectedHead !== 'all') {
      const bHead = p.briefing?.submittedByMemberId;
      if (bHead !== selectedHead) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchClient = p.client.toLowerCase().includes(q);
      const matchCode = p.code.toLowerCase().includes(q);
      const matchHead = p.briefing?.submittedByName?.toLowerCase().includes(q) || false;
      return matchName || matchClient || matchCode || matchHead;
    }
    return true;
  });

  // Reordering handlers to prevent projects from jumping ahead or getting lost
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...sortedProjects];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;

    // Re-index pipelineOrder
    const updated = newOrder.map((proj, idx) => ({
      ...proj,
      pipelineOrder: idx + 1,
    }));
    onReorderProjects(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= sortedProjects.length - 1) return;
    const newOrder = [...sortedProjects];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;

    // Re-index pipelineOrder
    const updated = newOrder.map((proj, idx) => ({
      ...proj,
      pipelineOrder: idx + 1,
    }));
    onReorderProjects(updated);
  };

  const handleChangePriority = (project: Project, newPriority: ProjectPriority) => {
    onUpdateProject({
      ...project,
      priority: newPriority,
    });
  };

  // Pipeline Metrics
  const totalInQueue = projects.length;
  const urgentCount = projects.filter((p) => p.priority === 'p1_urgente').length;
  const inBriefingCount = projects.filter((p) => p.currentPhase === 'captacao_briefing' || p.status === 'briefing').length;
  const readyKickoffCount = projects.filter((p) => p.briefing?.readyForDesignTeam && p.status === 'briefing').length;

  const getPriorityBadge = (prio?: ProjectPriority) => {
    switch (prio) {
      case 'p1_urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            P1 · Urgente / Estratégico
          </span>
        );
      case 'p2_alta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            P2 · Alta Prioridade
          </span>
        );
      case 'p3_media':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            P3 · Normal / Cronológica
          </span>
        );
      case 'p4_baixa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-300">
            P4 · Standby / Backlog
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            P3 · Normal
          </span>
        );
    }
  };

  // Pipeline stages definitions (Workplace Corporate Architecture Esteira)
  const STAGES: { id: PipelineStage; name: string; icon: any; color: string; desc: string }[] = [
    {
      id: 'captacao_esteira',
      name: '1. Captação & Esteira',
      icon: FolderOpen,
      color: 'border-pink-500 bg-pink-50/40 text-pink-900',
      desc: 'Nova demanda, briefing corporativo e SharePoint',
    },
    {
      id: 'criacao_andamento',
      name: '2. Área de Criação (3 Etapas)',
      icon: Sparkles,
      color: 'border-purple-500 bg-purple-50/40 text-purple-900',
      desc: 'Conceitual, Orçamento do cliente e Apresentação',
    },
    {
      id: 'aguardando_award',
      name: '3. Decisão de Award',
      icon: Trophy,
      color: 'border-amber-500 bg-amber-50/40 text-amber-900',
      desc: 'Apresentação entregue, aguardando compra do cliente',
    },
    {
      id: 'executivo_pos_award',
      name: '4. Projeto Executivo (4 Pilares)',
      icon: Layers,
      color: 'border-sky-500 bg-sky-50/40 text-sky-900',
      desc: 'Plantas, Complementares, Condomínio e Seguros',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
              Esteira de Entrada & Briefing Comercial
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="text-xs text-neutral-400">Controle de Fluxo e Fila</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            Esteira Sequencial de Projetos & Briefings
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5 max-w-3xl">
            Encaixe ordenado por <strong>data de entrada</strong> e <strong>classificação de prioridade</strong>. Centraliza documentos, prazos do cliente e o briefing completo para o time conceitual antes do início do projeto.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onNewBriefing}
            className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-all flex items-center gap-2 shrink-0 group"
          >
            <Plus className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
            <span>+ Nova Demanda Comercial (Briefing)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-xs font-semibold">Total na Esteira</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono tabular-nums">
            {totalInQueue}
          </div>
          <span className="text-[10px] text-neutral-400">Projetos sob gestão</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold">P1 · Urgentes / Estratégicos</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono tabular-nums">
            {urgentCount}
          </div>
          <span className="text-[10px] text-rose-500">Prioridade máxima imediata</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-pink-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-pink-700 mb-1">
            <span className="text-xs font-semibold">Em Captação & Briefing</span>
            <FileText className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-black text-pink-600 font-mono tabular-nums">
            {inBriefingCount}
          </div>
          <span className="text-[10px] text-pink-600">Documentos e pasta de rede</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold">Prontos para Kickoff</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums">
            {readyKickoffCount}
          </div>
          <span className="text-[10px] text-emerald-600">Briefing liberado aos arquitetos</span>
        </div>
      </div>

      {/* Control Bar: Filters & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Filtrar por projeto, cliente, código ou Head comercial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-400"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs font-medium text-neutral-700 border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="p1_urgente">🔴 P1 - Urgente</option>
              <option value="p2_alta">🟠 P2 - Alta</option>
              <option value="p3_media">🔵 P3 - Normal</option>
              <option value="p4_baixa">⚪ P4 - Standby</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('fila')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'fila' ? 'bg-white text-stone-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Fila Sequencial
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'kanban' ? 'bg-white text-stone-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Estágios da Esteira
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: FILA SEQUENCIAL (CONVEYOR QUEUE) */}
      {viewMode === 'fila' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span className="font-semibold text-neutral-700">
              Ordem de Encaixe na Fila ({filteredProjects.length} projetos)
            </span>
            <span className="text-[11px] text-neutral-400">
              Use as setas ▲ ▼ para reordenar a prioridade de atendimento sem que projetos furem fila.
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredProjects.map((project, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === filteredProjects.length - 1;
              const briefing = project.briefing;
              const isP1 = project.priority === 'p1_urgente';

              return (
                <div
                  key={project.id}
                  className={`bg-white rounded-xl border p-4 sm:p-5 transition-all shadow-2xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isP1 ? 'border-rose-300 ring-1 ring-rose-200/50' : 'border-neutral-200'
                  }`}
                >
                  {/* Left: Position Rank + Core Details */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-xs ${
                        isP1 ? 'bg-rose-600 text-white' : 'bg-stone-900 text-white'
                      }`}>
                        #{idx + 1}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold mt-1">
                        Posição
                      </span>
                    </div>

                    {/* Project Information */}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-neutral-500">{project.code}</span>
                        {getPriorityBadge(project.priority)}
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-neutral-100 text-neutral-700">
                          {project.typology}
                        </span>

                        {/* Negotiation Model Badge (BTS / CAPEX / Turnkey) */}
                        {briefing?.negotiationModel && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase flex items-center gap-1">
                            <Handshake className="w-3 h-3 text-emerald-600" />
                            {briefing.negotiationModel === 'bts'
                              ? 'BTS (Built to Suit)'
                              : briefing.negotiationModel === 'capex_direto'
                              ? 'CAPEX Direto'
                              : briefing.negotiationModel === 'turnkey'
                              ? 'Turnkey'
                              : briefing.negotiationModel === 'taxa_administracao'
                              ? 'Cost-Plus'
                              : 'Arquitetura'}
                          </span>
                        )}

                        {/* Wellness Badge */}
                        {briefing?.programOfNeeds?.hasWellnessArea && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <HeartPulse className="w-3 h-3 text-rose-600" />
                            Wellness
                          </span>
                        )}

                        {briefing?.readyForDesignTeam ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Briefing Pronto
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Briefing em Rascunho
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectProject(project.id)}
                        className="text-base font-bold text-neutral-900 hover:text-stone-700 cursor-pointer leading-tight truncate"
                      >
                        {project.name}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                        <span>Cliente: <strong className="text-neutral-800">{project.client}</strong></span>
                        <span>·</span>
                        <span>Área: <strong className="font-mono text-neutral-800">{project.areaM2.toLocaleString('pt-BR')} m²</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          Entrada: <strong className="text-neutral-800">{formatDateShort(project.entryDate || project.createdAt)}</strong>
                        </span>
                        {briefing?.targetKickoffDate && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-amber-800 font-medium">
                              Kickoff Previsto: <strong>{formatDateShort(briefing.targetKickoffDate)}</strong>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Client Contact Details Preview */}
                      {briefing?.clientContactPerson && (
                        <div className="flex items-center gap-2 text-[11px] text-blue-900 bg-blue-50/60 px-2 py-1 rounded-md border border-blue-200/60 max-w-fit">
                          <Users className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>
                            Contato: <strong>{briefing.clientContactPerson}</strong>
                            {briefing.clientContactRole && ` (${briefing.clientContactRole})`}
                          </span>
                          {briefing.clientContactPhone && (
                            <span className="text-neutral-500 font-mono">· {briefing.clientContactPhone}</span>
                          )}
                        </div>
                      )}

                      {/* Head Commercial Log & Folder Link */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-500 flex-wrap">
                        {briefing?.submittedByName && (
                          <span className="flex items-center gap-1 text-neutral-700 font-medium">
                            <Clock className="w-3 h-3 text-pink-600" />
                            Trazido por: <strong>{briefing.submittedByName}</strong> em {briefing.submittedAt}
                          </span>
                        )}

                        {briefing?.documentsFolderUrl && (
                          <a
                            href={briefing.documentsFolderUrl.startsWith('http') ? briefing.documentsFolderUrl : '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-900 font-semibold hover:underline"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                            Pasta no SharePoint/Rede
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions, Reordering & Priority Control */}
                  <div className="flex items-center gap-2 shrink-0 md:self-center border-t md:border-t-0 pt-3 md:pt-0">
                    {/* Priority Selector Quick Change */}
                    <div className="flex flex-col text-right mr-1">
                      <span className="text-[10px] text-neutral-400 font-semibold mb-0.5">Prioridade:</span>
                      <select
                        value={project.priority || 'p3_media'}
                        onChange={(e) => handleChangePriority(project, e.target.value as ProjectPriority)}
                        className="text-xs font-bold px-2 py-1 border border-neutral-300 rounded-md bg-white focus:outline-hidden"
                      >
                        <option value="p1_urgente">P1 · Urgente</option>
                        <option value="p2_alta">P2 · Alta</option>
                        <option value="p3_media">P3 · Normal</option>
                        <option value="p4_baixa">P4 · Standby</option>
                      </select>
                    </div>

                    {/* Reorder Buttons (Move Up / Down) */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveUp(idx)}
                        title="Subir prioridade na esteira (adiantar na fila)"
                        className={`p-1.5 rounded-md border text-neutral-600 transition-colors ${
                          isFirst
                            ? 'opacity-30 cursor-not-allowed border-neutral-200 bg-neutral-50'
                            : 'border-neutral-300 bg-white hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveDown(idx)}
                        title="Descer posição na esteira (postergar na fila)"
                        className={`p-1.5 rounded-md border text-neutral-600 transition-colors ${
                          isLast
                            ? 'opacity-30 cursor-not-allowed border-neutral-200 bg-neutral-50'
                            : 'border-neutral-300 bg-white hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Award Button or Badge */}
                    {project.award?.status === 'awarded' ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1 shrink-0">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        <span>Award OK</span>
                      </span>
                    ) : onOpenAwardModal && (
                      <button
                        type="button"
                        onClick={() => onOpenAwardModal(project)}
                        className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dar Award</span>
                      </button>
                    )}

                    {/* Edit Briefing Button */}
                    <button
                      type="button"
                      onClick={() => onEditBriefing(project)}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Briefing</span>
                    </button>

                    {/* Open Project Button */}
                    <button
                      type="button"
                      onClick={() => onSelectProject(project.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span>Abrir</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ESTÁGIOS DA ESTEIRA (KANBAN CONVEYOR) */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            // Map projects into the 4 Workplace stages
            const stageProjects = sortedProjects.filter((p) => {
              if (stage.id === 'captacao_esteira') {
                return p.currentPhase === 'captacao_briefing';
              }
              if (stage.id === 'criacao_andamento') {
                return (
                  p.currentPhase === 'criacao_conceitual' ||
                  p.currentPhase === 'criacao_orcamento' ||
                  p.currentPhase === 'estudo_preliminar' ||
                  p.currentPhase === 'anteprojeto'
                );
              }
              if (stage.id === 'aguardando_award') {
                return (
                  (p.currentPhase === 'criacao_apresentacao' || p.pipelineStage === 'aguardando_award') &&
                  p.award?.status !== 'awarded'
                );
              }
              // executivo_pos_award
              return (
                p.award?.status === 'awarded' ||
                p.currentPhase.startsWith('executivo_') ||
                p.currentPhase === 'projeto_executivo' ||
                p.currentPhase === 'detalhamento' ||
                p.currentPhase === 'projeto_legal' ||
                p.currentPhase === 'acompanhamento_obra'
              );
            });

            return (
              <div
                key={stage.id}
                className="bg-neutral-50/70 border border-neutral-200 rounded-xl p-3.5 flex flex-col min-h-[450px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${stage.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{stage.name}</h4>
                      <p className="text-[10px] text-neutral-500 leading-tight">{stage.desc}</p>
                    </div>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white border border-neutral-300 text-xs font-mono font-bold flex items-center justify-center text-neutral-800">
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageProjects.length === 0 ? (
                    <div className="p-6 text-center text-neutral-400 text-xs italic">
                      Nenhum projeto nesta etapa.
                    </div>
                  ) : (
                    stageProjects.map((p) => {
                      const isAwarded = p.award?.status === 'awarded';
                      return (
                        <div
                          key={p.id}
                          className="bg-white p-3.5 rounded-xl border border-neutral-200 hover:border-stone-400 hover:shadow-xs transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] text-neutral-500 font-bold">{p.code}</span>
                            {getPriorityBadge(p.priority)}
                          </div>

                          <h5
                            onClick={() => onSelectProject(p.id)}
                            className="text-xs font-bold text-neutral-900 leading-snug cursor-pointer hover:text-stone-700"
                          >
                            {p.name}
                          </h5>

                          <div className="text-[11px] text-neutral-500">
                            Cliente: <strong className="text-neutral-800">{p.client}</strong>
                          </div>

                          {/* Award Status Badge or Quick Award Button */}
                          {isAwarded ? (
                            <div className="p-1.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-amber-600" />
                                Award Fechado
                              </span>
                              {p.award?.awardValueBRL && (
                                <span className="font-mono">R$ {p.award.awardValueBRL.toLocaleString('pt-BR')}</span>
                              )}
                            </div>
                          ) : onOpenAwardModal && (stage.id === 'criacao_andamento' || stage.id === 'aguardando_award') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAwardModal(p);
                              }}
                              className="w-full py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors flex items-center justify-center gap-1"
                            >
                              <Trophy className="w-3 h-3 text-amber-600" />
                              <span>Registrar Award (Compra)</span>
                            </button>
                          )}

                          {p.briefing && (
                            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                              <span>Kickoff: {formatDateShort(p.briefing.targetKickoffDate)}</span>
                              {p.briefing.documentsFolderUrl && (
                                <span className="flex items-center gap-0.5 text-amber-700 font-semibold">
                                  <FolderOpen className="w-3 h-3" />
                                  Pasta OK
                                </span>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectProject(p.id)}
                            className="w-full mt-1 py-1 text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors text-center"
                          >
                            Ver Detalhes do Projeto →
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
