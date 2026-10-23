import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create } from "react-test-renderer";
import { bundleTest } from "./bundle";
import { INITIAL_PROJECTS, INITIAL_TEAM_MEMBERS } from "../src/data/mockData";
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis, "localStorage", {
  value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
});
const state = {
  props: {} as Record<string, any>,
  watcher: null as any,
  resolve: null as any,
  reject: null as any,
  changes: [] as any[],
};
(globalThis as any).__appTest = state;
const mocks: Record<string, string> = {
  auth: `const s=globalThis.__appTest;export const watchAuthorizedUser=(cb)=>{s.watcher=cb;cb(null);return ()=>{}};export const signInWithMicrosoft=async()=>{};export const signOutMicrosoft=async()=>{s.watcher(null)};`,
  firebase: `const s=globalThis.__appTest;
 export const subscribeToProjects=(cb)=>{cb([]);return ()=>{}};
 export const subscribeToTasks=(cb)=>{cb([]);return ()=>{}};
 export const subscribeToTeam=(cb)=>{cb([]);return ()=>{}};
 export const subscribeToBackups=(cb)=>{cb([]);return ()=>{}};
 export const commitCloudChanges=async(changes)=>{s.changes=changes;await new Promise((resolve,reject)=>{s.resolve=resolve;s.reject=reject})};
 export const saveBackupToCloud=async()=>{};export const deleteBackupFromCloud=async()=>{};export const restoreDataInCloudBatch=async()=>{};`,
};
for (const name of [
  "Header",
  "DashboardOverview",
  "ProjectDetail",
  "TeamDirectory",
  "OverallTimeline",
  "MyTasksView",
  "MicrosoftLoginModal",
  "ProjectModal",
  "TaskModal",
  "TeamModal",
  "EsteiraPipelineView",
  "BriefingModal",
  "ReportsAnalyticsView",
  "AwardModal",
  "BackupModal",
  "WorkplaceLogo",
]) {
  mocks[name] =
    `export const ${name}=props=>{globalThis.__appTest.props.${name}=props;return null;};`;
}
const { default: App } = await bundleTest("src/App.tsx", mocks);
test("app requires verified session; save waits for confirmation and preserves state on failure", async () => {
  let root: any;
  await act(async () => {
    root = create(React.createElement(App));
  });
  assert.equal(
    state.props.Header,
    undefined,
    "No dashboard before authorization",
  );
  assert.equal(state.props.MicrosoftLoginModal.currentUser, null);
  await act(async () =>
    state.watcher({ ...INITIAL_TEAM_MEMBERS[0], isDirector: true }),
  );
  assert.equal(state.props.Header.cloudConnected, true);
  let saving: Promise<boolean>;
  const project = { ...INITIAL_PROJECTS[0], teamMemberIds: [] };
  await act(async () => {
    saving = state.props.ProjectModal.onSave(project);
  });
  assert.equal(state.changes.length, 1);
  assert.equal(
    state.props.Header.projects.length,
    0,
    "Pending writes are not presented as saved",
  );
  await act(async () => {
    state.reject(new Error("permission denied"));
    assert.equal(await saving, false);
  });
  assert.equal(state.props.Header.projects.length, 0);
  assert.match(JSON.stringify(root.toJSON()), /Não foi possível salvar/);
  await act(async () => {
    saving = state.props.ProjectModal.onSave(project);
  });
  await act(async () => {
    state.resolve();
    assert.equal(await saving, true);
  });
  assert.equal(state.props.Header.projects.length, 1);
  await act(async () => state.watcher(null));
  assert.equal(state.props.MicrosoftLoginModal.currentUser, null);
  await act(async () => root.unmount());
});
