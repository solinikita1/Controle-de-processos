import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, ArchitecturePhase, TeamMember } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { calculateDaysDifference, validateDateRange, getTodayDateString } from '../utils/dateUtils';
import { X, Calendar, AlertCircle, CheckCircle2, User, Flag, Layers, Plus, Trash2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  taskToEdit?: Task | null;
  projectId: string;
  projectTeam: TeamMember[];
  allTeamMembers: TeamMember[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  projectId,
  projectTeam,
  allTeamMembers,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<ArchitecturePhase>('projeto_executivo');
  const [responsibleId, setResponsibleId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [status, setStatus] = useState<TaskStatus>('a_fazer');
  const [completed, setCompleted] = useState(false);
  const [deliverables, setDeliverables] = useState('');
  const [checklist, setChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Populate or reset
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPhase(taskToEdit.phase);
      setResponsibleId(taskToEdit.responsibleId);
      setStartDate(taskToEdit.startDate);
      setEndDate(taskToEdit.endDate);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setCompleted(taskToEdit.completed);
      setDeliverables(taskToEdit.deliverables || '');
      setChecklist(taskToEdit.checklist || []);
      setErrors({});
    } else {
      const today = getTodayDateString();
      setTitle('');
      setDescription('');
      setPhase('projeto_executivo');
      setResponsibleId(projectTeam.length > 0 ? projectTeam[0].id : (allTeamMembers[0]?.id || ''));
      setStartDate(today);
      setEndDate(today);
      setPriority('media');
      setStatus('a_fazer');
      setCompleted(false);
      setDeliverables('');
      setChecklist([]);
      setErrors({});
    }
  }, [taskToEdit, isOpen, projectTeam, allTeamMembers]);

  if (!isOpen) return null;

  const durationDays = (startDate && endDate) ? calculateDaysDifference(startDate, endDate) : 0;

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      { id: 'chk_' + Date.now(), text: newChecklistText.trim(), completed: false }
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleCompletedToggle = (checked: boolean) => {
    setCompleted(checked);
    if (checked) {
      setStatus('concluida');
    } else if (status === 'concluida') {
      setStatus('em_andamento');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = 'O título da tarefa é obrigatório.';
    }

    if (!responsibleId) {
      newErrors.responsibleId = 'Selecione um profissional responsável pela tarefa.';
    }

    // MANDATORY DATE VALIDATION
    const dateCheck = validateDateRange(startDate, endDate);
    if (!dateCheck.isValid) {
      if (!startDate) newErrors.startDate = 'Data de início é obrigatória.';
      if (!endDate) newErrors.endDate = 'Data de fim é obrigatória.';
      if (dateCheck.error && startDate && endDate) newErrors.endDate = dateCheck.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedTask: Task = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      projectId,
      title: title.trim(),
      description: description.trim(),
      phase,
      responsibleId,
      startDate,
      endDate,
      priority,
      status: completed ? 'concluida' : status,
      completed,
      deliverables: deliverables.trim() || undefined,
      checklist,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedTask);
    onClose();
  };

  // Combine project team members first, then other studio members
  const availableMembers = projectTeam.length > 0 ? projectTeam : allTeamMembers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-neutral-200 rounded-xl shadow-xl my-8 overflow-hidden text-neutral-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-stone-50/70">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              {taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa de Arquitetura'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Defina a atividade, datas obrigatórias, prioridade e arquiteto responsável.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Título da Tarefa <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder="Ex: Compatibilização de Forro x Climatização VRF nos pavimentos"
              className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 bg-white ${
                errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-300'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Grid: Responsible and Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Responsible */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Responsável <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <select
                  value={responsibleId}
                  onChange={(e) => {
                    setResponsibleId(e.target.value);
                    if (errors.responsibleId) setErrors({ ...errors, responsibleId: '' });
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg appearance-none bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${
                    errors.responsibleId ? 'border-rose-400' : 'border-neutral-300'
                  }`}
                >
                  <option value="">Selecione o profissional...</option>
                  {availableMembers.map((m, idx) => (
                    <option key={`task-member-${m.id}-${idx}`} value={m.id}>
                      {m.name} — {m.role}
                    </option>
                  ))}
                </select>
                <User className="absolute right-3 top-2.5 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
              {errors.responsibleId && (
                <p className="text-xs text-rose-600 mt-1">{errors.responsibleId}</p>
              )}
            </div>

            {/* Phase */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Fase de Arquitetura
              </label>
              <div className="relative">
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as ArchitecturePhase)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg appearance-none bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                >
                  {ARCHITECTURE_PHASES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.shortName} - {p.name}
                    </option>
                  ))}
                </select>
                <Layers className="absolute right-3 top-2.5 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* OBRIGATÓRIO: Início e Fim */}
          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stone-700" />
                Datas do Cronograma (Obrigatório)
              </span>
              {durationDays > 0 && (
                <span className="text-xs font-mono font-medium text-stone-700 tabular-nums">
                  Duração: {durationDays} {durationDays === 1 ? 'dia' : 'dias'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data de Início <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  required
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) setErrors({ ...errors, startDate: '' });
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${
                    errors.startDate ? 'border-rose-400' : 'border-neutral-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="text-xs text-rose-600 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data de Fim (Entrega) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  required
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) setErrors({ ...errors, endDate: '' });
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${
                    errors.endDate ? 'border-rose-400' : 'border-neutral-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-xs text-rose-600 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Grid: Importance / Priority AND Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Importance / Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-neutral-500" />
                Importância da Tarefa
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['baixa', 'media', 'alta', 'critica'] as TaskPriority[]).map((p) => {
                  const labels = { baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' };
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md border text-center transition-all ${
                        isSelected
                          ? p === 'critica'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 font-semibold shadow-xs'
                            : p === 'alta'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 font-semibold shadow-xs'
                            : p === 'media'
                            ? 'bg-sky-50 border-sky-500 text-sky-800 font-semibold shadow-xs'
                            : 'bg-neutral-100 border-neutral-400 text-neutral-900 font-semibold shadow-xs'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Estado de Progresso
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as TaskStatus;
                  setStatus(newStatus);
                  setCompleted(newStatus === 'concluida');
                }}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              >
                <option value="a_fazer">A Fazer (Pendente)</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="em_revisao">Em Revisão / Coordenação</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>

          </div>

          {/* Toggle: Já Fez? */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-neutral-50/50">
            <div className="flex items-center gap-2.5">
              <input
                id="task-completed-toggle"
                type="checkbox"
                checked={completed}
                onChange={(e) => handleCompletedToggle(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="task-completed-toggle" className="text-sm font-medium text-neutral-800 cursor-pointer select-none">
                Já fez esta tarefa? (Marcar como Concluída)
              </label>
            </div>
            {completed && (
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluída
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Descrição Detalhada / Instruções Técnicas
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as especificações, premissas de projeto, referências normativas (NBR) e entregáveis esperados..."
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 bg-white"
            />
          </div>

          {/* Deliverables */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Pranchas / Entregáveis
            </label>
            <input
              type="text"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="Ex: Pranchas EXE-01 a EXE-08 em PDF/DWG, Modelo IFC"
              className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 bg-white"
            />
          </div>

          {/* Checklist de Itens */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Checklist de Etapas
            </label>
            <div className="space-y-2 mb-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklist(item.id)}
                      className="w-4 h-4 text-stone-800 rounded border-neutral-300"
                    />
                    <span className={`text-xs truncate ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                      {item.text}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(item.id)}
                    className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Adicionar item ao checklist (ex: Exportar DWG, Revisar cotas...)"
                className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 bg-white"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors"
            >
              {taskToEdit ? 'Atualizar Tarefa' : 'Salvar Tarefa'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
