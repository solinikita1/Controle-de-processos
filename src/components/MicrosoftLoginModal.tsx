import React, { useState, useMemo } from 'react';
import { AuthUser, TeamMember } from '../types';
import { X, ShieldCheck, Check, KeyRound, Building2, UserCheck, AlertCircle, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import { WorkplaceLogo } from './WorkplaceLogo';

interface MicrosoftLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  teamMembers: TeamMember[];
  onLogin: (user: AuthUser) => void;
  onLogout: () => void;
}

export const MicrosoftLoginModal: React.FC<MicrosoftLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  teamMembers,
  onLogin,
  onLogout,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quick' | 'form' | 'azure_config'>('quick');
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Informe seu e-mail corporativo Microsoft.');
      return;
    }

    if (!cleanEmail.endsWith('@workplace.arq.br')) {
      setErrorMsg('Apenas contas corporativas @workplace.arq.br têm permissão de acesso.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Find matching employee
      const matched = teamMembers.find(
        (m) => m.email.toLowerCase() === cleanEmail
      );

      if (matched) {
        onLogin({
          id: matched.id,
          name: matched.name,
          email: matched.email,
          role: matched.role,
          initials: matched.initials,
          avatarColor: matched.avatarColor,
          department: matched.department,
          isDirector: matched.isDirector,
        });
        onClose();
      } else {
        // If employee is not in pre-registered list, create an active member profile
        const namePart = cleanEmail.split('@')[0].replace('.', ' ');
        const formattedName = namePart
          .split(' ')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');

        onLogin({
          id: `team-user-${Date.now()}`,
          name: formattedName,
          email: cleanEmail,
          role: 'Arquiteto(a) Colaborador(a)',
          initials: formattedName.slice(0, 2).toUpperCase(),
          avatarColor: 'bg-stone-700 text-white',
          department: 'Projetos',
          isDirector: false,
        });
        onClose();
      }
    }, 600);
  };

  const handleSelectQuickUser = (member: TeamMember) => {
    onLogin({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      initials: member.initials,
      avatarColor: member.avatarColor,
      department: member.department,
      isDirector: member.isDirector,
    });
    onClose();
  };

  const filteredMembers = useMemo<TeamMember[]>(() => {
    const list = (teamMembers || []).filter(
      (m) =>
        (m.name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (m.role || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (m.department || '').toLowerCase().includes(searchFilter.toLowerCase())
    );
    const seen = new Set<string>();
    return list.filter((m) => {
      if (!m || !m.id) return false;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [teamMembers, searchFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Microsoft Header Banner */}
        <div className="bg-neutral-900 text-white p-6 relative flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            {/* Workplace Logo */}
            <div className="h-10 px-3 py-1 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-center shadow-xs">
              <WorkplaceLogo variant="horizontal" theme="dark" height={30} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">Workplace Arquitetura</h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Microsoft 365 Entra ID
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Criado & Desenvolvido por <strong className="text-amber-400">Solimar Isaac</strong> · Autenticação Corporativa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Session Bar */}
        {currentUser && (
          <div className="bg-amber-50/80 border-b border-amber-200/60 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentUser.avatarColor}`}>
                {currentUser.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900">{currentUser.name}</span>
                  {currentUser.isDirector && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-200 text-amber-900 rounded-xs uppercase">
                      {currentUser.role?.includes('CEO') ? 'CEO' : currentUser.role?.includes('CSO') ? 'CSO' : 'Diretoria'}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-600">{currentUser.email || ''} · {currentUser.role || ''}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onLogout();
              }}
              className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-100/60 rounded-md transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Desconectar
            </button>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Equipe Cadastrada (20 Colaboradores)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'form'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Entrar com E-mail Microsoft
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('azure_config')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'azure_config'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Configuração Azure / Entra
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: QUICK COLLABORATOR SELECTOR */}
          {activeTab === 'quick' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Selecione seu perfil corporativo
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Clique em um colaborador para simular ou acessar sua conta oficial do escritório.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full">
                  @workplace.arq.br
                </span>
              </div>

              {/* Search filter */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Filtrar por nome, cargo ou departamento..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-stone-900 bg-white"
                />
              </div>

              {/* Grid of team members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredMembers.map((member, idx) => {
                  const isCurrent = currentUser?.id === member.id;
                  return (
                    <button
                      key={`${member.id}-${idx}`}
                      type="button"
                      onClick={() => handleSelectQuickUser(member)}
                      className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-400'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-xs ${member.avatarColor}`}
                        >
                          {member.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-900 truncate">
                              {member.name}
                            </span>
                            {member.id === 'team-soli' && (
                              <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-black bg-amber-400 text-stone-900 rounded-xs uppercase flex items-center gap-0.5 shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5" />
                                Criadora
                              </span>
                            )}
                            {member.isDirector && member.id !== 'team-soli' && (
                              <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-200 text-amber-900 rounded-xs uppercase">
                                {member.role?.includes('CEO') ? 'CEO' : member.role?.includes('CSO') ? 'CSO' : 'Diretoria'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 truncate">{member.role}</p>
                          <p className="text-[10px] text-neutral-400 truncate font-mono">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isCurrent ? (
                          <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white flex items-center justify-center transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DIRECT MICROSOFT SSO LOGIN FORM */}
          {activeTab === 'form' && (
            <div className="max-w-md mx-auto py-2">
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto grid grid-cols-2 gap-1.5 p-2 bg-neutral-100 rounded-xl mb-3">
                  <div className="bg-[#f25022] rounded-xs" />
                  <div className="bg-[#7fba00] rounded-xs" />
                  <div className="bg-[#00a4ef] rounded-xs" />
                  <div className="bg-[#ffb900] rounded-xs" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">
                  Entrar com conta corporativa Microsoft
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Utilize seu e-mail do domínio <strong>@workplace.arq.br</strong> associado ao Microsoft 365 / Teams.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCustomLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    E-mail Corporativo Microsoft
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ex: soli@workplace.arq.br ou thais@workplace.arq.br"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-stone-900 bg-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Obrigatório terminar com @workplace.arq.br
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Senha de Rede / Microsoft Authenticator
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-stone-900 bg-white"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Autenticação corporativa com suporte a MFA / 2FA Microsoft Authenticator.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Validar Acesso Microsoft 365
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: AZURE / ENTRA ID ENTERPRISE CONFIGURATION */}
          {activeTab === 'azure_config' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Status do Locatário Microsoft Entra ID
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-700 mt-3">
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Locatário / Tenant</span>
                    <span className="font-mono font-bold text-neutral-900">workplace.arq.br</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Protocolo SSO</span>
                    <span className="font-mono font-bold text-emerald-700">OpenID Connect / OAuth2 (PKCE)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Usuários Ativos</span>
                    <span className="font-bold text-neutral-900">20 Colaboradores Sincronizados</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Diretoria Titular</span>
                    <span className="font-bold text-amber-700">Soli (soli@workplace.arq.br)</span>
                  </div>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 bg-white">
                <h4 className="text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-neutral-700" />
                  Como funciona o Acesso dos Funcionários?
                </h4>
                <ul className="text-xs text-neutral-600 space-y-2 list-disc pl-5">
                  <li>
                    <strong>Soli (Diretoria):</strong> Tem controle total para adicionar projetos novos, definir equipes, orçamentos, aprovar fases e emitir RRT.
                  </li>
                  <li>
                    <strong>Coordenadores (Thais, Monica):</strong> Podem gerenciar cronogramas, delegar tarefas e atualizar status executivos.
                  </li>
                  <li>
                    <strong>Arquitetos e Modeladores BIM:</strong> Ao entrarem com seus e-mails institucionais, a aba <em>"Minhas Tarefas"</em> filtra diretamente o trabalho que cabe a cada um deles nos projetos da Faria Lima, Paulista, Berrini e Vila Olímpia.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-6 py-3 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ambiente Corporativo Seguro · Workplace Arquitetura</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
