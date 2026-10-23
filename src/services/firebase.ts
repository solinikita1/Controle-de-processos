import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { Project, Task, TeamMember, BackupSnapshot, BackupPayload } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID if provisioned
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test per skill directive
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    // "client is offline" or "not-found" is normal for non-existent test document
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore está offline ou sem conexão.');
      return false;
    }
    return true;
  }
}

// Collections references
const PROJECTS_COLLECTION = 'projects';
const TASKS_COLLECTION = 'tasks';
const TEAM_COLLECTION = 'teamMembers';
const BACKUPS_COLLECTION = 'backups';

// Helper to guarantee unique documents by id
function deduplicate<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

// --- Realtime Subscriptions ---

export function subscribeToProjects(callback: (projects: Project[]) => void): Unsubscribe {
  const colRef = collection(db, PROJECTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const proj = { ...data, id: (data.id || docSnap.id)?.trim() } as Project;
        proj.teamMemberIds = Array.from(new Set((proj.teamMemberIds || []).map((id) => id?.trim()))).filter(Boolean);
        items.push(proj);
      });
      callback(deduplicate(items));
    },
    (error) => {
      console.warn('Sincronização de projetos do Firestore:', error.message);
    }
  );
}

export function subscribeToTasks(callback: (tasks: Task[]) => void): Unsubscribe {
  const colRef = collection(db, TASKS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Task[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({ ...data, id: (data.id || docSnap.id)?.trim() } as Task);
      });
      callback(deduplicate(items));
    },
    (error) => {
      console.warn('Sincronização de tarefas do Firestore:', error.message);
    }
  );
}

export function subscribeToTeam(callback: (team: TeamMember[]) => void): Unsubscribe {
  const colRef = collection(db, TEAM_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: TeamMember[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const member = { ...data, id: (data.id || docSnap.id)?.trim() } as any;
        delete member.cau;
        items.push(member as TeamMember);
      });
      callback(deduplicate(items));
    },
    (error) => {
      console.warn('Sincronização da equipe do Firestore:', error.message);
    }
  );
}

export function subscribeToBackups(callback: (backups: BackupSnapshot[]) => void): Unsubscribe {
  const colRef = collection(db, BACKUPS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: BackupSnapshot[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({ ...data, id: (data.id || docSnap.id)?.trim() } as BackupSnapshot);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(deduplicate(items));
    },
    (error) => {
      console.warn('Sincronização de backups do Firestore:', error.message);
    }
  );
}

// --- Mutations ---

export async function saveProjectToCloud(project: Project): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, project.id);
  // Clean undefined fields for Firestore compatibility
  const cleanData = JSON.parse(JSON.stringify(project));
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteProjectFromCloud(projectId: string): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(docRef);
}

export async function saveTaskToCloud(task: Task): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, task.id);
  const cleanData = JSON.parse(JSON.stringify(task));
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteTaskFromCloud(taskId: string): Promise<void> {
  const docRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(docRef);
}

export async function saveTeamMemberToCloud(member: TeamMember): Promise<void> {
  const docRef = doc(db, TEAM_COLLECTION, member.id);
  const cleanData = JSON.parse(JSON.stringify(member));
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteTeamMemberFromCloud(memberId: string): Promise<void> {
  const docRef = doc(db, TEAM_COLLECTION, memberId);
  await deleteDoc(docRef);
}

export async function saveBackupToCloud(backup: BackupSnapshot): Promise<void> {
  const docRef = doc(db, BACKUPS_COLLECTION, backup.id);
  const cleanData = JSON.parse(JSON.stringify(backup));
  await setDoc(docRef, cleanData, { merge: true });
}

export async function deleteBackupFromCloud(backupId: string): Promise<void> {
  const docRef = doc(db, BACKUPS_COLLECTION, backupId);
  await deleteDoc(docRef);
}

export async function restoreDataInCloudBatch(payload: BackupPayload): Promise<void> {
  const cleanProjects = deduplicate(payload.projects);
  const cleanTasks = deduplicate(payload.tasks);
  const cleanTeam = deduplicate(payload.team);

  const batch = writeBatch(db);

  cleanProjects.forEach((proj) => {
    const ref = doc(db, PROJECTS_COLLECTION, proj.id);
    batch.set(ref, JSON.parse(JSON.stringify(proj)));
  });

  cleanTasks.forEach((task) => {
    const ref = doc(db, TASKS_COLLECTION, task.id);
    batch.set(ref, JSON.parse(JSON.stringify(task)));
  });

  cleanTeam.forEach((member) => {
    const ref = doc(db, TEAM_COLLECTION, member.id);
    batch.set(ref, JSON.parse(JSON.stringify(member)));
  });

  await batch.commit();
}

// --- Batch / Seed Initial Data ---

export async function seedInitialFirestoreData(
  defaultProjects: Project[],
  defaultTasks: Task[],
  defaultTeam: TeamMember[],
  defaultBackup?: BackupSnapshot
): Promise<{ seeded: boolean; projectCount: number }> {
  try {
    const existingSnap = await getDocs(collection(db, PROJECTS_COLLECTION));
    if (!existingSnap.empty) {
      // Check if backup collection is empty and seed default backup if so
      if (defaultBackup) {
        const backupsSnap = await getDocs(collection(db, BACKUPS_COLLECTION));
        if (backupsSnap.empty) {
          await setDoc(doc(db, BACKUPS_COLLECTION, defaultBackup.id), JSON.parse(JSON.stringify(defaultBackup)));
        }
      }
      return { seeded: false, projectCount: existingSnap.size };
    }

    const cleanProjects = deduplicate(defaultProjects);
    const cleanTasks = deduplicate(defaultTasks);
    const cleanTeam = deduplicate(defaultTeam);

    const batch = writeBatch(db);

    cleanProjects.forEach((proj) => {
      const ref = doc(db, PROJECTS_COLLECTION, proj.id);
      batch.set(ref, JSON.parse(JSON.stringify(proj)));
    });

    cleanTasks.forEach((task) => {
      const ref = doc(db, TASKS_COLLECTION, task.id);
      batch.set(ref, JSON.parse(JSON.stringify(task)));
    });

    cleanTeam.forEach((member) => {
      const ref = doc(db, TEAM_COLLECTION, member.id);
      batch.set(ref, JSON.parse(JSON.stringify(member)));
    });

    if (defaultBackup) {
      const ref = doc(db, BACKUPS_COLLECTION, defaultBackup.id);
      batch.set(ref, JSON.parse(JSON.stringify(defaultBackup)));
    }

    await batch.commit();
    return { seeded: true, projectCount: cleanProjects.length };
  } catch (error) {
    console.warn('Falha ao inicializar dados no Firestore:', error);
    return { seeded: false, projectCount: 0 };
  }
}
