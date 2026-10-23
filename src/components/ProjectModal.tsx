import React, { useState, useEffect } from 'react';
import { Project, TeamMember, ArchitecturePhase, ProjectPriority } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { validateDateRange, getTodayDateString, addDays } from '../utils/dateUtils';
import { X, Building2, Calendar, Users, MapPin, DollarSign, AlertCircle, FileText, ShieldAlert } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => Promise<boolean>;
  projectToEdit?: Project | null;
  allTeamMembers: TeamMember[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  allTeamMembers,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [areaM2, setAreaM2] = useState<number | string>(1500);
  const [typology, setTypology] = useState<Project['typology']>('Escritório Corporativo');
  const [description, setDescription] = useState('');
  const [currentPhase, setCurrentPhase] = useState<ArchitecturePhase>('estudo_preliminar');
  const [priority, setPriority] = useState<ProjectPriority>('p2_alta');
  const [startDate, setStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [estimatedBudgetBRL, setEstimatedBudgetBRL] = useState<number | string>('');
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setCode(projectToEdit.code);
      setClient(projectToEdit.client);
      setLocation(projectToEdit.location);
      setAreaM2(projectToEdit.areaM2);
      setTypology(projectToEdit.typology);
      setDescription(projectToEdit.description);
      setCurrentPhase(projectToEdit.currentPhase);
      setPriority(projectToEdit.priority || 'p2_alta');
      setStartDate(projectToEdit.startDate);
      setTargetEndDate(projectToEdit.targetEndDate);
      setEstimatedBudgetBRL(projectToEdit.estimatedBudgetBRL || '');
      setSelectedTeamMemberIds(projectToEdit.teamMemberIds || []);
      setNotes(projectToEdit.notes || '');
      setErrors({});
    } else {
      const today = getTodayDateString();
      const endDefault = addDays(today, 90);
      setName('');
      setCode(`CORP-2026-${String(Math.floor(Math.random() * 90) + 10)}`);
      setClient('');
      setLocation('São Paulo - SP');
      setAreaM2(1200);
      setTypology('Escritório Corporativo');
      setDescription('');
      setCurrentPhase('estudo_preliminar');
      setPriority('p2_alta');
      setStartDate(today);
      setTargetEndDate(endDefault);
      setEstimatedBudgetBRL(1800000);
      // Select first 2-3 members by default as team foundation
      setSelectedTeamMemberIds(allTeamMembers.slice(0, 3).map((m) => m.id));
      setNotes('');
      setErrors({});
    }
  }, [projectToEdit, isOpen, allTeamMembers]);

  if (!isOpen) return null;

  const toggleTeamMember = (memberId: string) => {
    if (selectedTeamMemberIds.includes(memberId)) {
      setSelectedTeamMemberIds(selectedTeamMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedTeamMemberIds([...selectedTeamMemberIds, memberId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'O nome do projeto é obrigatório.';
    if (!client.trim()) newErrors.client = 'O nome do cliente é obrigatório.';

    // Mandatory date validation
    const dateCheck = validateDateRange(startDate, targetEndDate);
    if (!dateCheck.isValid) {
      if (!startDate) newErrors.startDate = 'Data de início é obrigatória.';
      if (!targetEndDate) newErrors.targetEndDate = 'Data de conclusão é obrigatória.';
      if (dateCheck.error && startDate && targetEndDate) newErrors.targetEndDate = dateCheck.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedProject: Project = {
      id: projectToEdit ? projectToEdit.id : `proj-${Date.now()}`,
      code: code.trim() || `CORP-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      client: client.trim(),
      location: location.trim() || 'São Paulo - SP',
      areaM2: Number(areaM2) || 0,
      typology,
      description: description.trim(),
      status: projectToEdit ? projectToEdit.status : (currentPhase === 'captacao_briefing' ? 'briefing' : 'desenvolvimento'),
      currentPhase,
      priority,
      pipelineStage: projectToEdit?.pipelineStage || (currentPhase === 'captacao_briefing' ? 'briefing_concluido' : 'desenvolvimento_ativo'),
      pipelineOrder: projectToEdit?.pipelineOrder || 99,
      entryDate: projectToEdit?.entryDate || getTodayDateString(),
      briefing: projectToEdit?.briefing,
      startDate,
      targetEndDate,
      estimatedBudgetBRL: estimatedBudgetBRL ? Number(estimatedBudgetBRL) : undefined,
      teamMemberIds: selectedTeamMemberIds,
      createdAt: projectToEdit ? projectToEdit.createdAt : new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    if (await onSave(updatedProject)) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-neutral-200 rounded-xl shadow-xl my-8 overflow-hidden text-neutral-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-900 text-white rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                {projectToEdit ? 'Editar Projeto Corporativo' : 'Novo Projeto de Arquitetura'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Cadastre os dados contratuais, equipe alocada e cronograma obrigatório de início e término.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
          
          {/* Row 1: Code and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Código
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CORP-2026-05"
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Nome do Projeto <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="Ex: Sede FinTech Nexus - Plaza Faria Lima"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${
                  errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-300'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Client and Typology */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Cliente / Contratante <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => {
                  setClient(e.target.value);
                  if (errors.client) setErrors({ ...errors, client: '' });
                }}
                placeholder="Ex: Banco Itaú / XP Investimentos / Mattos Filho"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${
                  errors.client ? 'border-rose-400 bg-rose-50/20' : 'border-neutral-300'
                }`}
              />
              {errors.client && <p className="text-xs text-rose-600 mt-1">{errors.client}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Tipologia Corporativa
              </label>
              <select
                value={typology}
                onChange={(e) => setTypology(e.target.value as Project['typology'])}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              >
                <option value="Escritório Corporativo">Escritório Corporativo (Headquarters)</option>
                <option value="Hub de Inovação">Hub de Inovação & Tech Lab</option>
                <option value="Sede Institucional">Sede Institucional & Advocacia</option>
                <option value="Coworking">Coworking & Espaço Compartilhado</option>
                <option value="Retrofit Comercial">Retrofit Comercial / Laje Corporativa</option>
                <option value="Data Center & Tech">Data Center & Tech Facility</option>
              </select>
            </div>
          </div>

          {/* Row 3: Area m2, Location, Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Área Projetada (m²)
              </label>
              <input
                type="number"
                min="10"
                step="10"
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
                placeholder="1500"
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                Localização / Cidade
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Av. Faria Lima, 3477, SP"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
                Orçamento Previsto (R$)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={estimatedBudgetBRL}
                onChange={(e) => setEstimatedBudgetBRL(e.target.value)}
                placeholder="2500000"
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* OBRIGATÓRIO: Início e Fim do Projeto */}
          <div className="p-4 rounded-lg bg-stone-50 border border-stone-200">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5 mb-3">
              <Calendar className="w-4 h-4 text-stone-700" />
              Cronograma Geral do Projeto (Obrigatório)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data de Início <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) setErrors({ ...errors, startDate: '' });
                  }}
                  className={`w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${
                    errors.startDate ? 'border-rose-400' : 'border-neutral-300'
                  }`}
                />
                {errors.startDate && <p className="text-xs text-rose-600 mt-1">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data de Conclusão <span className="text-rose-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={targetEndDate}
                  onChange={(e) => {
                    setTargetEndDate(e.target.value);
                    if (errors.targetEndDate) setErrors({ ...errors, targetEndDate: '' });
                  }}
                  className={`w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${
                    errors.targetEndDate ? 'border-rose-400' : 'border-neutral-300'
                  }`}
                />
                {errors.targetEndDate && <p className="text-xs text-rose-600 mt-1">{errors.targetEndDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Fase Atual
                </label>
                <select
                  value={currentPhase}
                  onChange={(e) => setCurrentPhase(e.target.value as ArchitecturePhase)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                >
                  {ARCHITECTURE_PHASES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.shortName} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Prioridade na Esteira
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                  className="w-full px-3 py-2 text-sm font-bold border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                >
                  <option value="p1_urgente">🔴 P1 - Urgente</option>
                  <option value="p2_alta">🟠 P2 - Alta</option>
                  <option value="p3_media">🔵 P3 - Normal</option>
                  <option value="p4_baixa">⚪ P4 - Standby</option>
                </select>
              </div>
            </div>
          </div>

          {/* EQUIPE ALOCADA NO PROJETO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-500" />
                Equipe Designada para Este Projeto ({selectedTeamMemberIds.length} selecionados)
              </label>
            </div>
            <p className="text-xs text-neutral-500 mb-2.5">
              Selecione os arquitetos, coordenadores e modeladores que farão parte deste projeto corporativo:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {allTeamMembers.map((member, idx) => {
                const isSelected = selectedTeamMemberIds.includes(member.id);
                return (
                  <div
                    key={`${member.id}-${idx}`}
                    onClick={() => toggleTeamMember(member.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'border-stone-900 bg-stone-50/80'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div
                      className="w-4 h-4 text-stone-900 rounded border-neutral-300 pointer-events-none"
                    />
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold ${member.avatarColor}`}>
                      {member.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-neutral-900 truncate">{member.name}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{member.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Briefing and Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              Briefing / Descrição do Projeto
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as premissas de projeto, áreas de colaboração, normas do condomínio ou requisitos de TI e acústica..."
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
            />
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
              {projectToEdit ? 'Salvar Alterações' : 'Criar Projeto Corporativo'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
