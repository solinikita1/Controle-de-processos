import React, { useState } from 'react';
import { Project, ProjectAwardInfo, NegotiationModel } from '../types';
import { Trophy, CheckCircle2, DollarSign, Calendar, User, FileText, X, AlertCircle, Sparkles, Building2 } from 'lucide-react';

interface AwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onConfirmAward: (projectId: string, awardInfo: ProjectAwardInfo) => void;
}

export const AwardModal: React.FC<AwardModalProps> = ({
  isOpen,
  onClose,
  project,
  onConfirmAward,
}) => {
  const existingAward = project.award;
  const [awardValue, setAwardValue] = useState<string>(
    existingAward?.awardValueBRL ? String(existingAward.awardValueBRL) : (project.estimatedBudgetBRL ? String(project.estimatedBudgetBRL) : '1500000')
  );
  const [awardedAt, setAwardedAt] = useState<string>(
    existingAward?.awardedAt ? existingAward.awardedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [clientDecisionMaker, setClientDecisionMaker] = useState<string>(
    existingAward?.clientDecisionMaker || project.briefing?.clientContactPerson || ''
  );
  const [notes, setNotes] = useState<string>(
    existingAward?.notes || 'Projeto e orçamento aprovados integralmente pela diretoria do cliente. Liberado para entrada no segundo momento da esteira: Projeto Executivo completo.'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(awardValue.replace(/[^0-9.]/g, '')) || 0;

    const awardInfo: ProjectAwardInfo = {
      status: 'awarded',
      awardedAt: `${awardedAt} 10:00`,
      awardValueBRL: valNum,
      clientDecisionMaker: clientDecisionMaker.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onConfirmAward(project.id, awardInfo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Golden Trophy Header */}
        <div className="bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
              <Trophy className="w-8 h-8 text-amber-100" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-100 bg-amber-700/40 px-2 py-0.5 rounded-full">
                Marco Decisório Comercial
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Registrar Award (Projeto Comprado pelo Cliente)
              </h2>
              <p className="text-xs text-amber-100/90 mt-0.5">
                {project.code} · {project.client} · {project.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Transição para o 2º Momento da Esteira Workplace</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              Ao registrar o <strong>Award</strong>, o projeto conclui formalmente a <em>Área de Criação (Conceitual, Orçamento e Apresentação)</em> e avança para o <strong>Projeto Executivo</strong>, ativando automaticamente os 4 fluxos obrigatórios:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 font-medium text-amber-900">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>1. Todas as Plantas</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>2. Complementares (Engenharias)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3. Aprovação no Condomínio</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>4. Seguros & Docs Obrigatórios</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Valor do Contrato Fechado */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Valor Total Fechado / Award (R$) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={awardValue}
                  onChange={(e) => setAwardValue(e.target.value)}
                  placeholder="Ex: 1850000"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono font-bold"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Valor contratado de projeto / obra corporativa.
              </span>
            </div>

            {/* Data da Compra / Award */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Data do Award / Compra *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={awardedAt}
                  onChange={(e) => setAwardedAt(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Data em que o cliente confirmou o aceite.
              </span>
            </div>

          </div>

          {/* Decisor no Cliente */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Decisor Responsável no Cliente (Quem deu o Award)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={clientDecisionMaker}
                onChange={(e) => setClientDecisionMaker(e.target.value)}
                placeholder="Ex: Patrícia Alencar - VP Real Estate & Facilities"
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            {project.briefing?.clientContactPerson && !clientDecisionMaker && (
              <button
                type="button"
                onClick={() => setClientDecisionMaker(`${project.briefing?.clientContactPerson} (${project.briefing?.clientContactRole || 'Contato Principal'})`)}
                className="text-[11px] text-amber-700 hover:underline mt-1 block"
              >
                + Usar contato do briefing: {project.briefing.clientContactPerson}
              </button>
            )}
          </div>

          {/* Notas de Fechamento */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Observações Comerciais & Alinhamentos do Award
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva detalhes como condições comerciais, premissas de início do executivo ou prazos do condomínio..."
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-neutral-800"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-linear-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-100" />
              <span>Confirmar Award & Liberar Projeto Executivo</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
