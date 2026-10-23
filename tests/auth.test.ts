import { test } from "node:test";
import assert from "node:assert/strict";
import { bundleTest } from "./bundle";
const state = {
  callback: null as any,
  access: { enabled: true, role: "admin", teamMemberId: "team-soli" } as any,
  popup: null as any,
};
(globalThis as any).__authTest = state;
const service = await bundleTest(
  "src/services/auth.ts",
  {
    firebaseClient: "export const auth={};export const db={};",
    "firebase/auth": `
 const s=globalThis.__authTest;
 export const onAuthStateChanged=(_,cb)=>{s.callback=cb;return ()=>{}};
 export class OAuthProvider {constructor(id){this.id=id}setCustomParameters(params){this.params=params}}
 export const signInWithPopup=async(_,provider)=>{s.popup=provider};
 export const signOut=async()=>{await s.callback(null)};
 `,
    "firebase/firestore": `
 export const doc=(_,collection,id)=>collection+'/'+id;
 export const getDocFromServer=async()=>({exists:()=>!!globalThis.__authTest.access,data:()=>globalThis.__authTest.access});
 `,
  },
  {
    "import.meta.env.VITE_MICROSOFT_TENANT_ID": JSON.stringify(
      "11111111-1111-1111-1111-111111111111",
    ),
  },
);
const user = (provider = "microsoft.com", email = "soli@workplace.arq.br") => ({
  uid: "uid",
  email,
  displayName: "Soli",
  getIdTokenResult: async () => ({
    claims: { firebase: { sign_in_provider: provider } },
  }),
});
test("Microsoft popup is tenant-scoped and not a password form", async () => {
  await service.signInWithMicrosoft();
  assert.equal(state.popup.id, "microsoft.com");
  assert.equal(
    state.popup.params.tenant,
    "11111111-1111-1111-1111-111111111111",
  );
});
test("valid authorized Microsoft user maps to approved team ID and logout clears it", async () => {
  let profile: any = null;
  const stop = service.watchAuthorizedUser(
    (u: any) => (profile = u),
    (e: Error) => {
      throw e;
    },
  );
  await state.callback(user());
  assert.equal(profile.id, "team-soli");
  assert.equal(profile.isDirector, true);
  await service.signOutMicrosoft();
  assert.equal(profile, null);
  stop();
});
test("wrong provider, personal email, missing access and disabled access never open app", async () => {
  for (const [u, access] of [
    [user("google.com"), { enabled: true, role: "admin" }],
    [user("microsoft.com", "soli@gmail.com"), { enabled: true, role: "admin" }],
    [user(), null],
    [user(), { enabled: false, role: "admin" }],
  ]) {
    state.access = access;
    let profile: any = "initial",
      error: any = null;
    const stop = service.watchAuthorizedUser(
      (u: any) => (profile = u),
      (e: Error) => (error = e),
    );
    await state.callback(u);
    assert.equal(profile, null);
    assert.ok(error);
    stop();
  }
});
