export type TaskPriority = 'baixa' | 'media' | 'alta' | 'critica';

export type TaskStatus = 'a_fazer' | 'em_andamento' | 'em_revisao' | 'concluida';

export type ArchitecturePhase = 
  // Fases Oficiais do Fluxo Workplace:
  | 'captacao_briefing'             // 1. Captação & Encaixe na Esteira
  | 'criacao_conceitual'            // 2.1 Projeto de Criação: Projeto Conceitual
  | 'criacao_orcamento'             // 2.2 Projeto de Criação: Orçamento do Cliente
  | 'criacao_apresentacao'          // 2.3 Projeto de Criação: Apresentação (Conceito + Orçamento)
  | 'executivo_plantas'             // 3.1 Projeto Executivo: Todas as Plantas
  | 'executivo_complementares'      // 3.2 Projeto Executivo: Complementares (Elétrica, Hidráulica, Ar-Condicionado, Incêndio)
  | 'executivo_aprovacao_condominio'// 3.3 Projeto Executivo: Aprovação no Condomínio
  | 'executivo_seguros_documentos'  // 3.4 Projeto Executivo: Seguros & Documentos Obrigatórios do Cliente
  | 'acompanhamento_obra'           // 4. Implantação e Obra
  // Aliases legados para compatibilidade
  | 'estudo_preliminar'
  | 'anteprojeto'
  | 'projeto_legal'
  | 'projeto_executivo'
  | 'detalhamento';

export interface ArchitecturePhaseInfo {
  id: ArchitecturePhase;
  name: string;
  shortName: string;
  description: string;
  color: string;
  stageGroup?: 'esteira' | 'criacao' | 'executivo' | 'obra';
}

export type AwardStatus = 'em_concorrencia' | 'awarded' | 'declinado';

export interface ProjectAwardInfo {
  status: AwardStatus;
  awardedAt?: string;
  awardValueBRL?: number;
  clientDecisionMaker?: string;
  notes?: string;
}

export type ProjectPriority = 'p1_urgente' | 'p2_alta' | 'p3_media' | 'p4_baixa';

export type PipelineStage = 
  | 'captacao_esteira'
  | 'criacao_andamento'
  | 'aguardando_award'
  | 'executivo_pos_award'
  | 'obra_implantacao'
  // Legados
  | 'briefing_rascunho'
  | 'briefing_concluido'
  | 'em_esteira_iniciacao'
  | 'desenvolvimento_ativo'
  | 'entregue';

export interface BriefingAttachment {
  id: string;
  name: string;
  category: 'planta' | 'manual_predial' | 'fotos' | 'programa' | 'outro';
  size?: string;
  uploadedAt: string;
  url?: string;
}

export type NegotiationModel = 
  | 'bts'                 // Built to Suit (Fundo Imobiliário / Locador)
  | 'capex_direto'        // Capex Próprio do Cliente (Investimento Direto)
  | 'turnkey'             // Turnkey / Preço Fechado (Projeto + Implantação)
  | 'taxa_administracao'  // Administração de Obra (Cost-Plus)
  | 'projeto_arquitetura' // Escopo Fechado de Projeto de Arquitetura
  | 'outro';

export interface ProjectBriefing {
  submittedAt: string; // Data e hora exata em que o head inseriu as informações (ex: "2026-10-21 14:30")
  updatedAt?: string;
  submittedByMemberId: string; // ID do Head (ex: 'team-leonardo')
  submittedByName: string; // Nome e cargo do Head
  documentsFolderUrl: string; // Link da pasta no SharePoint/OneDrive ou caminho na rede corporativa
  
  // Ponto de contato corporativo no cliente
  clientContactPerson?: string; // Nome do ponto de contato principal
  clientContactEmail?: string;  // E-mail corporativo do contato
  clientContactPhone?: string;  // Telefone / Celular corporativo
  clientContactRole?: string;   // Cargo (ex: Gerente de Facilities & Real Estate)

  // Modelo de Oferta & Negociação Comercial Corporativa
  negotiationModel?: NegotiationModel; // BTS, CAPEX Direto, Turnkey, etc.
  negotiationNotes?: string;           // Premissas comerciais da proposta e negociação

  // Programa de necessidades de arquitetura corporativa
  programOfNeeds: {
    workstations?: number; // Postos de trabalho previstos
    meetingRooms?: number; // Salas de reunião
    focusPods?: number; // Cabines individuais de foco (phone booths)
    specialRooms?: string; // Ex: Diretoria acústica, cafeteria central, auditório
    hasServerRoom?: boolean;
    expansionForecast?: string; // Previsão de crescimento percentual da empresa
    hasWellnessArea?: boolean;  // Área Wellness & Bem-Estar Corporativo
    wellnessDetails?: string;   // Detalhes (descompressão, lactário, massagem, biofilia, vestiários ciclistas)
  };

  premisesAndAlerts: string; // Premissas críticas, restrições do condomínio, isolamento acústico
  targetKickoffDate: string; // Data planejada de entrada na esteira dos arquitetos
  estimatedBudgetRange?: string; // Faixa de investimento (Capex estimado)
  clientDeadlines: string; // Prazo contratual inegociável do cliente
  commercialObservations?: string; // Notas estratégicas do Head de Negócios
  readyForDesignTeam: boolean; // Flag: se o briefing está finalizado e pronto para o time conceitual
}

export type Department = 
  | 'Diretoria'
  | 'Operações'
  | 'Negócios'
  | 'Comercial'
  | 'Financeiro'
  | 'Projetos'
  | 'TI'
  | string;

export interface TeamMember {
  id: string;
  name: string;
  role: string; // Ex: "CSO", "CEO", "Head de Operações", "Head de Negócios", "Financeiro", "Arquiteta"
  email: string;
  phone?: string;
  cau?: string; // Registro CAU/BR ou CREA
  initials: string;
  avatarColor: string;
  department: Department;
  isDirector?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarColor: string;
  department: string;
  isDirector?: boolean;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  phase: ArchitecturePhase;
  responsibleId: string; // ID do membro da equipe responsável
  startDate: string; // YYYY-MM-DD (OBRIGATÓRIO)
  endDate: string; // YYYY-MM-DD (OBRIGATÓRIO)
  priority: TaskPriority; // Importância da tarefa
  status: TaskStatus; // Status da tarefa
  completed: boolean; // "se já fez"
  deliverables?: string; // Entregáveis (ex: Pranchas PDF/DWG, Modelo IFC)
  checklist?: TaskChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  executiveRevisions?: ExecutiveRevision[];
  creationRounds?: CreationRound[];
  id: string;
  code: string; // Ex: "ARC-2026-08"
  name: string;
  client: string;
  location: string;
  areaM2: number; // Metragem quadrada corporativa
  typology: 'Escritório Corporativo' | 'Hub de Inovação' | 'Sede Institucional' | 'Coworking' | 'Retrofit Comercial' | 'Data Center & Tech';
  description: string;
  status: 'briefing' | 'desenvolvimento' | 'aprovacao' | 'obra' | 'pausado' | 'entregue' | 'arquivado';
  currentPhase: ArchitecturePhase;
  priority?: ProjectPriority; // Classificação de prioridade na esteira (P1, P2, P3, P4)
  pipelineStage?: PipelineStage; // Estágio na esteira de entrada
  pipelineOrder?: number; // Posição ordinal na esteira (1, 2, 3...)
  entryDate?: string; // Data de entrada da demanda trazida pelo comercial (YYYY-MM-DD)
  briefing?: ProjectBriefing; // Central de briefing e documentos da demanda
  award?: ProjectAwardInfo; // Marco de Award / Compra do projeto pelo cliente
  isArchived?: boolean; // Se o projeto foi arquivado
  archivedAt?: string; // Data em que foi arquivado (YYYY-MM-DD HH:mm)
  archivedReason?: string; // Motivo do arquivamento
  startDate: string; // YYYY-MM-DD (OBRIGATÓRIO)
  targetEndDate: string; // YYYY-MM-DD (OBRIGATÓRIO)
  estimatedBudgetBRL?: number;
  teamMemberIds: string[]; // Membros da equipe alocados neste projeto
  createdAt: string;
  notes?: string;
}

export interface StudioStats {
  totalProjects: number;
  activeProjects: number;
  totalAreaM2: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  criticalTasks: number;
}

export interface BackupPayload {
  version: string;
  systemName: string;
  exportedAt: string;
  exportedBy?: string;
  projects: Project[];
  tasks: Task[];
  team: TeamMember[];
}

export interface BackupSnapshot {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  projectCount: number;
  taskCount: number;
  teamCount: number;
  sizeBytes: number;
  payload: BackupPayload;
}

export interface CreationWork { taskId?:string; responsibleId: string; dueDate: string; done: boolean; }
export interface CreationEvent { id: string; at: string; by: string; action: string; date: string; note: string; link: string; recipient: string; followUp: string; }
export interface CreationRound { number: number; scope: 'initial'|'project'|'budget'|'both'; request: string; state: 'draft'|'ready'|'presented'|'waiting'|'approved'|'closed'; projectWork?: CreationWork; budgetWork?: CreationWork; events: CreationEvent[]; }
export interface ExecutiveRevision {
 number:number; phase:ArchitecturePhase; request:string; responsibleId:string; dueDate:string; taskId:string;
 state:'working'|'waiting'|'approved'|'superseded'; createdAt:string; createdBy:string;
 events: {action:'send'|'approve';date:string;by:string;note:string;recipient:string;link:string}[];
}
