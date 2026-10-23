import { Project, Task, TeamMember, StudioStats, AuthUser, BackupSnapshot, BackupPayload } from '../types';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_TEAM_MEMBERS } from '../data/mockData';
import { checkDateStatus } from './dateUtils';
export { validateBackupPayload } from './backupValidation';

const STORAGE_KEYS = {
  PROJECTS: 'workplace_projects_v5',
  TASKS: 'workplace_tasks_v5',
  TEAM: 'workplace_team_v5',
  AUTH: 'workplace_auth_user_v5',
  BACKUPS: 'workplace_backups_v5',
};

// A cached profile is never proof of authentication. Firebase owns the session.
export function loadStoredAuthUser(): AuthUser | null { return null; }

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
    if (item && typeof item.id === 'string' && item.id.trim()) {
      map.set(item.id.trim(), { ...item, id: item.id.trim() });
    }
  }
  return Array.from(map.values());
}

export function loadStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return deduplicateById(parsed).map((p) => ({
          ...p,
          teamMemberIds: Array.from(new Set((p.teamMemberIds || []).map((id: string) => id?.trim()))).filter(Boolean),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to parse stored projects:', e);
  }
  return [];
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
      if (Array.isArray(parsed)) {
        return deduplicateById(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to parse stored tasks:', e);
  }
  return [];
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
      if (Array.isArray(parsed)) {
        return deduplicateById(parsed).map(({ cau, ...rest }: any) => rest as TeamMember);
      }
    }
  } catch (e) {
    console.error('Failed to parse stored team:', e);
  }
  return [];
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
      if (Array.isArray(parsed)) {
        return deduplicateById(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to parse stored backups:', e);
  }
  return [];
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

