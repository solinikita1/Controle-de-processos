import { test } from "node:test";
import assert from "node:assert/strict";
import { bundleTest } from "./bundle";
import { createBackupPayload } from "../src/utils/storage";
const state = {
  records: new Map<string, any>(),
  fail: false,
  bumpRevision: false,
  writes: 0,
  listener: null as any,
  error: null as any,
};
(globalThis as any).__cloud = state;
const cloud = await bundleTest("src/services/firebase.ts", {
  firebaseClient: `export const auth={currentUser:{uid:'test'}}; export const db={};`,
  "firebase/firestore": `
 const s=globalThis.__cloud;
 export const collection=(_,name)=>name;
 export const doc=(_,name,id)=>name+'/'+id;
 const snap=(key)=>({id:key.split('/')[1],exists:()=>s.records.has(key),data:()=>s.records.get(key)});
 export const getDocFromServer=async(ref)=>{if(s.fail)throw new Error('permission-denied');return snap(ref)};
 export const getDocsFromServer=async(name)=>{const docs=[...s.records.keys()].filter(k=>k.startsWith(name+'/')).map(snap);return {docs,size:docs.length}};
 export const serverTimestamp=()=>new Date();
 export const onSnapshot=(ref,options,cb,error)=>{s.listener=cb;s.error=error;return ()=>{}};
 export const runTransaction=async(_,work)=>{
  if(s.bumpRevision)s.records.set("system/revision",{value:99});
  const pending=[];
  const result=await work({get:async(ref)=>snap(ref),set:(ref,data)=>pending.push([ref,data]),delete:(ref)=>pending.push([ref,undefined])});
  if(s.fail)throw new Error('permission-denied');
  for(const [ref,data] of pending){if(data===undefined)s.records.delete(ref);else s.records.set(ref,data);s.writes++;}
  return result;
 };
 `,
});
test("permission failures never report connected", async () => {
  state.fail = true;
  assert.equal(await cloud.testFirestoreConnection(), false);
  state.fail = false;
});
test("empty server snapshot clears clients, cached data never confirms connection", () => {
  let result: any = null,
    error = false;
  cloud.subscribeToProjects(
    (items: any) => (result = items),
    () => (error = true),
  );
  state.listener({
    metadata: { fromCache: true, hasPendingWrites: false },
    docs: [],
  });
  assert.equal(error, true);
  assert.equal(result, null);
  state.listener({
    metadata: { fromCache: false, hasPendingWrites: false },
    docs: [],
  });
  assert.deepEqual(result, []);
});
test("atomic restore deletes extras and preserves a pre-restore snapshot", async () => {
  state.records.clear();
  state.records.set("projects/new", { id: "new", name: "Before" });
  await cloud.restoreDataInCloudBatch(createBackupPayload([], [], []));
  assert.equal(state.records.has("projects/new"), false);
  const backup = [...state.records.entries()].find(([key]) =>
    key.startsWith("backups/"),
  )![1];
  assert.equal(backup.payload.projects[0].id, "new");
  assert.equal(state.records.get("system/revision").value, 1);
});
test("failed restore leaves original data intact", async () => {
  state.records.clear();
  state.records.set("projects/new", { id: "new" });
  state.fail = true;
  await assert.rejects(() =>
    cloud.restoreDataInCloudBatch(createBackupPayload([], [], [])),
  );
  assert.equal(state.records.has("projects/new"), true);
  assert.equal(state.records.size, 1);
  state.fail = false;
});
test("invalid restore performs zero writes", async () => {
  const before = state.writes;
  await assert.rejects(() =>
    cloud.restoreDataInCloudBatch({
      projects: [{ id: "x" }],
      tasks: [],
      team: [],
    }),
  );
  assert.equal(state.writes, before);
});

test("restore aborts if another writer advances the revision", async () => {
  state.records.clear();
  state.records.set("projects/new", { id: "new" });
  state.bumpRevision = true;
  await assert.rejects(
    () => cloud.restoreDataInCloudBatch(createBackupPayload([], [], [])),
    /dados mudaram/,
  );
  assert.equal(state.records.has("projects/new"), true);
  state.bumpRevision = false;
});
