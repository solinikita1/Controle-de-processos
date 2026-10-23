import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { bundleTest } from "./bundle";
let env: RulesTestEnvironment;
const claims = (
  provider = "microsoft.com",
  email = "user@workplace.arq.br",
) => ({ email, firebase: { sign_in_provider: provider } });
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-workplace",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});
after(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "access", "admin"), {
      enabled: true,
      role: "admin",
      teamMemberId: "team-admin",
    });
    await setDoc(doc(db, "access", "editor"), {
      enabled: true,
      role: "editor",
      teamMemberId: "team-editor",
    });
    await setDoc(doc(db, "projects", "p"), { id: "p", name: "Existing" });
  });
});
const database = (
  uid: string,
  provider = "microsoft.com",
  email = "user@workplace.arq.br",
) => env.authenticatedContext(uid, claims(provider, email)).firestore();
function batchWrite(db: any, uid: string, path: string, data: any) {
  const batch = writeBatch(db);
  batch.set(doc(db, path), data);
  batch.set(doc(db, "system/revision"), {
    value: 1,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });
  return batch.commit();
}
const project = {
  id: "new",
  name: "New project",
  teamMemberIds: [],
  startDate: "2026-10-23",
  targetEndDate: "2026-10-24",
};
test("anonymous access and test collection are denied", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "projects", "p")));
  await assertFails(setDoc(doc(db, "projects", "new"), project));
  await assertFails(setDoc(doc(db, "test", "connection"), { test: true }));
});
test("wrong provider, personal email and unapproved accounts are denied", async () => {
  for (const db of [
    database("admin", "google.com"),
    database("admin", "microsoft.com", "person@gmail.com"),
    database("unknown"),
  ]) {
    await assertFails(getDoc(doc(db, "projects", "p")));
  }
});
test("users cannot authorize themselves or change their role", async () => {
  await assertFails(
    setDoc(doc(database("editor"), "access", "editor"), {
      enabled: true,
      role: "admin",
    }),
  );
});
test("members read, but writes without revision are denied", async () => {
  const db = database("editor");
  await assertSucceeds(getDoc(doc(db, "projects", "p")));
  await assertFails(setDoc(doc(db, "projects", "new"), project));
  await assertFails(deleteDoc(doc(db, "projects", "p")));
});
test("editor can save project atomically with revision", async () => {
  await assertSucceeds(
    batchWrite(database("editor"), "editor", "projects/new", project),
  );
});
test("editor cannot modify team or backups even with revision", async () => {
  await assertFails(
    batchWrite(database("editor"), "editor", "teamMembers/member", {
      id: "member",
      name: "Member",
      email: "m@workplace.arq.br",
    }),
  );
  await assertFails(
    batchWrite(database("editor"), "editor", "backups/b", {
      id: "b",
      payload: {},
    }),
  );
});
test("admin can manage team, but cannot forge revision actor or ID", async () => {
  await assertSucceeds(
    batchWrite(database("admin"), "admin", "teamMembers/member", {
      id: "member",
      name: "Member",
      email: "m@workplace.arq.br",
    }),
  );
  await assertFails(
    batchWrite(database("admin"), "editor", "projects/new", project),
  );
  await assertFails(
    batchWrite(database("editor"), "editor", "projects/new", {
      ...project,
      id: "different",
    }),
  );
});
test("real SDK restore removes extras and saves pre-restore backup under rules", async () => {
  (globalThis as any).__rulesDb = database("admin");
  const cloud = await bundleTest("src/services/firebase.ts", {
    firebaseClient: `export const db=globalThis.__rulesDb; export const auth={currentUser:{uid:'admin'}};`,
  });
  await cloud.restoreDataInCloudBatch({
    version: "5.0.0",
    systemName: "Test",
    exportedAt: new Date().toISOString(),
    projects: [],
    tasks: [],
    team: [],
  });
  assert.equal(
    (
      await getDoc(doc((globalThis as any).__rulesDb, "projects", "p"))
    ).exists(),
    false,
  );
  assert.equal(
    (
      await getDoc(doc((globalThis as any).__rulesDb, "system", "revision"))
    ).data()?.value,
    1,
  );
});

test("editor restore is rejected atomically without deleting existing projects", async () => {
  (globalThis as any).__rulesDb = database("editor");
  const cloud = await bundleTest("src/services/firebase.ts", {
    firebaseClient:
      "export const db=globalThis.__rulesDb; export const auth={currentUser:{uid:'editor'}};",
  });
  await assert.rejects(() =>
    cloud.restoreDataInCloudBatch({
      version: "5.0.0",
      systemName: "Test",
      exportedAt: new Date().toISOString(),
      projects: [],
      tasks: [],
      team: [],
    }),
  );
  assert.equal(
    (
      await getDoc(doc((globalThis as any).__rulesDb, "projects", "p"))
    ).exists(),
    true,
  );
});
