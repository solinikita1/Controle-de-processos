import React, { useState, useRef, useEffect } from 'react';
import { Project, AuthUser } from '../types';
import { Plus, Download, RotateCcw, ChevronDown, CheckCircle2, User, Database, ShieldCheck, Sparkles, LogOut, Users, ExternalLink } from 'lucide-react';
import { WorkplaceLogo } from './WorkplaceLogo';

interface HeaderProps {
  currentView: 'overview' | 'project' | 'team' | 'timeline' | 'my_tasks' | 'esteira' | 'reports';
  onNavigate: (view: 'overview' | 'project' | 'team' | 'timeline' | 'my_tasks' | 'esteira' | 'reports') => void;
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onExportData: () => void;
  onOpenBackupModal: () => void;
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
  teamCount?: number;
  cloudConnected?: boolean;
  backupCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  projects,
  selectedProjectId,
  onSelectProject,
  onNewProject,
  onExportData,
  onOpenBackupModal,
  currentUser,
  onOpenAuthModal,
  onLogout,
  teamCount,
  cloudConnected,
  backupCount = 0,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const briefingCount = projects.filter(
    (p) => !p.isArchived && (p.currentPhase === 'captacao_briefing' || p.status === 'briefing')
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* Zone 1: Office branding */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            title="Workplace Arquitetura Corporativa - Ir para Visão Geral"
            className="flex items-center text-left group hover:opacity-95 transition-opacity"
          >
            <WorkplaceLogo variant="horizontal" height={36} theme="light" />
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav aria-label="Navegação principal" className="order-3 w-full min-w-0 flex overflow-x-auto items-center gap-5 py-2 text-xs font-semibold text-neutral-600">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'overview' ? 'text-stone-900 font-bold border-b-2 border-stone-900 pb-0.5' : 'hover:text-stone-900'
            }`}
          >
            Visão Geral
          </button>

          {/* Esteira & Briefings Link */}
          <button
            type="button"
            onClick={() => onNavigate('esteira')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              currentView === 'esteira' ? 'text-amber-700 font-bold border-b-2 border-amber-600 pb-0.5' : 'text-neutral-700 hover:text-amber-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>Esteira & Briefings</span>
            {briefingCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {briefingCount}
              </span>
            )}
          </button>

          {/* My Tasks link if user is logged in */}
          {currentUser && (
            <button
              type="button"
              onClick={() => onNavigate('my_tasks')}
              className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 ${
                currentView === 'my_tasks' ? 'text-amber-800 font-bold border-b-2 border-amber-600 pb-0.5' : 'text-neutral-700 hover:text-amber-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              Minhas Tarefas
            </button>
          )}

          {/* Project Dropdown / Link */}
          <div className="relative flex items-center gap-1.5">
            <span className="text-neutral-300">/</span>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  onSelectProject(e.target.value);
                  onNavigate('project');
                } else {
                  onNavigate('overview');
                }
              }}
              className="text-xs font-medium text-neutral-800 bg-transparent hover:text-stone-900 border-none focus:outline-hidden cursor-pointer max-w-[200px] truncate"
            >
              <option value="">Selecione o Projeto...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isArchived ? `📦 [Arq] ${p.code} - ${p.name}` : `${p.code} - ${p.name}`}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('timeline')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'timeline' ? 'text-stone-900 font-bold border-b-2 border-stone-900 pb-0.5' : 'hover:text-stone-900'
            }`}
          >
            Cronograma Integrado
          </button>

          {/* Reports & Analytics View (Monday.com style) */}
          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 ${
              currentView === 'reports' ? 'text-emerald-800 font-bold border-b-2 border-emerald-600 pb-0.5' : 'text-neutral-700 hover:text-emerald-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Relatórios & SLA</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('team')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'team' ? 'text-stone-900 font-bold border-b-2 border-stone-900 pb-0.5' : 'hover:text-stone-900'
            }`}
          >
            Equipe ({teamCount || 18})
          </button>
        </nav>

        {/* Zone 3: Microsoft User Account & Actions */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2.5 min-w-0">
          
          {/* Cloud Sync Status (Firebase Firestore) */}
          <div
            title={cloudConnected ? "Banco em Nuvem Ativo: Sincronização em tempo real (Firebase Firestore)" : "Conectando ao banco em nuvem..."}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
              cloudConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{cloudConnected ? 'Nuvem Ativa' : 'Conectando...'}</span>
          </div>

          {/* Microsoft Auth Badge / Profile Button & Interactive Dropdown */}
          {currentUser ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 transition-all text-left shadow-2xs group cursor-pointer"
                aria-expanded={isProfileMenuOpen}
              >
                {/* Microsoft tiny indicator */}
                <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5 shrink-0">
                  <div className="bg-[#f25022] rounded-3xs" />
                  <div className="bg-[#7fba00] rounded-3xs" />
                  <div className="bg-[#00a4ef] rounded-3xs" />
                  <div className="bg-[#ffb900] rounded-3xs" />
                </div>

                {/* Avatar circle */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${currentUser.avatarColor || 'bg-amber-600 text-white'}`}>
                  {currentUser.initials || 'WP'}
                </div>

                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-neutral-900 group-hover:text-stone-800">
                      {currentUser.name}
                    </span>
                    {currentUser.isDirector && (
                      <span className="px-1 text-[9px] font-bold bg-amber-100 text-amber-800 rounded-xs uppercase">
                        {currentUser.role?.includes('CEO') ? 'CEO' : currentUser.role?.includes('CSO') ? 'CSO' : 'Diretoria'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {(currentUser.email || '').split('@')[0]}@workplace
                  </span>
                </div>

                <ChevronDown className={`w-3 h-3 text-neutral-400 ml-0.5 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180 text-neutral-800' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="fixed left-3 right-3 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-full mt-2 w-auto sm:w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Card */}
                  <div className="p-3.5 bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-xl mb-1.5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${currentUser.avatarColor || 'bg-amber-600 text-white'}`}>
                        {currentUser.initials || 'WP'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate">{currentUser.name}</h4>
                        </div>
                        <p className="text-[11px] text-stone-300 truncate">{currentUser.role}</p>
                        <p className="text-[10px] text-stone-400 font-mono truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    {/* Creator Badge for Solimar Isaac */}
                    {(currentUser.id === 'team-soli' || (currentUser.name && currentUser.name.toLowerCase().includes('soli'))) && (
                      <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center gap-1.5 text-[10px] font-bold text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Criadora & Desenvolvedora da Plataforma</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Links */}
                  <div className="space-y-0.5 text-xs text-neutral-700">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('my_tasks');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-neutral-100 flex items-center justify-between text-left transition-colors font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        <span>Minhas Tarefas & Entregas</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">Abrir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-neutral-100 flex items-center justify-between text-left transition-colors font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-neutral-600" />
                        <span>Alternar Colaborador (Entra ID)</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">20 Perfis</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenBackupModal();
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-neutral-100 flex items-center justify-between text-left transition-colors font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Central de Backup na Nuvem</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono font-bold">Ativo</span>
                    </button>

                    <div className="my-1 border-t border-neutral-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 flex items-center gap-2.5 text-left transition-colors font-bold"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Encerrar Sessão Corporativa</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold transition-all shadow-2xs"
            >
              <div className="w-3.5 h-3.5 grid grid-cols-2 gap-0.5 shrink-0">
                <div className="bg-[#f25022] rounded-3xs" />
                <div className="bg-[#7fba00] rounded-3xs" />
                <div className="bg-[#00a4ef] rounded-3xs" />
                <div className="bg-[#ffb900] rounded-3xs" />
              </div>
              <span>Entrar com Microsoft</span>
            </button>
          )}

          {/* Central de Backup & Restauração Button */}
          <button
            type="button"
            onClick={onOpenBackupModal}
            title="Central de Backup & Restauração na Nuvem (Snapshots e JSON)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 text-xs font-bold transition-all shadow-2xs group"
          >
            <Database className="w-3.5 h-3.5 text-amber-600 shrink-0 group-hover:scale-105 transition-transform" />
            <span className="inline">Backup</span>
            {backupCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-extrabold rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                {backupCount}
              </span>
            )}
          </button>

          {/* Backup export direct download */}
          <button
            type="button"
            onClick={onExportData}
            title="Download imediato de Backup JSON"
            aria-label="Exportar dados do escritório (Backup JSON)"
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* + Novo Projeto Button (only enabled for directors or coordinates, or opens modal) */}
          <button
            type="button"
            onClick={onNewProject}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Novo Projeto</span>
            <span className="sm:hidden">+ Projeto</span>
          </button>
        </div>

      </div>
    </header>
  );
};
