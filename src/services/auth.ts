import {
  OAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
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
  if (
    !access.exists() ||
    data?.enabled !== true ||
    !["admin", "editor"].includes(data.role) ||
    typeof data.teamMemberId !== "string" ||
    !data.teamMemberId
  ) {
    throw new Error(
      "Sua conta ainda não foi autorizada. Solicite acesso à administração.",
    );
  }
  const name = user.displayName || user.email;
  return {
    id: data.teamMemberId,
    name,
    email: user.email,
    role: data.role === "admin" ? "Administração" : "Equipe",
    initials: name
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join(""),
    avatarColor: "bg-stone-700 text-white",
    department: "",
    isDirector: data.role === "admin",
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
