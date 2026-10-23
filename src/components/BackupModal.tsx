import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  CloudDownload,
  CloudUpload,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  FileJson,
  Layers,
  Users,
  CheckSquare,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FolderLock
} from 'lucide-react';
import { Project, Task, TeamMember, AuthUser, BackupSnapshot, BackupPayload } from '../types';
import {
  createBackupPayload,
  downloadJsonFile,
  validateBackupPayload
} from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  currentUser: AuthUser | null;
  cloudBackups: BackupSnapshot[];
  isCloudConnected: boolean;
  onCreateBackup: (name: string, description?: string) => Promise<void>;
  onRestoreBackup: (payload: BackupPayload, snapshotName: string) => Promise<void>;
  onDeleteBackup: (backupId: string) => Promise<void>;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  teamMembers,
  currentUser,
  cloudBackups,
  isCloudConnected,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'snapshots' | 'upload' | 'policy'>('create');
  
  // Creation form state
  const defaultBackupName = `Backup Completo Workplace - ${new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  
  const [backupName, setBackupName] = useState(defaultBackupName);
  const [backupDescription, setBackupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [operationError,setOperationError]=useState<string|null>(null);
  
  // Restore confirmation modal state
  const [pendingRestore, setPendingRestore] = useState<{
    payload: BackupPayload;
    name: string;
    source: 'cloud' | 'file';
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // File Upload State
  const [uploadedPayload, setUploadedPayload] = useState<BackupPayload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle immediate manual JSON download
  const handleDownloadCurrentJson = () => {
    const payload = createBackupPayload(projects, tasks, teamMembers, currentUser?.name);
    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
    downloadJsonFile(payload, `workplace_backup_${dateStr}_${timeStr}.json`);
  };

  // Handle Cloud Backup Creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupName.trim()) return;
    setIsCreating(true);setOperationError(null);
    try {
      await onCreateBackup(backupName.trim(), backupDescription.trim() || undefined);
      setBackupName(`Backup Workplace - ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      setBackupDescription('');
      setActiveTab('snapshots');
    } catch(error) {
      setOperationError(error instanceof Error ? error.message : 'Falha ao criar backup.');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle File Drop & Parse
  const handleFileProcess = (file: File) => {
    setUploadError(null);
    setUploadedPayload(null);

    if (!file.name.endsWith('.json')) {
      setUploadError('Por favor selecione um arquivo no formato .json.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const result = validateBackupPayload(parsed);
        if (!result.valid || !result.payload) {
          setUploadError(result.error || 'Arquivo de backup inválido ou com formato incompatível.');
        } else {
          setUploadedPayload(result.payload);
        }
      } catch (err) {
        setUploadError('Erro ao decodificar arquivo JSON. Certifique-se de que o arquivo não está corrompido.');
      }
    };
    reader.readAsText(file);
  };

  // Confirm and Execute Restore
  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setIsRestoring(true);setOperationError(null);
    try {
      await onRestoreBackup(pendingRestore.payload, pendingRestore.name);
      setPendingRestore(null);
      setUploadedPayload(null);
      onClose();
    } catch(error) {
      setOperationError(error instanceof Error ? error.message : 'Falha ao restaurar backup.');
      setPendingRestore(null);
    } finally {
      setIsRestoring(false);
    }
  };

  // Download a specific cloud backup snapshot
  const handleDownloadSnapshot = (snap: BackupSnapshot) => {
    const filename = `workplace_snapshot_${snap.id}_${snap.createdAt.slice(0, 10)}.json`;
    downloadJsonFile(snap.payload, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white border border-neutral-200 rounded-2xl shadow-2xl my-6 overflow-hidden text-neutral-900 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {operationError && <p role="alert" className="p-4 text-sm text-rose-800 bg-rose-50">{operationError}</p>}
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Central de Backup & Restauração
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {isCloudConnected ? 'Nuvem Ativa' : 'Local'}
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Salvaguarda dos projetos corporativos, esteira, tarefas e equipe técnica.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-stone-50 px-6 gap-2 pt-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'create'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            Criar Ponto de Restauração
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('snapshots')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'snapshots'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pontos Salvos na Nuvem ({cloudBackups.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Restaurar de Arquivo (.JSON)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'policy'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <FolderLock className="w-4 h-4" />
            Governança & Segurança
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: CRIAR PONTO DE RESTAURAÇÃO */}
          {activeTab === 'create' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Quick Status Stats Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-neutral-200 bg-stone-50/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 block">Projetos Atuais</span>
                    <span className="text-base font-bold text-neutral-900 font-mono">{projects.length}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-stone-50/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center font-bold">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 block">Tarefas e Pilares</span>
                    <span className="text-base font-bold text-neutral-900 font-mono">{tasks.length}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-neutral-200 bg-stone-50/70 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 block">Profissionais Workplace</span>
                    <span className="text-base font-bold text-neutral-900 font-mono">{teamMembers.length}</span>
                  </div>
                </div>
              </div>

              {/* Form: Create Cloud Snapshot */}
              <form onSubmit={handleCreateSubmit} className="p-5 rounded-xl border border-neutral-200 bg-white shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                      <CloudUpload className="w-4 h-4 text-amber-600" />
                      Salvar Novo Ponto de Restauração na Nuvem
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Gera uma cópia íntegra de segurança no Firestore corporativo compartilhada com a diretoria.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
                    Autor: {currentUser?.name || 'Administrador'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nome / Título do Ponto de Restauração *
                  </label>
                  <input
                    type="text"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    required
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-stone-900 bg-white"
                    placeholder="Ex: Backup Geral Pré-Apresentação Omni Logística"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Descrição ou Motivo da Salvaguarda (Opcional)
                  </label>
                  <textarea
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-3 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-stone-900 bg-white resize-none"
                    placeholder="Ex: Salvaguarda realizada antes da revisão dos orçamentos executivos de complementares."
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100">
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Os dados são sincronizados em nuvem criptografada do Firebase.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Gravando Snapshot...
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-3.5 h-3.5" />
                        Salvar Ponto na Nuvem
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Instant JSON File Download Option */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700">
                    <FileJson className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-900">
                      Baixar Arquivo Completo de Backup Local (.JSON)
                    </h5>
                    <p className="text-[11px] text-neutral-500">
                      Gera um arquivo físico para armazenar no seu computador, servidor da empresa ou SharePoint.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCurrentJson}
                  className="px-4 py-2 text-xs font-semibold text-stone-800 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  Baixar JSON Agora
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PONTOS SALVOS NA NUVEM */}
          {activeTab === 'snapshots' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    Pontos de Restauração Disponíveis
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Lista de snapshots salvos na nuvem pelo time. Você pode restaurar qualquer ponto anterior.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="text-xs font-semibold text-stone-900 hover:underline flex items-center gap-1"
                >
                  + Novo Ponto
                </button>
              </div>

              {cloudBackups.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-neutral-200 rounded-xl bg-neutral-50 space-y-3">
                  <Database className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p className="text-xs text-neutral-600 font-medium">
                    Nenhum ponto de restauração gravado na nuvem ainda.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg shadow-xs hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    Criar Meu Primeiro Backup
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cloudBackups.map((snap) => {
                    const formattedDate = new Date(snap.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={snap.id}
                        className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-neutral-900">
                              {snap.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                              {formattedDate}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                              Por: {snap.createdByName || snap.createdBy}
                            </span>
                          </div>

                          {snap.description && (
                            <p className="text-xs text-neutral-500 truncate max-w-lg">
                              {snap.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono pt-1">
                            <span>{snap.projectCount} projetos</span>
                            <span>·</span>
                            <span>{snap.taskCount} tarefas</span>
                            <span>·</span>
                            <span>{snap.teamCount} profissionais</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleDownloadSnapshot(snap)}
                            title="Baixar cópia JSON deste ponto"
                            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPendingRestore({
                              payload: snap.payload,
                              name: snap.name,
                              source: 'cloud'
                            })}
                            className="px-3 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restaurar
                          </button>

                          <button
                            type="button"
                            onClick={() => { void onDeleteBackup(snap.id).catch(error => setOperationError(error instanceof Error ? error.message : 'Falha ao excluir backup.')); }}
                            title="Excluir este ponto da nuvem"
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESTAURAR DE ARQUIVO */}
          {activeTab === 'upload' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Importar e Restaurar de Arquivo Local (.JSON)
                </h4>
                <p className="text-xs text-neutral-500">
                  Carregue um arquivo gerado anteriormente pela ferramenta de backup do Workplace.
                </p>
              </div>

              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileProcess(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-xl cursor-pointer text-center transition-all ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-amber-600 mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-neutral-900">
                  Arraste o arquivo de backup aqui ou clique para selecionar
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Formatos aceitos: .JSON (Estrutura Workplace v5)
                </p>
              </div>

              {/* Error banner */}
              {uploadError && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Falha na validação do arquivo:</span>
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {/* Validated preview card */}
              {uploadedPayload && (
                <div className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Arquivo Validado com Sucesso!
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Versão: {uploadedPayload.version}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">Projetos</span>
                      <span className="text-base font-bold text-neutral-900 font-mono">
                        {uploadedPayload.projects.length}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">Tarefas</span>
                      <span className="text-base font-bold text-neutral-900 font-mono">
                        {uploadedPayload.tasks.length}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-neutral-500 block uppercase font-bold">Equipe</span>
                      <span className="text-base font-bold text-neutral-900 font-mono">
                        {uploadedPayload.team.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-neutral-500">
                      Exportado em: {new Date(uploadedPayload.exportedAt).toLocaleString('pt-BR')} por {uploadedPayload.exportedBy || 'Usuário'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setPendingRestore({
                        payload: uploadedPayload,
                        name: `Arquivo Importado (${new Date(uploadedPayload.exportedAt).toLocaleDateString('pt-BR')})`,
                        source: 'file'
                      })}
                      className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Aplicar Restauração Completa
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: POLÍTICA & GOVERNANÇA */}
          {activeTab === 'policy' && (
            <div className="space-y-4 text-xs text-neutral-700 leading-relaxed animate-in fade-in duration-150">
              <div className="p-4 rounded-xl border border-neutral-200 bg-stone-50 space-y-2">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Política de Salvaguarda & Segurança de Dados (Workplace Arquitetura)
                </h4>
                <p>
                  Para garantir a segurança jurídica, os prazos contratuais corporativos e a rastreabilidade das entregas da esteira, recomendamos as seguintes práticas:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-1.5">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">1</span>
                    Backups Pré-Award e Pós-Award
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Sempre salve um ponto de restauração na nuvem logo antes de apresentar o Conceito + Orçamento ao cliente, e imediatamente após o cliente oficializar o Award do projeto.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-1.5">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">2</span>
                    Cópias Externas no SharePoint
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Ao término de cada semana, baixe o arquivo <span className="font-mono text-stone-900">.json</span> e armazene na pasta raiz do SharePoint da Workplace (<span className="font-mono text-stone-900">/sites/gestao/backups</span>).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-1.5">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">3</span>
                    Restauração Segura em Batch
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Ao restaurar um ponto, todos os projetos, tarefas e cadastros de colaboradores são validados e reaplicados em lote no Firebase e no navegador simultaneamente.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-1.5">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">4</span>
                    Integridade de Chaves e IDs
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    O sistema executa sanitização e deduplicação de chaves automática para garantir que nenhum dado fique corrompido ou inacessível.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-stone-50 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sistema Seguro · Workplace Gestão v5.0 · Criado por Solimar Isaac</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* CONFIRMATION RESTORE MODAL OVERLAY */}
        {pendingRestore && (
          <div className="absolute inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-md w-full p-6 text-neutral-900 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-neutral-900">
                  Confirmar Restauração de Dados?
                </h4>
                <p className="text-xs text-neutral-600">
                  Você está prestes a restaurar o ponto:
                </p>
                <div className="font-semibold text-xs text-stone-900 bg-stone-100 p-2 rounded-lg mt-2 font-mono">
                  "{pendingRestore.name}"
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                <span className="font-bold block">Atenção Crítica:</span>
                <p>
                  Esta operação substituirá os projetos, tarefas e equipes atuais no banco de dados em nuvem e no dispositivo por este ponto de restauração ({pendingRestore.payload.projects.length} projetos, {pendingRestore.payload.tasks.length} tarefas).
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingRestore(null)}
                  disabled={isRestoring}
                  className="flex-1 py-2.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Sim, Restaurar Dados
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
