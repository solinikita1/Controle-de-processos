import type { BackupPayload } from "../types";
export type DataCollection = "projects" | "tasks" | "teamMembers" | "backups";
export interface CloudChange {
  collection: DataCollection;
  id: string;
  data?: unknown;
}

export function planReplacement(
  payload: BackupPayload,
  existing: Record<"projects" | "tasks" | "teamMembers", string[]>,
): CloudChange[] {
  const changes: CloudChange[] = [];
  for (const [collection, items] of [
    ["projects", payload.projects],
    ["tasks", payload.tasks],
    ["teamMembers", payload.team],
  ] as const) {
    const ids = new Set(items.map((item) => item.id));
    for (const id of existing[collection])
      if (!ids.has(id)) changes.push({ collection, id });
    for (const item of items)
      changes.push({ collection, id: item.id, data: item });
  }
  if (changes.length > 448)
    throw new Error(
      "Este backup excede o limite da restauração atômica (448 alterações). Solicite uma migração assistida. Nenhum dado foi alterado.",
    );
  return changes;
}
