import React, { useState, useEffect } from 'react';
import { Project, TeamMember, ProjectPriority, PipelineStage, ProjectBriefing, NegotiationModel } from '../types';
import { getTodayDateString, addDays } from '../utils/dateUtils';
import {
  X,
  FileText,
  FolderOpen,
  Calendar,
  AlertTriangle,
  Users,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Mail,
  Phone,
  Briefcase,
  Handshake,
  ShieldCheck,
  Info
} from 'lucide-react';

interface BriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  projectToEdit?: Project | null;
  allTeamMembers: TeamMember[];
  currentUser?: { id: string; name: string; role: string } | null;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  allTeamMembers,
  currentUser,
}) => {
  // Project Core
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('São Paulo - SP');
  const [areaM2, setAreaM2] = useState<number | string>(1800);
  const [typology, setTypology] = useState<Project['typology']>('Escritório Corporativo');
  const [priority, setPriority] = useState<ProjectPriority>('p2_alta');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('briefing_concluido');

  // Intake & Briefing Log
  const [entryDate, setEntryDate] = useState('');
  const [submittedAtTime, setSubmittedAtTime] = useState('');
  const [headMemberId, setHeadMemberId] = useState('');
  const [folderUrl, setFolderUrl] = useState('');

  // Client Corporate Contact
  const [clientContactPerson, setClientContactPerson] = useState('');
  const [clientContactEmail, setClientContactEmail] = useState('');
  const [clientContactPhone, setClientContactPhone] = useState('');
  const [clientContactRole, setClientContactRole] = useState('');

  // Negotiation & Commercial Model (BTS / CAPEX / Turnkey)
  const [negotiationModel, setNegotiationModel] = useState<NegotiationModel>('bts');
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  // Program of needs (Corporate Workplace)
  const [workstations, setWorkstations] = useState<number | string>(120);
  const [meetingRooms, setMeetingRooms] = useState<number | string>(8);
  const [focusPods, setFocusPods] = useState<number | string>(4);
  const [specialRooms, setSpecialRooms] = useState('');
  const [hasServerRoom, setHasServerRoom] = useState(true);
  const [expansionForecast, setExpansionForecast] = useState('15% em 1 ano');

  // Corporate Wellness Area
  const [hasWellnessArea, setHasWellnessArea] = useState(true);
  const [wellnessDetails, setWellnessDetails] = useState('');

  // Critical Premises & Schedule
  const [premisesAndAlerts, setPremissesAndAlerts] = useState('');
  const [targetKickoffDate, setTargetKickoffDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [commercialObservations, setCommercialObservations] = useState('');
  const [readyForDesignTeam, setReadyForDesignTeam] = useState(true);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Filter commercial heads or directors
  const commercialHeads = allTeamMembers.filter(
    (m) =>
      m.role.includes('Negócios') ||
      m.role.includes('Comercial') ||
      m.role.includes('CSO') ||
      m.role.includes('CEO') ||
      m.department === 'Negócios' ||
      m.department === 'Comercial' ||
      m.department === 'Diretoria'
  );

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setClient(projectToEdit.client);
      setLocation(projectToEdit.location);
      setAreaM2(projectToEdit.areaM2);
      setTypology(projectToEdit.typology);
      setPriority(projectToEdit.priority || 'p2_alta');
      setPipelineStage(projectToEdit.pipelineStage || 'desenvolvimento_ativo');
      setEntryDate(projectToEdit.entryDate || projectToEdit.createdAt.split('T')[0]);

      if (projectToEdit.briefing) {
        const b = projectToEdit.briefing;
        setSubmittedAtTime(b.submittedAt);
        setHeadMemberId(b.submittedByMemberId);
        setFolderUrl(b.documentsFolderUrl);

        // Contact
        setClientContactPerson(b.clientContactPerson || '');
        setClientContactEmail(b.clientContactEmail || '');
        setClientContactPhone(b.clientContactPhone || '');
        setClientContactRole(b.clientContactRole || '');

        // Negotiation
        setNegotiationModel(b.negotiationModel || 'bts');
        setNegotiationNotes(b.negotiationNotes || '');
        setBudgetRange(b.estimatedBudgetRange || '');

        // Program of needs
        setWorkstations(b.programOfNeeds.workstations || '');
        setMeetingRooms(b.programOfNeeds.meetingRooms || '');
        setFocusPods(b.programOfNeeds.focusPods || '');
        setSpecialRooms(b.programOfNeeds.specialRooms || '');
        setHasServerRoom(b.programOfNeeds.hasServerRoom ?? true);
        setExpansionForecast(b.programOfNeeds.expansionForecast || '');

        // Wellness
        setHasWellnessArea(b.programOfNeeds.hasWellnessArea ?? true);
        setWellnessDetails(b.programOfNeeds.wellnessDetails || '');

        // Premises & Dates
        setPremissesAndAlerts(b.premisesAndAlerts || '');
        setTargetKickoffDate(b.targetKickoffDate || projectToEdit.startDate);
        setTargetEndDate(projectToEdit.targetEndDate);
        setCommercialObservations(b.commercialObservations || '');
        setReadyForDesignTeam(b.readyForDesignTeam ?? true);
      } else {
        setTargetKickoffDate(projectToEdit.startDate);
        setTargetEndDate(projectToEdit.targetEndDate);
        setSubmittedAtTime(`${getTodayDateString()} 10:00`);
        setHeadMemberId(commercialHeads[0]?.id || 'team-leonardo');
        setFolderUrl(`https://workplace.sharepoint.com/sites/projetos/2026/${projectToEdit.code}`);
        setNegotiationModel('capex_direto');
        setHasWellnessArea(true);
        setWellnessDetails('Espaço de descompressão integrado, biofilia ativa e sala de descanso.');
      }
      setErrors({});
    } else {
      // New incoming demand from commercial
      const today = getTodayDateString();
      const kickoff = addDays(today, 7);
      const delivery = addDays(today, 120);

      const defaultHead =
        currentUser && (currentUser.role.includes('Negócios') || currentUser.role.includes('Comercial') || currentUser.role.includes('CSO'))
          ? currentUser.id
          : commercialHeads.find((m) => m.name.includes('Leonardo'))?.id || commercialHeads[0]?.id || 'team-leonardo';

      const randomCode = `CORP-2026-${String(Math.floor(Math.random() * 90) + 10)}`;

      setName('');
      setClient('');
      setLocation('São Paulo - SP');
      setAreaM2(1800);
      setTypology('Escritório Corporativo');
      setPriority('p2_alta');
      setPipelineStage('briefing_concluido');
      setEntryDate(today);
      setSubmittedAtTime(`${today} 09:30`);
      setHeadMemberId(defaultHead);
      setFolderUrl(`https://workplace.sharepoint.com/sites/projetos/2026/${randomCode}`);

      // Default contact
      setClientContactPerson('');
      setClientContactEmail('');
      setClientContactPhone('');
      setClientContactRole('Head de Facilities & Real Estate');

      // Default negotiation
      setNegotiationModel('bts');
      setNegotiationNotes('Contrato Built to Suit (BTS) com locação de longo prazo via Fundo Imobiliário.');
      setBudgetRange('R$ 2.500.000 a R$ 3.200.000 (CAPEX Previsto)');

      // Default program
      setWorkstations(140);
      setMeetingRooms(8);
      setFocusPods(6);
      setSpecialRooms('Diretoria acústica, cafeteria colaborativa, estúdio para gravação e auditório flexível');
      setHasServerRoom(true);
      setExpansionForecast('15% a 20% em 18 meses');

      // Default wellness
      setHasWellnessArea(true);
      setWellnessDetails('Espaço Wellness Corporativo: sala de descompressão acústica, biofilia ativa, espaço lactário/maternidade e vestiários privativos para mobilidade ativa (bicicletas).');

      setPremissesAndAlerts('Piso elevado existente de 12cm para cabeamento estruturado Cat6A. Isolamento acústico obrigatório entre diretoria e open space (Rw mínimo de 50 dB). Horários de condomínio com restrição noturna.');
      setTargetKickoffDate(kickoff);
      setTargetEndDate(delivery);
      setCommercialObservations('Demanda corporativa captada pelo Comercial Workplace. Arquivos cadastrais e plantas DWG salvas na pasta da rede.');
      setReadyForDesignTeam(true);
      setErrors({});
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'O nome do projeto/sede corporativa é obrigatório.';
    if (!client.trim()) newErrors.client = 'A razão social ou nome do cliente corporativo é obrigatório.';
    if (!entryDate) newErrors.entryDate = 'A data de entrada da demanda é obrigatória.';
    if (!folderUrl.trim()) newErrors.folderUrl = 'O link ou caminho da pasta de documentos é obrigatório.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedHead = allTeamMembers.find((m) => m.id === headMemberId) || allTeamMembers[0];
    const headLabel = `${selectedHead.name} (${selectedHead.role})`;

    const briefingPayload: ProjectBriefing = {
      submittedAt: submittedAtTime.trim() || `${entryDate} 10:00`,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      submittedByMemberId: headMemberId,
      submittedByName: headLabel,
      documentsFolderUrl: folderUrl.trim(),

      // Contact info
      clientContactPerson: clientContactPerson.trim() || undefined,
      clientContactEmail: clientContactEmail.trim() || undefined,
      clientContactPhone: clientContactPhone.trim() || undefined,
      clientContactRole: clientContactRole.trim() || undefined,

      // Negotiation model
      negotiationModel,
      negotiationNotes: negotiationNotes.trim() || undefined,
      estimatedBudgetRange: budgetRange.trim() || undefined,

      // Program of needs
      programOfNeeds: {
        workstations: Number(workstations) || 0,
        meetingRooms: Number(meetingRooms) || 0,
        focusPods: Number(focusPods) || 0,
        specialRooms: specialRooms.trim() || undefined,
        hasServerRoom,
        expansionForecast: expansionForecast.trim() || undefined,
        hasWellnessArea,
        wellnessDetails: hasWellnessArea ? wellnessDetails.trim() || undefined : undefined,
      },

      premisesAndAlerts: premisesAndAlerts.trim(),
      targetKickoffDate: targetKickoffDate || entryDate,
      clientDeadlines: targetEndDate ? `Inauguração corporativa até ${targetEndDate}` : 'A definir',
      commercialObservations: commercialObservations.trim() || undefined,
      readyForDesignTeam,
    };

    let updatedPhase = projectToEdit ? projectToEdit.currentPhase : ('captacao_briefing' as const);
    let updatedStatus = projectToEdit ? projectToEdit.status : ('briefing' as const);

    const updatedProject: Project = {
      id: projectToEdit ? projectToEdit.id : `proj-${Date.now()}`,
      code: projectToEdit ? projectToEdit.code : `CORP-2026-${String(Math.floor(Math.random() * 90) + 10)}`,
      name: name.trim(),
      client: client.trim(),
      location: location.trim() || 'São Paulo - SP',
      areaM2: Number(areaM2) || 0,
      typology,
      description: `Projeto de arquitetura corporativa para ${client.trim()} com ${workstations} postos de trabalho, ${meetingRooms} salas acústicas${hasWellnessArea ? ' e Área Wellness' : ''}. Modalidade: ${negotiationModel.toUpperCase()}.`,
      status: updatedStatus,
      currentPhase: updatedPhase,
      priority,
      pipelineStage,
      pipelineOrder: projectToEdit?.pipelineOrder || 1,
      entryDate,
      startDate: targetKickoffDate || entryDate,
      targetEndDate: targetEndDate || addDays(entryDate, 90),
      teamMemberIds: Array.from(new Set(projectToEdit?.teamMemberIds || [headMemberId, 'team-soli'])).filter(Boolean),
      createdAt: projectToEdit?.createdAt || new Date().toISOString(),
      notes: commercialObservations.trim() || undefined,
      briefing: briefingPayload,
    };

    onSave(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white border border-neutral-200 rounded-2xl shadow-2xl my-6 overflow-hidden text-neutral-900 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Commercial Ribbon */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600/90 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {projectToEdit ? 'Editar Briefing Corporativo & Entrada da Demanda' : 'Entrada de Nova Demanda Comercial (Briefing Corporativo)'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-full uppercase">
                  Exclusivo Arquitetura Corporativa
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Workplace Arquitetura · Repositório central de dados para os arquitetos do projeto conceitual.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corporate Notice Strip */}
        <div className="px-6 py-2.5 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Foco Corporativo:</strong> Todas as informações inseridas orientarão o dimensionamento espacial, densidade de postos, acústica e áreas wellness.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Workplace SP
          </span>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          
          {/* SECTION 1: ENTRADA & RASTREAMENTO DA DEMANDA COMERCIAL */}
          <div className="p-4 rounded-xl bg-pink-50/40 border border-pink-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-pink-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Clock className="w-4 h-4 text-pink-600" />
                1. Rastreamento da Entrada Comercial (Head Responsável)
              </h4>
              <span className="text-[10px] text-pink-700 font-semibold bg-pink-100 px-2 py-0.5 rounded-md">
                Registro de Auditoria & Origem
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Head Comercial / Negócios *
                </label>
                <select
                  value={headMemberId}
                  onChange={(e) => setHeadMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                >
                  {commercialHeads.map((m, idx) => (
                    <option key={`head-opt-${m.id}-${idx}`} value={m.id}>
                      {m.name} — {m.role}
                    </option>
                  ))}
                  {allTeamMembers
                    .filter((m) => !commercialHeads.some((ch) => ch.id === m.id))
                    .map((m, idx) => (
                      <option key={`arch-opt-${m.id}-${idx}`} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Data de Entrada da Demanda *
                </label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
                {errors.entryDate && <p className="text-rose-600 mt-1">{errors.entryDate}</p>}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Registro Exato (Data e Hora)
                </label>
                <input
                  type="text"
                  placeholder="AAAA-MM-DD HH:MM"
                  value={submittedAtTime}
                  onChange={(e) => setSubmittedAtTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
                <span className="text-[10px] text-neutral-400">Ex: 2026-10-21 14:30</span>
              </div>
            </div>

            {/* Pasta Oficial de Documentos */}
            <div>
              <label className="block font-semibold text-neutral-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  Pasta de Documentos da Demanda (SharePoint / OneDrive / Servidor) *
                </span>
                <span className="text-[10px] font-normal text-neutral-500">
                  Onde o Head armazena plantas DWG, fotos, manual predial e levantamentos
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="https://workplace.sharepoint.com/... ou X:/Projetos/2026/Sede-Cliente"
                  value={folderUrl}
                  onChange={(e) => setFolderUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
                {folderUrl && (
                  <a
                    href={folderUrl.startsWith('http') ? folderUrl : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg font-medium flex items-center gap-1 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-600" />
                    Testar Link
                  </a>
                )}
              </div>
              {errors.folderUrl && <p className="text-rose-600 mt-1">{errors.folderUrl}</p>}
            </div>
          </div>

          {/* SECTION 2: PONTO DE CONTATO NO CLIENTE CORPORATIVO */}
          <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-blue-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Users className="w-4 h-4 text-blue-600" />
                2. Ponto de Contato & Interlocutores no Cliente Corporativo
              </h4>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-md">
                Facilities, Real Estate & Diretoria
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-neutral-500" />
                  Nome do Ponto de Contato
                </label>
                <input
                  type="text"
                  placeholder="Ex: Roberto Albuquerque"
                  value={clientContactPerson}
                  onChange={(e) => setClientContactPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Cargo / Departamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Head of Facilities & Real Estate"
                  value={clientContactRole}
                  onChange={(e) => setClientContactRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-500" />
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  placeholder="contato@cliente.com.br"
                  value={clientContactEmail}
                  onChange={(e) => setClientContactEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-neutral-500" />
                  Telefone / WhatsApp Direto
                </label>
                <input
                  type="text"
                  placeholder="(11) 98888-7777"
                  value={clientContactPhone}
                  onChange={(e) => setClientContactPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: OFERTA & MODELO DE NEGOCIAÇÃO (BTS, CAPEX, TURNKEY) */}
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Handshake className="w-4 h-4 text-emerald-600" />
                3. Oferta da Negociação & Modelo de Contratação Corporativa
              </h4>
              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-md">
                BTS, CAPEX Direto, Turnkey ou Gestão
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Modelo da Negociação Comercial *
                </label>
                <select
                  value={negotiationModel}
                  onChange={(e) => setNegotiationModel(e.target.value as NegotiationModel)}
                  className="w-full px-3 py-2.5 text-xs font-bold border border-emerald-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                >
                  <option value="bts">🏢 BTS (Built to Suit) — Obra sob medida via Fundo / Locador com contrato atípico</option>
                  <option value="capex_direto">💰 CAPEX Direto do Cliente — Investimento próprio corporativo aprovado em conselho</option>
                  <option value="turnkey">🔑 Turnkey / Preço Fechado — Projeto de arquitetura + Obra e marcenaria integradas</option>
                  <option value="taxa_administracao">📊 Taxa de Administração (Cost-Plus) — Gestão de implantação com fee percentual</option>
                  <option value="projeto_arquitetura">📐 Escopo Fechado de Arquitetura — Projeto executivo e coordenação de complementares</option>
                  <option value="outro">📝 Outro modelo personalizado</option>
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {negotiationModel === 'bts' && 'No modelo Built to Suit, a arquitetura deve atender tanto aos requisitos do cliente final quanto às exigências técnicas do proprietário/fundo imobiliário.'}
                  {negotiationModel === 'capex_direto' && 'No modelo de Capex Direto, o cliente possui verba própria alocada e requer relatórios executivos rígidos de SLA e avanço físico.'}
                  {negotiationModel === 'turnkey' && 'No modelo Turnkey, a Workplace garante preço global fechado e entrega chave na mão com fiscalização total de materiais e acabamentos.'}
                  {negotiationModel === 'taxa_administracao' && 'Na administração Cost-Plus, as compras e concorrências são validadas de forma aberta com a diretoria do cliente.'}
                  {negotiationModel === 'projeto_arquitetura' && 'Contratação focada no desenvolvimento completo do projeto executivo, detalhamento e compatibilização BIM.'}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Faixa de Investimento Estimada (CAPEX do Cliente)
                </label>
                <input
                  type="text"
                  placeholder="Ex: R$ 2.800.000 a R$ 3.500.000 (R$ 1.800/m²)"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Ajuda os arquitetos a calibrar as especificações de carpete, marcenaria e iluminação dentro da verba.
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Condições da Oferta Comercial & Notas de Negociação
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Proposta com carência de 3 meses para reforma estrutural; disputa com outra concorrência; pagamento atrelado a marcos de aprovação do projeto executivo..."
                value={negotiationNotes}
                onChange={(e) => setNegotiationNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* SECTION 4: ENCAIXE NA ESTEIRA & CLASSIFICAÇÃO DE PRIORIDADE */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-neutral-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                4. Encaixe na Esteira & Classificação de Prioridade
              </h4>
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-md">
                Evita perda de projetos e desvios na fila
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Classificação de Prioridade *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                  className="w-full px-3 py-2 text-xs font-bold border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="p1_urgente">🔴 P1 - Urgente / Estratégico (Início imediato)</option>
                  <option value="p2_alta">🟠 P2 - Alta Prioridade (Contrato assinado)</option>
                  <option value="p3_media">🔵 P3 - Média / Normal (Fila cronológica)</option>
                  <option value="p4_baixa">⚪ P4 - Standby / Backlog comercial</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  Data de Kickoff na Esteira *
                </label>
                <input
                  type="date"
                  required
                  value={targetKickoffDate}
                  onChange={(e) => setTargetKickoffDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
                <span className="text-[10px] text-neutral-500">Quando a criação arquitetônica começa</span>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  Prazo Final Inegociável (Cliente) *
                </label>
                <input
                  type="date"
                  required
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
                <span className="text-[10px] text-neutral-500">Data de entrega/mudança do cliente</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="readyCheck"
                  checked={readyForDesignTeam}
                  onChange={(e) => setReadyForDesignTeam(e.target.checked)}
                  className="w-4 h-4 text-stone-900 rounded-sm focus:ring-stone-400 cursor-pointer"
                />
                <label htmlFor="readyCheck" className="cursor-pointer font-bold text-neutral-900">
                  Briefing Completo e Liberado para a Equipe de Criação (Conceitual)
                </label>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${readyForDesignTeam ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
                {readyForDesignTeam ? 'Liberado para os Arquitetos' : 'Em Elaboração Comercial'}
              </span>
            </div>
          </div>

          {/* SECTION 5: DADOS GERAIS DO IMÓVEL CORPORATIVO */}
          <div className="space-y-4">
            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Building2 className="w-4 h-4 text-stone-700" />
              5. Dados Gerais da Sede & Imóvel Corporativo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Nome do Projeto / Identificação da Sede *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sede Corporativa Pinheiros - Omni Logística"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
                {errors.name && <p className="text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Cliente / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Omni Logística e Soluções Globais S.A."
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
                {errors.client && <p className="text-rose-600 mt-1">{errors.client}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Endereço / Edifício Corporativo
                </label>
                <input
                  type="text"
                  placeholder="Rua Butantã, 468 - 14º andar, Pinheiros, SP"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Área Total de Arquitetura (m²) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={areaM2}
                  onChange={(e) => setAreaM2(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Tipologia Corporativa
                </label>
                <select
                  value={typology}
                  onChange={(e) => setTypology(e.target.value as Project['typology'])}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                >
                  <option value="Escritório Corporativo">Escritório Corporativo (Laje Comercial)</option>
                  <option value="Sede Institucional">Sede Institucional / Edifício Monousuário</option>
                  <option value="Hub de Inovação">Hub de Inovação / Tech Lab</option>
                  <option value="Coworking">Coworking / Espaço Multiuso</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 6: PROGRAMA DE NECESSIDADES & ÁREA WELLNESS */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-neutral-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Sparkles className="w-4 h-4 text-violet-600" />
                6. Programa de Necessidades & Dimensionamento Espacial
              </h4>
              <span className="text-[10px] text-violet-800 font-semibold bg-violet-100 px-2 py-0.5 rounded-md">
                Parâmetros para o Time de Criação
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Postos de Trabalho (Open Space)
                </label>
                <input
                  type="number"
                  min={0}
                  value={workstations}
                  onChange={(e) => setWorkstations(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Salas de Reunião Acústicas
                </label>
                <input
                  type="number"
                  min={0}
                  value={meetingRooms}
                  onChange={(e) => setMeetingRooms(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Cabines de Foco / Phone Booths
                </label>
                <input
                  type="number"
                  min={0}
                  value={focusPods}
                  onChange={(e) => setFocusPods(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Previsão de Crescimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: 20% em 18 meses"
                  value={expansionForecast}
                  onChange={(e) => setExpansionForecast(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>
            </div>

            {/* DESTAQUE: ÁREA WELLNESS & BEM-ESTAR CORPORATIVO */}
            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="wellnessCheck"
                    checked={hasWellnessArea}
                    onChange={(e) => setHasWellnessArea(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-400 cursor-pointer"
                  />
                  <label htmlFor="wellnessCheck" className="cursor-pointer font-bold text-rose-950 flex items-center gap-1.5 text-xs">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    O projeto corporativo contempla Área Wellness & Saúde dos Colaboradores?
                  </label>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasWellnessArea ? 'bg-rose-100 text-rose-800' : 'bg-neutral-100 text-neutral-500'}`}>
                  {hasWellnessArea ? 'Wellness Ativo' : 'Não Solicitado'}
                </span>
              </div>

              {hasWellnessArea && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Especificações dos Ambientes Wellness no Escritório:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Sala de descompressão com isolamento acústico, espaço para quick massage, espaço de amamentação / lactário, biofilia ativa nas estações, vestiários com chuveiro e bicicletário para ciclistas..."
                    value={wellnessDetails}
                    onChange={(e) => setWellnessDetails(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Ambientes Especiais Adicionais
              </label>
              <input
                type="text"
                placeholder="Ex: Estúdio de gravação de podcast, Diretoria acústica, Auditório para 80 pax, Cafeteria gourmet"
                value={specialRooms}
                onChange={(e) => setSpecialRooms(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="serverRoomCheck"
                checked={hasServerRoom}
                onChange={(e) => setHasServerRoom(e.target.checked)}
                className="w-4 h-4 text-stone-900 rounded-sm focus:ring-stone-400 cursor-pointer"
              />
              <label htmlFor="serverRoomCheck" className="font-semibold text-neutral-800 cursor-pointer">
                Exige Sala de TI Dedicada (Data Center / Rack Climatizado com Gás FM-200)
              </label>
            </div>
          </div>

          {/* SECTION 7: PREMISSAS CRÍTICAS & OBSERVAÇÕES COMERCIAIS */}
          <div className="space-y-4">
            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              7. Premissas Críticas, Restrições & Alertas do Head
            </h4>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Premissas do Condomínio & Restrições Construtivas *
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Horários restritos de obra, capacidade de carga da laje, isolamento acústico obrigatório entre diretoria e open space, exigência de certificação LEED, piso elevado de 15cm..."
                value={premisesAndAlerts}
                onChange={(e) => setPremissesAndAlerts(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Notas Estratégicas do Comercial
              </label>
              <input
                type="text"
                placeholder="Ex: Contrato fechado via indicação corporativa; cliente valoriza iluminação circadiana e cafeteria ampla."
                value={commercialObservations}
                onChange={(e) => setCommercialObservations(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                As informações ficarão salvas na aba <strong>Briefing</strong> e nos relatórios executivos.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 sm:w-auto px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 sm:w-auto px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{projectToEdit ? 'Salvar Briefing' : 'Encaixar na Esteira'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
