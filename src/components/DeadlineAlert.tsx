import React from 'react';
import { checkDateStatus, DateStatus } from '../utils/dateUtils';
import { AlertTriangle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DeadlineAlertProps {
  endDate: string;
  isCompleted: boolean;
  compact?: boolean; // If true, renders a small badge/icon for tables or cards
  showLabel?: boolean;
}

export const DeadlineAlert: React.FC<DeadlineAlertProps> = ({
  endDate,
  isCompleted,
  compact = false,
  showLabel = true,
}) => {
  const status: DateStatus = checkDateStatus(endDate, isCompleted);

  if (isCompleted) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700" title="Tarefa Concluída">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {showLabel && <span>Concluída</span>}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Concluída (Já Fez)</span>
      </span>
    );
  }

  // TAREFA EXPIRADA / ATRASADA
  if (status.isOverdue) {
    if (compact) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-300 px-1.5 py-0.2 rounded-sm"
          title={`Prazo expirado! ${status.label}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          {showLabel && <span>{status.label}</span>}
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-300 text-xs font-semibold text-rose-700 shadow-xs"
        title="Prazo contratual expirado! Requer ação imediata."
      >
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
        <span>{status.label}</span>
      </span>
    );
  }

  // TAREFA VENCE HOJE
  if (status.isToday) {
    if (compact) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded-sm"
          title="Atenção: Prazo de entrega vence hoje!"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          {showLabel && <span>Vence hoje!</span>}
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-800 shadow-xs"
        title="Atenção: Prazo de entrega vence hoje!"
      >
        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Vence hoje!</span>
      </span>
    );
  }

  // TAREFA COM CONCLUSÃO PRÓXIMA (1 a 3 dias)
  if (status.isSoon) {
    if (compact) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50/80 border border-amber-200 px-1.5 py-0.2 rounded-sm"
          title={`Prazo próximo: ${status.label}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          {showLabel && <span>{status.label}</span>}
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800"
        title={`Atenção: Conclusão próxima (${status.label})`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>{status.label}</span>
      </span>
    );
  }

  // PRAZO NORMAL FUTURO
  return (
    <span className="inline-flex items-center gap-1 text-xs text-stone-600 font-mono tabular-nums">
      {status.label}
    </span>
  );
};
