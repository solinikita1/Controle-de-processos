import React, { useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import type { AuthUser } from "../types";
import { WorkplaceLogo } from "./WorkplaceLogo";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  error?: string | null;
}
export function MicrosoftLoginModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  error,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  if (!isOpen) return null;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setLocalError(null);
    try {
      await action();
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "Não foi possível concluir o acesso.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden"
      >
        <div className="bg-stone-900 p-6 flex justify-between items-center">
          <WorkplaceLogo variant="horizontal" theme="dark" height={36} />
          {currentUser && (
            <button
              aria-label="Fechar acesso"
              onClick={onClose}
              className="text-white"
            >
              <X />
            </button>
          )}
        </div>
        <div className="p-6 space-y-4">
          <h2 id="login-title" className="font-bold text-lg">
            Acesso à Workplace
          </h2>
          <p className="text-sm text-stone-600">
            Entre com sua conta Microsoft corporativa @workplace.arq.br.
            O acesso da equipe é liberado automaticamente.
          </p>
          {(localError || error) && (
            <p role="alert" className="text-sm text-rose-700">
              {localError || error}
            </p>
          )}
          {currentUser && (
            <p className="text-sm">
              Conectado como {currentUser.name} ({currentUser.email}).
            </p>
          )}
          <button
            disabled={busy}
            onClick={() => run(currentUser ? onLogout : onLogin)}
            className="w-full rounded-lg bg-stone-900 text-white p-3 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck size={18} />
            {busy
              ? "Aguarde…"
              : currentUser
                ? "Sair da conta"
                : "Entrar com Microsoft"}
          </button>
        </div>
      </section>
    </div>
  );
}
