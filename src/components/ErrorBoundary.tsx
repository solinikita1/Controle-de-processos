import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-950 rounded-2xl border border-stone-800 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Workplace Arquitetura · Recuperação do Sistema</h2>
            <p className="text-xs text-stone-300">
              Ocorreu uma instabilidade pontual. Clique abaixo para restabelecer a interface imediatamente sem perda de dados.
            </p>
            <div className="text-[11px] text-stone-400 font-mono bg-stone-900 p-3 rounded-lg border border-stone-800 text-left overflow-auto max-h-28">
              {this.state.error?.message || 'Erro de execução na renderização'}
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recarregar Painel
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
