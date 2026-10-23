import {
  collection,
  doc,
  onSnapshot,
  getDocsFromServer,
  getDocFromServer,
  runTransaction,
  serverTimestamp,
  type Transaction,
} from "firebase/firestore";
import type {
  Project,
  Task,
  TeamMember,
  BackupSnapshot,
  BackupPayload,
} from "../types";
import { auth, db } from "./firebaseClient";
import {
  validateBackupPayload,
  projectSchema,
  taskSchema,
  teamSchema,
} from "../utils/backupValidation";
import {
  planReplacement,
  type CloudChange,
  type DataCollection,
} from "../utils/restorePlan";
export { db } from "./firebaseClient";

const revisionRef = doc(db, "system", "revision");
const clean = (value: unknown) => JSON.parse(JSON.stringify(value));
const assertSession = () => {
  if (!auth.currentUser)
    throw new Error("Entre com sua conta antes de acessar os dados.");
};

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    assertSession();
    await getDocFromServer(revisionRef);
    return true;
  } catch {
    return false;
  }
}

function subscribe<T extends { id: string }>(
  name: DataCollection,
  callback: (items: T[]) => void,
  onError: (error: Error) => void,
) {
  assertSession();
  return onSnapshot(
    collection(db, name),
    { includeMetadataChanges: true },
    (snapshot) => {
      // Cached/partial snapshots must not replace the last confirmed server state.
      if (snapshot.metadata.fromCache) {
        onError(new Error("Aguardando confirmação do servidor."));
        return;
      }
      if (snapshot.metadata.hasPendingWrites) return;
      callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as T));
    },
    onError,
  );
}
export const subscribeToProjects = (
  cb: (items: Project[]) => void,
  error: (e: Error) => void,
) => subscribe("projects", cb, error);
export const subscribeToTasks = (
  cb: (items: Task[]) => void,
  error: (e: Error) => void,
) => subscribe("tasks", cb, error);
export const subscribeToTeam = (
  cb: (items: TeamMember[]) => void,
  error: (e: Error) => void,
) => subscribe("teamMembers", cb, error);
export const subscribeToBackups = (
  cb: (items: BackupSnapshot[]) => void,
  error: (e: Error) => void,
) =>
  subscribe<BackupSnapshot>(
    "backups",
    (items) => cb(items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    error,
  );

function validateChange(change: CloudChange) {
  if (!change.id || change.id.length > 128 || change.id.includes("/"))
    throw new Error("Identificador inválido.");
  if (change.data === undefined) return;
  const schema =
    change.collection === "projects"
      ? projectSchema
      : change.collection === "tasks"
        ? taskSchema
        : change.collection === "teamMembers"
          ? teamSchema
          : null;
  if (schema) schema.parse(change.data);
  if ((change.data as { id?: unknown }).id !== change.id)
    throw new Error("ID do registro inconsistente.");
  if (new TextEncoder().encode(JSON.stringify(change.data)).length > 900_000)
    throw new Error("Registro excede o limite seguro de tamanho (900 kB).");
}
function apply(tx: Transaction, changes: CloudChange[], revision: number) {
  const unique = new Map(changes.map((c) => [c.collection + "/" + c.id, c]));
  if (unique.size > 449)
    throw new Error("Operação excede 449 registros. Nenhum dado foi alterado.");
  for (const change of unique.values()) {
    validateChange(change);
    const ref = doc(db, change.collection, change.id);
    if (change.data === undefined) tx.delete(ref);
    else tx.set(ref, clean(change.data));
  }
  tx.set(revisionRef, {
    value: revision + 1,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser!.uid,
  });
}

// Every write advances the same revision. A restore cannot commit over concurrent edits.
export async function commitCloudChanges(
  changes: CloudChange[],
): Promise<void> {
  if (!changes.length) return;
  assertSession();
  await runTransaction(db, async (tx) => {
    const revision = await tx.get(revisionRef);
    apply(tx, changes, revision.data()?.value ?? 0);
  });
}
export const saveBackupToCloud = (backup: BackupSnapshot) =>
  commitCloudChanges([{ collection: "backups", id: backup.id, data: backup }]);
export const deleteBackupFromCloud = (id: string) =>
  commitCloudChanges([{ collection: "backups", id }]);

export async function restoreDataInCloudBatch(
  raw: BackupPayload,
): Promise<void> {
  assertSession();
  const checked = validateBackupPayload(raw);
  if (!checked.valid || !checked.payload) throw new Error(checked.error);
  const payload = checked.payload;
  const backupId = "pre-restore-" + crypto.randomUUID();
  const startingRevision =
    (await getDocFromServer(revisionRef)).data()?.value ?? 0;
  await runTransaction(db, async (tx) => {
    const revision = await tx.get(revisionRef);
    if ((revision.data()?.value ?? 0) !== startingRevision)
      throw new Error(
        "Os dados mudaram durante a restauração. Confira as alterações e tente novamente.",
      );
    const [projects, tasks, team] = await Promise.all([
      getDocsFromServer(collection(db, "projects")),
      getDocsFromServer(collection(db, "tasks")),
      getDocsFromServer(collection(db, "teamMembers")),
    ]);
    const changes = planReplacement(payload, {
      projects: projects.docs.map((d) => d.id),
      tasks: tasks.docs.map((d) => d.id),
      teamMembers: team.docs.map((d) => d.id),
    });
    const now = new Date().toISOString();
    const previous = {
      version: "5.0.0",
      systemName: "Workplace Arquitetura Corporativa",
      exportedAt: now,
      projects: projects.docs.map((d) => ({ ...d.data(), id: d.id })),
      tasks: tasks.docs.map((d) => ({ ...d.data(), id: d.id })),
      team: team.docs.map((d) => ({ ...d.data(), id: d.id })),
    };
    const backup = {
      id: backupId,
      name: "Antes da restauração",
      createdAt: now,
      createdBy: auth.currentUser!.uid,
      createdByName: "Backup automático",
      projectCount: projects.size,
      taskCount: tasks.size,
      teamCount: team.size,
      sizeBytes: new TextEncoder().encode(JSON.stringify(previous)).length,
      payload: previous,
    };
    changes.push({ collection: "backups", id: backupId, data: backup });
    apply(tx, changes, revision.data()?.value ?? 0);
  });
}
