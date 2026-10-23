import React, { useState, useEffect, useRef } from 'react';
import { Project, Task, TeamMember, TaskStatus, AuthUser, ProjectAwardInfo, ArchitecturePhase, BackupSnapshot, BackupPayload } from './types';
import {
  saveStoredProjects,
  saveStoredTasks,
  saveStoredTeam,
  computeStudioStats,
  deduplicateById,
  saveStoredBackups,
  createBackupPayload,
  validateBackupPayload,
  downloadJsonFile,
} from './utils/storage';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ProjectDetail } from './components/ProjectDetail';
import { TeamDirectory } from './components/TeamDirectory';
import { OverallTimeline } from './components/OverallTimeline';
import { MyTasksView } from './components/MyTasksView';
import { MicrosoftLoginModal } from './components/MicrosoftLoginModal';
import { ProjectModal } from './components/ProjectModal';
import { TaskModal } from './components/TaskModal';
import { TeamModal } from './components/TeamModal';
import { EsteiraPipelineView } from './components/EsteiraPipelineView';
import { BriefingModal } from './components/BriefingModal';
import { ReportsAnalyticsView } from './components/ReportsAnalyticsView';
import { AwardModal } from './components/AwardModal';
import { BackupModal } from './components/BackupModal';
import { WorkplaceLogo } from './components/WorkplaceLogo';
import { Sparkles } from 'lucide-react';
import { exportProjectToCsv, exportProjectToJson, exportAllProjectsToCsv } from './utils/exportUtils';
import {
  subscribeToProjects,
  subscribeToTasks,
  subscribeToTeam,
  subscribeToBackups,
  saveBackupToCloud,
  deleteBackupFromCloud,
  restoreDataInCloudBatch,
  commitCloudChanges,
} from './services/firebase';
import { watchAuthorizedUser, signInWithMicrosoft, signOutMicrosoft } from './services/auth';
import type { CloudChange } from './utils/restorePlan';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'project' | 'team' | 'timeline' | 'my_tasks' | 'esteira' | 'reports'>('overview');
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Briefing intake modal state
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [projectForBriefing, setProjectForBriefing] = useState<Project | null>(null);

  // Award modal state (Decisão de Compra do Cliente)
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [projectForAward, setProjectForAward] = useState<Project | null>(null);

  // Microsoft Authentication modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);

  // Backup & Restore modal state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [cloudBackups, setCloudBackups] = useState<BackupSnapshot[]>([]);

  // Notification feedback banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [authError,setAuthError]=useState<string|null>(null);
  const [isSaving,setIsSaving]=useState(false);
  const [syncError,setSyncError]=useState<string|null>(null);
  const mutation=useRef<{changes:CloudChange[];publish:(()=>void)[];messages:string[]}|null>(null);
  const showToast=(msg:string)=>{
    if(mutation.current) { mutation.current.messages.push(msg); return; }
    setToastMessage(msg);
  };
  useEffect(()=>{
    if(!toastMessage) return;
    const timer=setTimeout(()=>setToastMessage(null),6000);
    return ()=>clearTimeout(timer);
  },[toastMessage]);
  const publish=(fn:()=>void)=>{ if(mutation.current) mutation.current.publish.push(fn); else fn(); };
  const saveProjectToCloud=(data:Project)=>mutation.current!.changes.push({collection:'projects',id:data.id,data});
  const saveTaskToCloud=(data:Task)=>mutation.current!.changes.push({collection:'tasks',id:data.id,data});
  const saveTeamMemberToCloud=(data:TeamMember)=>mutation.current!.changes.push({collection:'teamMembers',id:data.id,data});
  const deleteProjectFromCloud=(id:string)=>mutation.current!.changes.push({collection:'projects',id});
  const deleteTaskFromCloud=(id:string)=>mutation.current!.changes.push({collection:'tasks',id});
  const withMutation=<A extends unknown[]>(work:(...args:A)=>void)=>async(...args:A):Promise<boolean>=>{
    if(mutation.current || isSaving) return false;
    if(!currentUser || !isCloudConnected) { showToast('Aguarde a conexão com o servidor antes de salvar.'); return false; }
    const pending={changes:[] as CloudChange[],publish:[] as (()=>void)[],messages:[] as string[]};
    mutation.current=pending; setIsSaving(true);
    try {
        work(...args);
        await commitCloudChanges(pending.changes);
        pending.publish.forEach(fn=>fn());
        setToastMessage(pending.messages.at(-1) || (pending.changes.length?'Alterações salvas.':null));
        return true;
      } catch(error) {
        setToastMessage('Não foi possível salvar. '+(error instanceof Error?error.message:'Tente novamente.'));
        return false;
      } finally { mutation.current=null; setIsSaving(false); }
  };

  useEffect(()=>watchAuthorizedUser(user=>{
    setCurrentUser(user); setAuthError(null);
    setProjects([]); setTasks([]); setTeamMembers([]); setCloudBackups([]);
    setIsCloudConnected(false);
    if(user) setIsAuthModalOpen(false);
  },error=>{setCurrentUser(null);setAuthError(error.message);}),[]);

  useEffect(()=>{
    if(!currentUser) return;
    let active=true;
    const ready=new Set<string>();
    const confirmed=(key:string)=>{ if(active) { ready.add(key); if(ready.size===4) {setIsCloudConnected(true);setSyncError(null);} } };
    const fail=(error:Error)=>{ if(active) {ready.clear();setIsCloudConnected(false);setSyncError('Sincronização indisponível: '+error.message);} };
    const subscriptions=[
      subscribeToProjects(items=>{if(active){setProjects(items);saveStoredProjects(items);confirmed('projects');}},fail),
      subscribeToTasks(items=>{if(active){setTasks(items);saveStoredTasks(items);confirmed('tasks');}},fail),
      subscribeToTeam(items=>{if(active){setTeamMembers(items);saveStoredTeam(items);confirmed('team');}},fail),
      subscribeToBackups(items=>{if(active){setCloudBackups(items);saveStoredBackups(items);confirmed('backups');}},fail),
    ];
    return ()=>{active=false;subscriptions.forEach(unsubscribe=>unsubscribe());};
  },[currentUser]);

  // Sync to storage
  const updateProjects = (newProjects: Project[]) => {
    const clean = deduplicateById(newProjects);
    publish(()=>{setProjects(clean);saveStoredProjects(clean);});
  };

  const updateTasks = (newTasks: Task[]) => {
    const clean = deduplicateById(newTasks);
    publish(()=>{setTasks(clean);saveStoredTasks(clean);});
  };

  const updateTeam = (newTeam: TeamMember[]) => {
    const clean = deduplicateById(newTeam);
    publish(()=>{setTeamMembers(clean);saveStoredTeam(clean);});
  };

  const handleLogin=async()=>{setAuthError(null);await signInWithMicrosoft();};
  const handleLogout=async()=>{try {await signOutMicrosoft();}catch(error){setAuthError(error instanceof Error?error.message:'Falha ao sair.');}};

  // Currently active project
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  // Studio statistics
  const stats = computeStudioStats(projects, tasks);

  // --- Handlers: Projects ---
  const handleOpenNewProject = () => {
    setProjectToEdit(null);
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (proj?: Project) => {
    setProjectToEdit(proj || currentProject);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = withMutation((projectData: Project) => {
    const exists = projects.some((p) => p.id === projectData.id);
    let nextProjects: Project[];
    if (exists) {
      nextProjects = projects.map((p) => (p.id === projectData.id ? projectData : p));
      showToast(`Projeto "${projectData.name}" atualizado com sucesso.`);
    } else {
      nextProjects = [projectData, ...projects];
      showToast(`Novo projeto "${projectData.name}" criado com sucesso!`);
    }
    updateProjects(nextProjects);
    saveProjectToCloud(projectData);
    setSelectedProjectId(projectData.id);
    setCurrentView('project');
  });

  const handleUpdateProjectTeam = withMutation((updatedMemberIds: string[]) => {
    if (!currentProject) return;
    const updatedProject = { ...currentProject, teamMemberIds: updatedMemberIds };
    const nextProjects = projects.map((p) => (p.id === currentProject.id ? updatedProject : p));
    updateProjects(nextProjects);
    saveProjectToCloud(updatedProject);
    showToast('Equipe do projeto atualizada.');
  });

  // --- Handlers: Project Lifecycle (Monday.com: Delete, Archive, Duplicate) ---
  const handleDeleteProject = withMutation((projectId: string) => {
    const projectToDelete = projects.find((p) => p.id === projectId);
    if (!projectToDelete) return;

    const confirmation = window.confirm(
      `ATENÇÃO: Deseja EXCLUIR definitivamente o projeto "${projectToDelete.name}" (${projectToDelete.code})?\n\nTodas as tarefas técnicas vinculadas serão removidas permanentemente. Esta ação não pode ser desfeita.`
    );

    if (confirmation) {
      const nextProjects = projects.filter((p) => p.id !== projectId);
      const nextTasks = tasks.filter((t) => t.projectId !== projectId);
      updateProjects(nextProjects);
      updateTasks(nextTasks);

      // Cloud deletion
      deleteProjectFromCloud(projectId);
      tasks.filter((t) => t.projectId === projectId).forEach((t) => deleteTaskFromCloud(t.id));

      if (selectedProjectId === projectId) {
        setSelectedProjectId(nextProjects[0]?.id || null);
        if (currentView === 'project') {
          setCurrentView('overview');
        }
      }
      showToast(`Projeto "${projectToDelete.name}" excluído definitivamente.`);
    }
  });

  const handleToggleArchiveProject = withMutation((projectId: string, reason?: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const isArchiving = !project.isArchived;
    const updatedProject: Project = {
      ...project,
      isArchived: isArchiving,
      status: isArchiving ? 'arquivado' : 'desenvolvimento',
      archivedAt: isArchiving ? new Date().toISOString() : undefined,
      archivedReason: isArchiving ? (reason || 'Arquivado pelo gestor') : undefined,
    };

    const nextProjects = projects.map((p) => (p.id === projectId ? updatedProject : p));
    updateProjects(nextProjects);
    saveProjectToCloud(updatedProject);

    showToast(
      isArchiving
        ? `Projeto "${project.code}" foi arquivado. Você pode consultá-lo em Relatórios ou reativá-lo a qualquer momento.`
        : `Projeto "${project.code}" foi reativado com sucesso no portfólio!`
    );
  });

  const handleDuplicateProject = withMutation((projectId: string) => {
    const sourceProject = projects.find((p) => p.id === projectId);
    if (!sourceProject) return;

    const newId = `proj-${Date.now()}`;
    const newCode = `${sourceProject.code}-CPY`;
    const duplicatedProject: Project = {
      ...sourceProject,
      id: newId,
      code: newCode,
      name: `${sourceProject.name} (Cópia / Template)`,
      isArchived: false,
      archivedAt: undefined,
      status: 'briefing',
      currentPhase: 'captacao_briefing',
      createdAt: new Date().toISOString(),
    };

    const sourceTasks = tasks.filter((t) => t.projectId === projectId);
    const duplicatedTasks: Task[] = sourceTasks.map((t) => ({
      ...t,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      projectId: newId,
      completed: false,
      status: 'a_fazer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    updateProjects([duplicatedProject, ...projects]);
    updateTasks([...tasks, ...duplicatedTasks]);
    saveProjectToCloud(duplicatedProject);
    duplicatedTasks.forEach((t) => saveTaskToCloud(t));
    setSelectedProjectId(newId);
    setCurrentView('project');
    showToast(`Projeto duplicado com sucesso! ${duplicatedTasks.length} tarefas clonadas como template.`);
  });

  // --- Handlers: Briefing & Esteira ---
  const handleOpenNewBriefing = () => {
    setProjectForBriefing(null);
    setIsBriefingModalOpen(true);
  };

  const handleOpenEditBriefing = (project: Project) => {
    setProjectForBriefing(project);
    setIsBriefingModalOpen(true);
  };

  const handleSaveBriefing = withMutation((savedProject: Project) => {
    const exists = projects.some((p) => p.id === savedProject.id);
    let nextProjects: Project[];
    if (exists) {
      nextProjects = projects.map((p) => (p.id === savedProject.id ? savedProject : p));
      showToast(`Briefing do projeto "${savedProject.code}" atualizado.`);
    } else {
      nextProjects = [savedProject, ...projects];
      showToast(`Demanda "${savedProject.code}" cadastrada na esteira com sucesso!`);
    }
    updateProjects(nextProjects);
    saveProjectToCloud(savedProject);
    setSelectedProjectId(savedProject.id);
  });

  const handleAdvanceToNextPhase = (project: Project) => {
    // Sequência natural da esteira Workplace
    const phaseOrder: ArchitecturePhase[] = [
      'captacao_briefing',
      'criacao_conceitual',
      'criacao_orcamento',
      'criacao_apresentacao',
      'executivo_plantas',
      'executivo_complementares',
      'executivo_aprovacao_condominio',
      'executivo_seguros_documentos',
      'acompanhamento_obra',
    ];

    const currentIdx = phaseOrder.indexOf(project.currentPhase);
    const nextPhase: ArchitecturePhase =
      currentIdx >= 0 && currentIdx < phaseOrder.length - 1
        ? phaseOrder[currentIdx + 1]
        : 'criacao_conceitual';

    handleAdvanceToPhase(project, nextPhase);
  };

  const handleAdvanceToPhase = withMutation((project: Project, targetPhase: ArchitecturePhase) => {
    let pipelineStage: any = project.pipelineStage;
    if (targetPhase === 'criacao_conceitual' || targetPhase === 'criacao_orcamento') {
      pipelineStage = 'criacao_andamento';
    } else if (targetPhase === 'criacao_apresentacao') {
      pipelineStage = 'aguardando_award';
    } else if (targetPhase.startsWith('executivo_')) {
      pipelineStage = 'executivo_pos_award';
    } else if (targetPhase === 'acompanhamento_obra') {
      pipelineStage = 'obra_implantacao';
    }

    const updated: Project = {
      ...project,
      currentPhase: targetPhase,
      status: targetPhase === 'acompanhamento_obra' ? 'obra' : 'desenvolvimento',
      pipelineStage,
    };

    const nextProjects = projects.map((p) => (p.id === project.id ? updated : p));
    updateProjects(nextProjects);
    saveProjectToCloud(updated);

    const phaseNames: Record<string, string> = {
      captacao_briefing: '1. Captação & Encaixe na Esteira',
      criacao_conceitual: '2.1 Criação: Projeto Conceitual',
      criacao_orcamento: '2.2 Criação: Orçamento do Cliente',
      criacao_apresentacao: '2.3 Criação: Apresentação (Conceito + Orçamento)',
      executivo_plantas: '3.1 Executivo: Todas as Plantas',
      executivo_complementares: '3.2 Executivo: Complementares (Engenharias)',
      executivo_aprovacao_condominio: '3.3 Executivo: Aprovação no Condomínio',
      executivo_seguros_documentos: '3.4 Executivo: Seguros & Docs Obrigatórios',
      acompanhamento_obra: '4. Acompanhamento de Obra & Implantação',
    };

    showToast(`Projeto "${project.code}" avançou para: ${phaseNames[targetPhase] || targetPhase}`);
  });

  // --- Handlers: Award do Cliente (Compra do Projeto) ---
  const handleOpenAwardModal = (project: Project) => {
    setProjectForAward(project);
    setIsAwardModalOpen(true);
  };

  const handleAwardProject = withMutation((projectId: string, awardInfo: ProjectAwardInfo) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject) return;

    // 1. Atualizar projeto com Award, valor e avançar para o 2º momento: Projeto Executivo
    const updatedProject: Project = {
      ...targetProject,
      award: awardInfo,
      currentPhase: 'executivo_plantas',
      status: 'desenvolvimento',
      pipelineStage: 'executivo_pos_award',
      estimatedBudgetBRL: awardInfo.awardValueBRL || targetProject.estimatedBudgetBRL,
    };

    const nextProjects = projects.map((p) => (p.id === projectId ? updatedProject : p));
    updateProjects(nextProjects);
    saveProjectToCloud(updatedProject);

    // 2. Garantir que os 4 Pilares do Executivo tenham tarefas estruturadas
    const existingExecutiveTasks = tasks.filter(
      (t) => t.projectId === projectId && t.phase.startsWith('executivo_')
    );

    if (existingExecutiveTasks.length === 0) {
      // Injetar os 4 pilares obrigatórios da Workplace
      const defaultResponsible = targetProject.teamMemberIds[0] || teamMembers[0]?.id || 'team-soli';
      const engResponsible = targetProject.teamMemberIds[1] || defaultResponsible;
      const adminResponsible = targetProject.teamMemberIds[2] || defaultResponsible;

      const todayStr = new Date().toISOString().slice(0, 10);
      const futureDate = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
      };

      const newExecutiveTasks: Task[] = [
        // Pilar 1: Todas as plantas
        {
          id: `task-exec-plantas-${Date.now()}`,
          projectId,
          title: 'Emissão do Caderno Completo de Plantas Arquitetônicas (Demolição, Construção, Piso Elevado, Forro e Marcenaria)',
          description: 'Geração de todas as plantas executivas com cotas finais, paginação de piso, forro acústico, drywall, divisórias de vidro e detalhamento de marcenaria especial.',
          phase: 'executivo_plantas',
          responsibleId: defaultResponsible,
          startDate: todayStr,
          endDate: futureDate(14),
          priority: 'critica',
          status: 'em_andamento',
          completed: false,
          deliverables: 'Caderno Executivo PDF e DWG/IFC com pranchas de demolição, construção e forro',
          checklist: [
            { id: 'chk-1', text: 'Planta de Demolição e Alvenarias a Construir', completed: true },
            { id: 'chk-2', text: 'Planta de Piso Elevado e Paginação de Carpete/Vinílico', completed: false },
            { id: 'chk-3', text: 'Planta de Forro Mineral, Gesso e Luminotécnico', completed: false },
            { id: 'chk-4', text: 'Detalhamento de Marcenaria e Divisórias Acústicas', completed: false }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Pilar 2: Todos os complementares (Elétrica, Hidráulica, Ar-Condicionado, Incêndio)
        {
          id: `task-exec-eletrica-${Date.now()}`,
          projectId,
          title: 'Engenharia Elétrica & Dados: Força, Iluminação Corporativa e Cabeamento Estruturado',
          description: 'Dimensionamento das caixas de piso para postos de trabalho, alimentadores dos quadros de força, automação luminotécnica DALI e cabeamento Cat6A/Fibra.',
          phase: 'executivo_complementares',
          responsibleId: engResponsible,
          startDate: todayStr,
          endDate: futureDate(12),
          priority: 'alta',
          status: 'a_fazer',
          completed: false,
          deliverables: 'Diagrama unifilar, quadro de cargas e locação de caixas de piso',
          checklist: [
            { id: 'chk-e1', text: 'Diagrama unifilar dos QGBTs do pavimento', completed: false },
            { id: 'chk-e2', text: 'Caixas de piso para postos de trabalho e salas de reunião', completed: false },
            { id: 'chk-e3', text: 'Infraestrutura para rack de servidores/TI', completed: false }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `task-exec-ar-${Date.now()}`,
          projectId,
          title: 'Engenharia de Climatização: Ar-Condicionado (Sistema VRF e Renovação de Ar / PMOC)',
          description: 'Cálculo de carga térmica para adensamento corporativo, rede de dutos de insuflamento/retorno, posicionamento de evaporadoras e integração predial.',
          phase: 'executivo_complementares',
          responsibleId: engResponsible,
          startDate: todayStr,
          endDate: futureDate(15),
          priority: 'alta',
          status: 'a_fazer',
          completed: false,
          deliverables: 'Plantas de dutos, difusores lineares e memorial de cálculo térmico',
          checklist: [
            { id: 'chk-ar1', text: 'Cálculo de carga térmica e renovação de ar (ABNT)', completed: false },
            { id: 'chk-ar2', text: 'Locação de difusores compatibilizada com forro acústico', completed: false },
            { id: 'chk-ar3', text: 'Plano de Manutenção PMOC prévio', completed: false }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `task-exec-hidraulica-${Date.now()}`,
          projectId,
          title: 'Engenharia Hidráulica: Pontos de Água, Esgoto e Drenagem de Copa/Sanitários',
          description: 'Pontos de alimentação para cafeteria, filtro de água, copa e modificações em sanitários corporativos conforme normas de acessibilidade NBR 9050.',
          phase: 'executivo_complementares',
          responsibleId: engResponsible,
          startDate: todayStr,
          endDate: futureDate(10),
          priority: 'media',
          status: 'a_fazer',
          completed: false,
          deliverables: 'Plantas de esgoto, água fria e prumadas com registros de gaveta',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `task-exec-incendio-${Date.now()}`,
          projectId,
          title: 'Combate ao Incêndio: Rede de Sprinklers, Detecção Óptica e Adequação AVCB',
          description: 'Ajuste de bicos de sprinklers no entreforro e forro rebaixado, detectores ópticos de fumaça interligados à central do edifício e rotas de fuga.',
          phase: 'executivo_complementares',
          responsibleId: engResponsible,
          startDate: todayStr,
          endDate: futureDate(14),
          priority: 'critica',
          status: 'a_fazer',
          completed: false,
          deliverables: 'Dossiê de compatibilização de sprinklers e rota de fuga para Corpo de Bombeiros',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Pilar 3: Aprovação junto ao Condomínio onde será a Obra
        {
          id: `task-exec-condominio-${Date.now()}`,
          projectId,
          title: 'Aprovação Junto ao Condomínio: Dossiê Técnico, ART/RRT e Engenharia Predial',
          description: 'Submissão formal do projeto à administradora do edifício comercial: cálculo de sobrecarga de laje, plano de resíduos, horários de ruído e liberação de crachás.',
          phase: 'executivo_aprovacao_condominio',
          responsibleId: adminResponsible,
          startDate: todayStr,
          endDate: futureDate(20),
          priority: 'critica',
          status: 'a_fazer',
          completed: false,
          deliverables: 'Carta de aprovação da engenharia predial e alvará interno de obra',
          checklist: [
            { id: 'chk-c1', text: 'Emissão e registro de ART / RRT de projeto e execução', completed: false },
            { id: 'chk-c2', text: 'Laudo de sobrecarga da laje para áreas de arquivo/wellness', completed: false },
            { id: 'chk-c3', text: 'Manual do Edifício assinado pelo cliente e Workplace', completed: false },
            { id: 'chk-c4', text: 'Protocolo formal junto ao síndico e engenharia predial', completed: false }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        // Pilar 4: Seguros e Documentos Obrigatórios do Cliente
        {
          id: `task-exec-seguros-${Date.now()}`,
          projectId,
          title: 'Seguros & Documentos Obrigatórios do Cliente: Risco de Engenharia (RC Obras) e Saúde Ocupacional',
          description: 'Contratação da apólice de Seguro Risco de Engenharia com Responsabilidade Civil Cruzada, homologação de PGR, PCMSO, ASO dos operários e CNDs do cliente.',
          phase: 'executivo_seguros_documentos',
          responsibleId: adminResponsible,
          startDate: todayStr,
          endDate: futureDate(10),
          priority: 'critica',
          status: 'a_fazer',
          completed: false,
          deliverables: 'Apólice de Seguro RC Obras emitida e pasta de documentação de SST homologada',
          checklist: [
            { id: 'chk-s1', text: 'Apólice do Seguro Risco de Engenharia (RC Obras e Danos Morais)', completed: false },
            { id: 'chk-s2', text: 'Coleta de PGR (Programa de Gerenciamento de Riscos) e PCMSO', completed: false },
            { id: 'chk-s3', text: 'Atestados de Saúde Ocupacional (ASO) da equipe de campo', completed: false },
            { id: 'chk-s4', text: 'CNDs fiscais e trabalhistas do cliente e contratadas', completed: false }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      updateTasks([...tasks, ...newExecutiveTasks]);
      newExecutiveTasks.forEach((t) => saveTaskToCloud(t));
    }

    setSelectedProjectId(projectId);
    setCurrentView('project');

    const formattedVal = awardInfo.awardValueBRL
      ? `R$ ${awardInfo.awardValueBRL.toLocaleString('pt-BR')}`
      : 'Valor Confirmado';
    showToast(`🏆 PROJETO COMPRADO! Award de ${formattedVal} registrado com sucesso. Segundo momento da esteira (Projeto Executivo) liberado!`);
  });

  const handleReorderProjects = withMutation((orderedProjects: Project[]) => {
    updateProjects(orderedProjects);
    orderedProjects.forEach((p) => saveProjectToCloud(p));
    showToast('Ordem da esteira atualizada.');
  });

  const handleUpdateProjectSingle = withMutation((updatedProject: Project) => {
    const nextProjects = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
    updateProjects(nextProjects);
    saveProjectToCloud(updatedProject);
    showToast(`Prioridade do projeto "${updatedProject.code}" atualizada.`);
  });

  // --- Handlers: Tasks ---
  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = withMutation((taskData: Task) => {
    const exists = tasks.some((t) => t.id === taskData.id);
    let nextTasks: Task[];
    if (exists) {
      nextTasks = tasks.map((t) => (t.id === taskData.id ? taskData : t));
      showToast(`Tarefa "${taskData.title}" atualizada.`);
    } else {
      nextTasks = [taskData, ...tasks];
      showToast(`Tarefa "${taskData.title}" criada.`);
    }
    updateTasks(nextTasks);
    saveTaskToCloud(taskData);
  });

  const handleDeleteTask = withMutation((taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa técnica?')) {
      const nextTasks = tasks.filter((t) => t.id !== taskId);
      updateTasks(nextTasks);
      deleteTaskFromCloud(taskId);
      showToast('Tarefa excluída.');
    }
  });

  const handleToggleTaskComplete = withMutation((task: Task) => {
    const nextCompleted = !task.completed;
    const nextStatus: TaskStatus = nextCompleted ? 'concluida' : 'em_andamento';

    const updatedTask: Task = {
      ...task,
      completed: nextCompleted,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    const nextTasks = tasks.map((t) => (t.id === task.id ? updatedTask : t));
    updateTasks(nextTasks);
    saveTaskToCloud(updatedTask);
    showToast(nextCompleted ? `Tarefa "${task.title}" marcada como Concluída!` : `Tarefa marcada como Pendente.`);
  });

  const handleUpdateTaskStatus = withMutation((task: Task, newStatus: TaskStatus) => {
    const nextCompleted = newStatus === 'concluida';
    const updatedTask: Task = {
      ...task,
      status: newStatus,
      completed: nextCompleted,
      updatedAt: new Date().toISOString(),
    };
    const nextTasks = tasks.map((t) => (t.id === task.id ? updatedTask : t));
    updateTasks(nextTasks);
    saveTaskToCloud(updatedTask);
  });

  const handleUpdateTaskDates = withMutation((taskId: string, newStartDate: string, newEndDate: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updatedTask: Task = {
      ...task,
      startDate: newStartDate,
      endDate: newEndDate,
      updatedAt: new Date().toISOString(),
    };
    const nextTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    updateTasks(nextTasks);
    saveTaskToCloud(updatedTask);
    showToast(`Cronograma atualizado: "${task.title.slice(0, 28)}..." (${newStartDate} → ${newEndDate})`);
  });

  // --- Handlers: Team ---
  const handleOpenNewTeamMember = () => {
    setMemberToEdit(null);
    setIsTeamModalOpen(true);
  };

  const handleEditTeamMember = (member: TeamMember) => {
    setMemberToEdit(member);
    setIsTeamModalOpen(true);
  };

  const handleSaveTeamMember = withMutation((memberData: TeamMember) => {
    const exists = teamMembers.some((m) => m.id === memberData.id);
    let nextTeam: TeamMember[];
    if (exists) {
      nextTeam = teamMembers.map((m) => (m.id === memberData.id ? memberData : m));
      showToast(`Dados de ${memberData.name} atualizados.`);
    } else {
      nextTeam = [...teamMembers, memberData];
      showToast(`${memberData.name} adicionado(a) à equipe.`);
    }
    updateTeam(nextTeam);
    saveTeamMemberToCloud(memberData);
  });

  // --- Handlers: Reset & Export ---
  const handleExportData = () => {
    downloadJsonFile(createBackupPayload(projects,tasks,teamMembers,currentUser?.name), 'workplace_backup_'+new Date().toISOString().slice(0,10)+'.json');
    showToast('Backup exportado.');
  };

  // --- Handlers: Central de Backup & Restauração ---
  const handleCreateBackup = async (name: string, description?: string) => {
    const payload = createBackupPayload(projects, tasks, teamMembers, currentUser?.name);
    const snapshot: BackupSnapshot = {
      id: `bkp-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.email || 'admin@workplace.arq.br',
      createdByName: currentUser?.name || 'Administrador Workplace',
      projectCount: projects.length,
      taskCount: tasks.length,
      teamCount: teamMembers.length,
      sizeBytes: JSON.stringify(payload).length,
      payload,
    };

    if(!isCloudConnected) throw new Error('Conecte ao servidor antes de salvar um backup na nuvem.');
    await saveBackupToCloud(snapshot);
    const updated=[snapshot,...cloudBackups.filter(b=>b.id!==snapshot.id)];
    setCloudBackups(updated);saveStoredBackups(updated);
    showToast(`Ponto de restauração "${name}" salvo com sucesso!`);
  };

  const handleRestoreBackup = async (payload: BackupPayload, snapshotName: string) => {
    const validated=validateBackupPayload(payload);
    if(!validated.valid || !validated.payload) throw new Error(validated.error);
    if(!currentUser?.isDirector) throw new Error('A restauração exige uma conta de administração.');
    if(!isCloudConnected) throw new Error('Conecte ao servidor antes de restaurar.');
    await restoreDataInCloudBatch(validated.payload);
    const {projects:cleanProjects,tasks:cleanTasks,team:cleanTeam}=validated.payload;
    setProjects(cleanProjects);setTasks(cleanTasks);setTeamMembers(cleanTeam);
    saveStoredProjects(cleanProjects);saveStoredTasks(cleanTasks);saveStoredTeam(cleanTeam);
    if (cleanProjects.length > 0) {
      setSelectedProjectId(cleanProjects[0].id);
    }

    showToast(`Dados restaurados com sucesso a partir de "${snapshotName}"!`);
  };

  const handleDeleteBackup = async (backupId: string) => {
    if(!isCloudConnected) throw new Error('Conecte ao servidor antes de excluir um backup.');
    await deleteBackupFromCloud(backupId);
    const updated=cloudBackups.filter(b=>b.id!==backupId);
    setCloudBackups(updated);saveStoredBackups(updated);
    showToast('Ponto de restauração removido.');
  };

  // Navigation helper
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project');
  };

  // Current project team
  const currentProjectTeam = currentProject
    ? teamMembers.filter((m) => currentProject.teamMemberIds.includes(m.id))
    : [];

  if(!currentUser) return <MicrosoftLoginModal isOpen={true} onClose={()=>{}} currentUser={null} onLogin={handleLogin} onLogout={handleLogout} error={authError}/>;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900">
      
      {/* Top Bar Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleOpenNewProject}
        onExportData={handleExportData}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        teamCount={teamMembers.length}
        cloudConnected={isCloudConnected}
        backupCount={cloudBackups.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: STUDIO OVERVIEW */}
        {currentView === 'overview' && (
          <DashboardOverview
            projects={projects}
            tasks={tasks}
            teamMembers={teamMembers}
            stats={stats}
            onSelectProject={handleSelectProject}
            onNewProject={handleOpenNewProject}
            onNewTeamMember={handleOpenNewTeamMember}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onNavigateToMyTasks={() => setCurrentView('my_tasks')}
            onNavigateToEsteira={() => setCurrentView('esteira')}
            onNewBriefing={handleOpenNewBriefing}
            onDeleteProject={handleDeleteProject}
            onToggleArchiveProject={handleToggleArchiveProject}
            onDuplicateProject={handleDuplicateProject}
            onExportProjectCsv={(proj) => exportProjectToCsv(proj, tasks, teamMembers)}
            onExportAllCsv={() => exportAllProjectsToCsv(projects, tasks)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}

        {/* VIEW 2: ESTEIRA PIPELINE & BRIEFINGS */}
        {currentView === 'esteira' && (
          <EsteiraPipelineView
            projects={projects}
            allTeamMembers={teamMembers}
            onSelectProject={handleSelectProject}
            onNewBriefing={handleOpenNewBriefing}
            onEditBriefing={handleOpenEditBriefing}
            onUpdateProject={handleUpdateProjectSingle}
            onReorderProjects={handleReorderProjects}
            onOpenAwardModal={handleOpenAwardModal}
          />
        )}

        {/* VIEW 3: MY TASKS (Microsoft User specific) */}
        {currentView === 'my_tasks' && currentUser && (
          <MyTasksView
            currentUser={currentUser}
            projects={projects}
            tasks={tasks}
            teamMembers={teamMembers}
            onToggleTaskComplete={handleToggleTaskComplete}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSelectProject={handleSelectProject}
            onEditTask={handleEditTask}
          />
        )}

        {/* VIEW 4: PROJECT DETAIL */}
        {currentView === 'project' && currentProject && (
          <ProjectDetail
            project={currentProject}
            tasks={tasks}
            allTeamMembers={teamMembers}
            onAddTask={handleOpenNewTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskComplete={handleToggleTaskComplete}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onEditProject={() => handleEditProject(currentProject)}
            onUpdateProjectTeam={handleUpdateProjectTeam}
            onEditBriefing={handleOpenEditBriefing}
            onAdvanceToNextPhase={handleAdvanceToNextPhase}
            onAdvanceToPhase={handleAdvanceToPhase}
            onOpenAwardModal={handleOpenAwardModal}
            onDeleteProject={handleDeleteProject}
            onToggleArchiveProject={handleToggleArchiveProject}
            onDuplicateProject={handleDuplicateProject}
            onExportProjectCsv={(proj) => exportProjectToCsv(proj, tasks, teamMembers)}
            onExportProjectJson={(proj) => exportProjectToJson(proj, tasks)}
            onUpdateTaskDates={handleUpdateTaskDates}
          />
        )}

        {/* VIEW 5: INTEGRATED TIMELINE */}
        {currentView === 'timeline' && (
          <OverallTimeline
            projects={projects}
            tasks={tasks}
            teamMembers={teamMembers}
            onEditTask={handleEditTask}
            onSelectProject={handleSelectProject}
            onUpdateTaskDates={handleUpdateTaskDates}
          />
        )}

        {/* VIEW 6: TEAM DIRECTORY */}
        {currentView === 'team' && (
          <TeamDirectory
            teamMembers={teamMembers}
            projects={projects}
            tasks={tasks}
            onNewMember={handleOpenNewTeamMember}
            onEditMember={handleEditTeamMember}
            onSelectProject={handleSelectProject}
          />
        )}

        {/* VIEW 7: REPORTS & ANALYTICS (Monday.com style) */}
        {currentView === 'reports' && (
          <ReportsAnalyticsView
            projects={projects}
            tasks={tasks}
            teamMembers={teamMembers}
            stats={stats}
            onSelectProject={handleSelectProject}
          />
        )}

      </main>

      {/* Official Footer with Workplace Brand & Creator Credits */}
      <footer className="mt-auto border-t border-neutral-200 bg-stone-950 text-stone-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="py-1 px-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shadow-inner">
              <WorkplaceLogo variant="horizontal" theme="dark" height={38} />
            </div>
            <div className="hidden sm:block border-l border-stone-800 pl-4">
              <div className="text-xs font-bold text-white tracking-wide">
                Workplace Arquitetura Corporativa
              </div>
              <div className="text-[11px] text-stone-400">
                Sistema Proprietário de Gestão de Projetos, Esteira Técnica & Cronogramas
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-right">
            <div className="px-4 py-2 rounded-xl bg-stone-900 border border-amber-500/40 flex items-center gap-2.5 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left leading-tight">
                <span className="text-xs font-bold text-white block">
                  Criado & Desenvolvido por <strong className="text-amber-400 font-black">Solimar Isaac (Soli)</strong>
                </span>
                <span className="text-[10px] text-stone-400">
                  CSO · Co-fundadora & Idealizadora da Plataforma
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono">
              <span>Workplace v5.0</span>
              <span>·</span>
              <span>{teamMembers.length} Profissionais</span>
            </div>
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* Microsoft SSO Login Modal */}
      <MicrosoftLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        error={authError}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Briefing Intake Modal */}
      <BriefingModal
        isOpen={isBriefingModalOpen}
        onClose={() => setIsBriefingModalOpen(false)}
        onSave={handleSaveBriefing}
        projectToEdit={projectForBriefing}
        allTeamMembers={teamMembers}
        currentUser={currentUser}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
        allTeamMembers={teamMembers}
      />

      {/* Task Modal */}
      {currentProject && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          taskToEdit={taskToEdit}
          projectId={currentProject.id}
          projectTeam={currentProjectTeam}
          allTeamMembers={teamMembers}
        />
      )}

      {/* Team Member Modal */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSave={handleSaveTeamMember}
        memberToEdit={memberToEdit}
      />

      {/* Award Modal (Decisão de Compra do Cliente) */}
      {projectForAward && (
        <AwardModal
          isOpen={isAwardModalOpen}
          onClose={() => {
            setIsAwardModalOpen(false);
            setProjectForAward(null);
          }}
          project={projectForAward}
          onConfirmAward={handleAwardProject}
        />
      )}

      {/* Central de Backup & Restauração Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        projects={projects}
        tasks={tasks}
        teamMembers={teamMembers}
        currentUser={currentUser}
        cloudBackups={cloudBackups}
        isCloudConnected={isCloudConnected}
        onCreateBackup={handleCreateBackup}
        onRestoreBackup={handleRestoreBackup}
        onDeleteBackup={handleDeleteBackup}
      />

      {syncError && <div role="alert" className="fixed bottom-20 left-4 right-4 z-40 bg-rose-50 border border-rose-200 p-3 rounded text-rose-800 text-sm">{syncError}</div>}
      {isSaving && <div role="status" className="fixed inset-0 z-[100] bg-white/70 flex items-center justify-center">Salvando alterações…</div>}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
