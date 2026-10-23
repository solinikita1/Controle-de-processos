import React, { useState } from 'react';
import { Project, Task, TeamMember } from '../types';
import { downloadProjectPdf, generateProjectPdf } from '../utils/pdfGenerator';
import { formatDateShort, checkDateStatus } from '../utils/dateUtils';
import { X, FileDown, CheckSquare, Printer, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  tasks: Task[];
  allTeamMembers: TeamMember[];
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  project,
  tasks,
  allTeamMembers,
}) => {
  const [includeTeam, setIncludeTeam] = useState(true);
  const [includePhases, setIncludePhases] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [tasksFilter, setTasksFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const completedCount = projectTasks.filter((t) => t.completed || t.status === 'concluida').length;
  const progressPct = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;
  const dateStatus = checkDateStatus(project.targetEndDate, progressPct === 100);

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      downloadProjectPdf(project, tasks, allTeamMembers, {
        includeTeam,
        includePhases,
        includeTasks,
        includeNotes,
        tasksFilter,
        coordinatorNotes,
      });
      onClose();
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPreview = () => {
    try {
      const doc = generateProjectPdf(project, tasks, allTeamMembers, {
        includeTeam,
        includePhases,
        includeTasks,
        includeNotes,
        tasksFilter,
        coordinatorNotes,
      });
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } catch (e) {
      console.error('Error opening print preview:', e);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-neutral-200 rounded-xl shadow-2xl my-8 overflow-hidden text-neutral-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-900 text-white rounded-lg">
              <FileDown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                Exportar Resumo do Projeto em PDF
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Relatório executivo formatado para envio direto a clientes, comitês diretores e gestores.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          
          {/* Project Preview Card */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between gap-2 mb-1 text-xs font-mono text-neutral-500">
              <span>{project.code}</span>
              <span className="font-sans font-bold text-neutral-900 tabular-nums">
                {progressPct}% Concluído
              </span>
            </div>
            <h4 className="text-sm font-bold text-neutral-900">{project.name}</h4>
            <div className="text-xs text-neutral-600 mt-0.5">
              Cliente: <span className="font-semibold text-neutral-900">{project.client}</span> · {project.areaM2.toLocaleString('pt-BR')} m²
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2 font-mono tabular-nums">
              <span>Prazo: {formatDateShort(project.startDate)} → {formatDateShort(project.targetEndDate)}</span>
              <span>·</span>
              {dateStatus.isOverdue ? (
                <span className="text-rose-600 font-semibold">{dateStatus.label}</span>
              ) : (
                <span className="text-stone-700">{dateStatus.label}</span>
              )}
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
              Seções a Incluir no Relatório PDF
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeTeam}
                  onChange={(e) => setIncludeTeam(e.target.checked)}
                  className="w-4 h-4 text-stone-900 rounded border-neutral-300 focus:ring-0"
                />
                <span className="text-neutral-800 font-medium">Equipe Técnica do Projeto</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includePhases}
                  onChange={(e) => setIncludePhases(e.target.checked)}
                  className="w-4 h-4 text-stone-900 rounded border-neutral-300 focus:ring-0"
                />
                <span className="text-neutral-800 font-medium">Avanço por Fase (EP, AP, PE...)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeTasks}
                  onChange={(e) => setIncludeTasks(e.target.checked)}
                  className="w-4 h-4 text-stone-900 rounded border-neutral-300 focus:ring-0"
                />
                <span className="text-neutral-800 font-medium">Cronograma de Tarefas & Datas</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="w-4 h-4 text-stone-900 rounded border-neutral-300 focus:ring-0"
                />
                <span className="text-neutral-800 font-medium">Briefing & Notas Construtivas</span>
              </label>

            </div>
          </div>

          {/* Filter Tasks in Report */}
          {includeTasks && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Filtrar Atividades do Cronograma
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTasksFilter('all')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    tasksFilter === 'all'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Todas ({projectTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTasksFilter('pending')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    tasksFilter === 'pending'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Apenas Pendentes ({projectTasks.length - completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTasksFilter('completed')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    tasksFilter === 'completed'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  Apenas Já Feitas ({completedCount})
                </button>
              </div>
            </div>
          )}

          {/* Coordinator Commentary */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Parecer / Mensagem da Coordenação ao Cliente (Opcional)
            </label>
            <textarea
              rows={3}
              value={coordinatorNotes}
              onChange={(e) => setCoordinatorNotes(e.target.value)}
              placeholder="Ex: Segue relatório com a conclusão das pranchas executivas de iluminação. A compatibilização de HVAC segue em andamento conforme cronograma previsto."
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Esta mensagem será destacada no início do relatório oficial para o cliente.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-white transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPreview}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Visualizar em Tela Cheia
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              {isGenerating ? 'Gerando PDF...' : 'Baixar Arquivo PDF (.pdf)'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
