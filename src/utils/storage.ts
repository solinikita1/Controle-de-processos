import { Project, Task, TeamMember, StudioStats, AuthUser, BackupSnapshot, BackupPayload } from '../types';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_TEAM_MEMBERS } from '../data/mockData';
import { checkDateStatus } from './dateUtils';

const STORAGE_KEYS = {
  PROJECTS: 'workplace_projects_v5',
  TASKS: 'workplace_tasks_v5',
  TEAM: 'workplace_team_v5',
  AUTH: 'workplace_auth_user_v5',
  BACKUPS: 'workplace_backups_v5',
};

// Default authenticated user (Soli, CSO)
export const DEFAULT_AUTH_USER: AuthUser = {
  id: 'team-soli',
  name: 'Solimar Isaac (Soli)',
  email: 'solimar.isaac@gmail.com',
  role: 'CSO · Criadora & Desenvolvedora do Produto',
  initials: 'SI',
  avatarColor: 'bg-amber-600 text-white',
  department: 'Diretoria',
  isDirector: true
};

export function loadStoredAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.id === 'team-soli') {
          return DEFAULT_AUTH_USER;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse auth user:', e);
  }
  // Default to Solimar Isaac (CSO · Criadora)
  return DEFAULT_AUTH_USER;
}

export function saveStoredAuthUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  } catch (e) {
    console.error('Failed to save auth user:', e);
  }
}

export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item && item.id) {
      map.set(item.id.trim(), item);
    }
  }
  return Array.from(map.values());
}

export function loadStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(p => p.priority)) {
        return deduplicateById(parsed).map((p) => ({
          ...p,
          teamMemberIds: Array.from(new Set((p.teamMemberIds || []).map((id: string) => id?.trim()))).filter(Boolean),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to parse stored projects:', e);
  }
  return deduplicateById(INITIAL_PROJECTS).map((p) => ({
    ...p,
    teamMemberIds: Array.from(new Set((p.teamMemberIds || []).map((id: string) => id?.trim()))).filter(Boolean),
  }));
}

export function saveStoredProjects(projects: Project[]): void {
  try {
    const clean = deduplicateById(projects).map((p) => ({
      ...p,
      teamMemberIds: Array.from(new Set((p.teamMemberIds || []).map((id: string) => id?.trim()))).filter(Boolean),
    }));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(clean));
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
}

export function loadStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(t => t.id === 'task-501')) {
        return deduplicateById(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to parse stored tasks:', e);
  }
  return deduplicateById(INITIAL_TASKS);
}

export function saveStoredTasks(tasks: Task[]): void {
  try {
    const clean = deduplicateById(tasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(clean));
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
}

export function loadStoredTeam(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure we have the Workplace team members with updated roles (e.g. CSO / CEO / Comercial) and without Bruno/TI
      if (
        Array.isArray(parsed) &&
        parsed.length >= 15 &&
        parsed.some(m => m.role === 'CSO' || m.role === 'CEO') &&
        parsed.some(m => m.name.includes('Fernanda') && m.role === 'Comercial') &&
        !parsed.some(m => m.id === 'team-bruno' || m.id === 'team-ti')
      ) {
        return deduplicateById(parsed).map(({ cau, ...rest }: any) => rest as TeamMember);
      }
    }
  } catch (e) {
    console.error('Failed to parse stored team:', e);
  }
  return deduplicateById(INITIAL_TEAM_MEMBERS);
}

export function saveStoredTeam(team: TeamMember[]): void {
  try {
    const clean = deduplicateById(team).map(({ cau, ...rest }: any) => rest as TeamMember);
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(clean));
  } catch (e) {
    console.error('Failed to save team:', e);
  }
}

export function resetAllData(): { projects: Project[]; tasks: Task[]; team: TeamMember[] } {
  localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.TEAM);
  return {
    projects: INITIAL_PROJECTS,
    tasks: INITIAL_TASKS,
    team: INITIAL_TEAM_MEMBERS,
  };
}

export function computeStudioStats(projects: Project[], tasks: Task[]): StudioStats {
  const activeProjects = projects.filter(p => p.status !== 'entregue').length;
  const totalAreaM2 = projects.reduce((acc, p) => acc + (p.areaM2 || 0), 0);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed || t.status === 'concluida').length;
  const pendingTasks = totalTasks - completedTasks;
  
  const overdueTasks = tasks.filter(t => {
    if (t.completed || t.status === 'concluida') return false;
    const status = checkDateStatus(t.endDate, false);
    return status.isOverdue;
  }).length;

  const criticalTasks = tasks.filter(t => 
    !t.completed && t.status !== 'concluida' && (t.priority === 'critica' || t.priority === 'alta')
  ).length;

  return {
    totalProjects: projects.length,
    activeProjects,
    totalAreaM2,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    criticalTasks,
  };
}

export function getBaselineBackupSnapshot(): BackupSnapshot {
  const initialProjects = deduplicateById(INITIAL_PROJECTS).map((p) => ({
    ...p,
    teamMemberIds: Array.from(new Set((p.teamMemberIds || []).map((id: string) => id?.trim()))).filter(Boolean),
  }));
  const initialTasks = deduplicateById(INITIAL_TASKS);
  const initialTeam = deduplicateById(INITIAL_TEAM_MEMBERS);
  const payload = createBackupPayload(initialProjects, initialTasks, initialTeam, 'Workplace Sistema');

  return {
    id: 'bkp-sistema-base-v5',
    name: 'Ponto de Restauração Base do Sistema (Workplace Arquitetura)',
    description: 'Ponto de segurança inicial corporativo com todos os projetos da esteira (Omni Pinheiros, Nexus Faria Lima), tarefas técnicas e equipe completa.',
    createdAt: new Date().toISOString(),
    createdBy: 'sistema@workplace.arq.br',
    createdByName: 'Workplace Sistema (Automático)',
    projectCount: initialProjects.length,
    taskCount: initialTasks.length,
    teamCount: initialTeam.length,
    sizeBytes: JSON.stringify(payload).length,
    payload,
  };
}

export function loadStoredBackups(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BACKUPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateById(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to parse stored backups:', e);
  }
  const baseline = getBaselineBackupSnapshot();
  saveStoredBackups([baseline]);
  return [baseline];
}

export function saveStoredBackups(backups: BackupSnapshot[]): void {
  try {
    const clean = deduplicateById(backups);
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(clean));
  } catch (e) {
    console.error('Failed to save backups:', e);
  }
}

export function createBackupPayload(
  projects: Project[],
  tasks: Task[],
  team: TeamMember[],
  authorName?: string
): BackupPayload {
  return {
    version: '5.0.0',
    systemName: 'Workplace Arquitetura Corporativa',
    exportedAt: new Date().toISOString(),
    exportedBy: authorName || 'Administrador',
    projects: deduplicateById(projects).map((p) => ({
      ...p,
      teamMemberIds: Array.from(new Set((p.teamMemberIds || []).map((id: string) => id?.trim()))).filter(Boolean),
    })),
    tasks: deduplicateById(tasks),
    team: deduplicateById(team),
  };
}

export function downloadJsonFile(data: unknown, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackupPayload(parsed: any): { valid: boolean; payload?: BackupPayload; error?: string } {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'O arquivo não contém um objeto JSON válido.' };
  }

  if (!Array.isArray(parsed.projects)) {
    return { valid: false, error: 'Estrutura inválida: lista de projetos ausente ou corrompida.' };
  }

  if (!Array.isArray(parsed.tasks)) {
    return { valid: false, error: 'Estrutura inválida: lista de tarefas ausente ou corrompida.' };
  }

  if (!Array.isArray(parsed.team)) {
    return { valid: false, error: 'Estrutura inválida: lista de equipe ausente ou corrompida.' };
  }

  const cleanProjects = deduplicateById(parsed.projects).map((p: any) => ({
    ...p,
    teamMemberIds: Array.from(new Set((p.teamMemberIds || []).map((id: any) => String(id)?.trim()))).filter(Boolean),
  }));

  const cleanTasks = deduplicateById(parsed.tasks);
  const cleanTeam = deduplicateById(parsed.team);

  const payload: BackupPayload = {
    version: parsed.version || '5.0.0',
    systemName: parsed.systemName || 'Workplace Arquitetura Corporativa',
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    exportedBy: parsed.exportedBy || 'Importação Manual',
    projects: cleanProjects as Project[],
    tasks: cleanTasks as Task[],
    team: cleanTeam as TeamMember[],
  };

  return { valid: true, payload };
}

