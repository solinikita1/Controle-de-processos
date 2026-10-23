import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as storage from "../src/utils/storage";
import { validateDateRange } from "../src/utils/dateUtils";
import {
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_TEAM_MEMBERS,
} from "../src/data/mockData";
import { planReplacement } from "../src/utils/restorePlan";
const cache = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (k: string) => cache.get(k) ?? null,
    setItem: (k: string, v: string) => cache.set(k, v),
    removeItem: (k: string) => cache.delete(k),
  },
});
beforeEach(() => cache.clear());
const payload = () =>
  storage.createBackupPayload(
    INITIAL_PROJECTS,
    INITIAL_TASKS,
    INITIAL_TEAM_MEMBERS,
  );
test("empty projects, tasks, team and backups remain empty", () => {
  storage.saveStoredProjects([]);
  storage.saveStoredTasks([]);
  storage.saveStoredTeam([]);
  storage.saveStoredBackups([]);
  assert.deepEqual(
    [
      storage.loadStoredProjects(),
      storage.loadStoredTasks(),
      storage.loadStoredTeam(),
      storage.loadStoredBackups(),
    ],
    [[], [], [], []],
  );
});
test("first load never silently seeds demo data", () =>
  assert.deepEqual(
    [
      storage.loadStoredProjects(),
      storage.loadStoredTasks(),
      storage.loadStoredTeam(),
    ],
    [[], [], []],
  ));
test("custom task survives without task-501", () => {
  const task = { ...INITIAL_TASKS[0], id: "custom" };
  storage.saveStoredTasks([task]);
  assert.deepEqual(storage.loadStoredTasks(), [task]);
});
test("team of one survives reload", () => {
  storage.saveStoredTeam([INITIAL_TEAM_MEMBERS[0]]);
  assert.equal(storage.loadStoredTeam().length, 1);
});
test("logout and forged local identity never authenticate", () => {
  storage.saveStoredAuthUser(null);
  assert.equal(storage.loadStoredAuthUser(), null);
  cache.set(
    "workplace_auth_user_v5",
    JSON.stringify({ id: "team-soli", isDirector: true }),
  );
  assert.equal(storage.loadStoredAuthUser(), null);
});
test("normalizes duplicate IDs consistently", () =>
  assert.deepEqual(storage.deduplicateById([{ id: " a " }, { id: "a" }]), [
    { id: "a" },
  ]));
test("canonical backup and legacy header export import", () => {
  const p = payload();
  const first = storage.validateBackupPayload(p);
  assert.equal(first.valid, true, first.error);
  const { team, ...rest } = p;
  const legacy = storage.validateBackupPayload({ ...rest, teamMembers: team });
  assert.equal(legacy.valid, true, legacy.error);
});
test("rejects malformed records, IDs, dates and enums", () => {
  for (const change of [
    { id: 5 },
    { id: "bad/id" },
    { name: undefined },
    { currentPhase: "invalid" },
    { startDate: "2026-02-30" },
    { teamMemberIds: 7 },
  ]) {
    const p = payload();
    p.projects[0] = { ...p.projects[0], ...change } as any;
    assert.equal(
      storage.validateBackupPayload(p).valid,
      false,
      JSON.stringify(change),
    );
  }
});
test("rejects orphan references, duplicates, unknown version and inconsistent completion", () => {
  const orphan = payload();
  orphan.tasks[0].projectId = "missing";
  assert.equal(storage.validateBackupPayload(orphan).valid, false);
  const duplicate = payload();
  duplicate.projects.push(duplicate.projects[0]);
  assert.equal(storage.validateBackupPayload(duplicate).valid, false);
  assert.equal(
    storage.validateBackupPayload({ ...payload(), version: "99.0.0" }).valid,
    false,
  );
  const inconsistent = payload();
  inconsistent.tasks[0].completed = !inconsistent.tasks[0].completed;
  assert.equal(storage.validateBackupPayload(inconsistent).valid, false);
});
test("dates reject impossible, empty, malformed and reversed values", () => {
  for (const [a, b] of [
    ["invalid", "invalid"],
    ["2026-02-30", "2026-03-02"],
    ["", "2026-01-01"],
    ["2026-10-24", "2026-10-23"],
  ])
    assert.equal(validateDateRange(a, b).isValid, false);
  assert.equal(validateDateRange("2024-02-29", "2024-02-29").isValid, true);
});
test("restore removes records absent from backup and supports empty backup", () => {
  const p = { ...payload(), projects: [], tasks: [], team: [] };
  assert.deepEqual(
    planReplacement(p, { projects: ["new"], tasks: ["task"], teamMembers: [] }),
    [
      { collection: "projects", id: "new" },
      { collection: "tasks", id: "task" },
    ],
  );
});
test("oversized restore fails before writes", () =>
  assert.throws(() =>
    planReplacement(
      { ...payload(), projects: [], tasks: [], team: [] },
      {
        projects: Array.from({ length: 449 }, (_, i) => "p" + i),
        tasks: [],
        teamMembers: [],
      },
    ),
  ));
