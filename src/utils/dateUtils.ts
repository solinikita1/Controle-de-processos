/**
 * Utilitários de datas e prazos para o escritório de arquitetura
 */

export function formatDatePT(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${day} ${months[mIdx] || ''} ${year}`;
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function calculateDaysDifference(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays + 1, 1); // Contando o dia inicial
}

export interface DateStatus {
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean; // Conclusão próxima (dentro de 3 dias)
  isUpcoming: boolean;
  daysRemaining: number;
  label: string;
  urgencyLevel: 'none' | 'soon' | 'today' | 'overdue';
}

export function checkDateStatus(endDateStr: string, isCompleted: boolean): DateStatus {
  if (!endDateStr) {
    return {
      isOverdue: false,
      isToday: false,
      isSoon: false,
      isUpcoming: false,
      daysRemaining: 0,
      label: '-',
      urgencyLevel: 'none',
    };
  }
  
  if (isCompleted) {
    return {
      isOverdue: false,
      isToday: false,
      isSoon: false,
      isUpcoming: false,
      daysRemaining: 0,
      label: 'Concluído',
      urgencyLevel: 'none',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const end = new Date(endDateStr + 'T00:00:00');
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Expirada / Atrasada
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      isOverdue: true,
      isToday: false,
      isSoon: false,
      isUpcoming: false,
      daysRemaining: diffDays,
      label: `Atrasada (${absDays} ${absDays === 1 ? 'dia' : 'dias'})`,
      urgencyLevel: 'overdue',
    };
  }

  // Vence Hoje
  if (diffDays === 0) {
    return {
      isOverdue: false,
      isToday: true,
      isSoon: false,
      isUpcoming: false,
      daysRemaining: 0,
      label: 'Vence hoje!',
      urgencyLevel: 'today',
    };
  }

  // Vence em breve (1 a 3 dias)
  if (diffDays <= 3) {
    return {
      isOverdue: false,
      isToday: false,
      isSoon: true,
      isUpcoming: true,
      daysRemaining: diffDays,
      label: diffDays === 1 ? 'Vence amanhã' : `Vence em ${diffDays} dias`,
      urgencyLevel: 'soon',
    };
  }

  // Prazo normal futuro (> 3 dias)
  return {
    isOverdue: false,
    isToday: false,
    isSoon: false,
    isUpcoming: true,
    daysRemaining: diffDays,
    label: `${diffDays} dias restantes`,
    urgencyLevel: 'none',
  };
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateDateRange(startDateStr: string, endDateStr: string): { isValid: boolean; error?: string } {
  if (!startDateStr || startDateStr.trim() === '') {
    return { isValid: false, error: 'A data de início é obrigatória.' };
  }
  if (!endDateStr || endDateStr.trim() === '') {
    return { isValid: false, error: 'A data de fim é obrigatória.' };
  }
  if (!isValidDateString(startDateStr) || !isValidDateString(endDateStr)) {
    return { isValid: false, error: 'Informe datas válidas no formato AAAA-MM-DD.' };
  }
  if (startDateStr > endDateStr) {
    return { isValid: false, error: 'A data de término não pode ser anterior à data de início.' };
  }
  return { isValid: true };
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
