import {
  OAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { collection, doc, getDocFromServer, getDocsFromServer } from "firebase/firestore";
import { auth, db } from "./firebaseClient";
import type { AuthUser } from "../types";

async function authorizedProfile(user: User): Promise<AuthUser> {
  const token = await user.getIdTokenResult();
  const provider = (token.claims.firebase as { sign_in_provider?: string })
    ?.sign_in_provider;
  if (
    provider !== "microsoft.com" ||
    !user.email?.toLowerCase().endsWith("@workplace.arq.br")
  ) {
    throw new Error("Use sua conta Microsoft corporativa @workplace.arq.br.");
  }
  const access = await getDocFromServer(doc(db, "access", user.uid));
  const data = access.data();
  if (data?.enabled === false) {
    throw new Error("O acesso desta conta foi desativado pela administração.");
  }
  const isAdmin = data?.enabled === true && data?.role === "admin";
  const team = await getDocsFromServer(collection(db, "teamMembers"));
  const matches = team.docs.filter((member) =>
    member.data().email?.trim().toLowerCase() === user.email!.toLowerCase());
  const teamMemberId = typeof data?.teamMemberId === "string" && data.teamMemberId
    ? data.teamMemberId
    : matches.length === 1 ? matches[0].id : user.uid;
  const name = user.displayName || user.email;
  return {
    id: teamMemberId,
    name,
    email: user.email,
    role: isAdmin ? "Administração" : "Equipe",
    initials: name
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join(""),
    avatarColor: "bg-stone-700 text-white",
    department: "",
    isDirector: isAdmin,
  };
}

export function watchAuthorizedUser(
  onChange: (user: AuthUser | null) => void,
  onError: (error: Error) => void,
) {
  let generation = 0;
  const unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      const current = ++generation;
      onChange(null);
      if (!user) return;
      try {
        const profile = await authorizedProfile(user);
        if (current === generation) onChange(profile);
      } catch (error) {
        if (current === generation)
          onError(
            error instanceof Error
              ? error
              : new Error("Falha ao validar o acesso."),
          );
      }
    },
    onError,
  );
  return () => {
    generation++;
    unsubscribe();
  };
}

export async function signInWithMicrosoft(): Promise<void> {
  // Public Workplace directory ID; the client secret stays only in Firebase.
  const tenant = import.meta.env.VITE_MICROSOFT_TENANT_ID ||
    "fdd3d003-fbc1-4733-8da9-1b06d157aae1";
  if (
    !tenant ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      tenant,
    )
  ) {
    throw new Error(
      "O acesso Microsoft ainda está em configuração. Contate a administração.",
    );
  }
  const provider = new OAuthProvider("microsoft.com");
  provider.setCustomParameters({ tenant, prompt: "select_account" });
  await signInWithPopup(auth, provider);
}
export async function signOutMicrosoft(): Promise<void> {
  await signOut(auth);
}
