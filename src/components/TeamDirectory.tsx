import React, { useState, useMemo } from 'react';
import { TeamMember, Project, Task } from '../types';
import { UserPlus, Edit2, Mail, Phone, Award, Briefcase, FolderGit2, CheckCircle2, ShieldCheck, Search } from 'lucide-react';

interface TeamDirectoryProps {
  teamMembers: TeamMember[];
  projects: Project[];
  tasks: Task[];
  onNewMember: () => void;
  onEditMember: (member: TeamMember) => void;
  onSelectProject: (projectId: string) => void;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({
  teamMembers,
  projects,
  tasks,
  onNewMember,
  onEditMember,
  onSelectProject,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const departments = ['all', 'Diretoria', 'Operações', 'Negócios', 'Comercial', 'Financeiro', 'Projetos', 'Orçamento', 'Criação', 'Executivo'];

  const filteredMembers = useMemo<TeamMember[]>(() => {
    const list = teamMembers.filter((m) => {
      if (selectedDept !== 'all' && m.department !== selectedDept) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
    const seen = new Set<string>();
    return list.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [teamMembers, selectedDept, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Workplace Arquitetura Corporativa
            </span>
            <span className="w-1 h-1 rounded-full bg-neutral-300" />
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Microsoft 365 Entra ID Conectado
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
            Quadro de Colaboradores ({teamMembers.length})
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Equipe técnica sincronizada com o domínio corporativo @workplace.arq.br.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewMember}
          className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          + Adicionar Profissional
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedDept === dept
                  ? 'bg-stone-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {dept === 'all' ? 'Todos os Departamentos' : dept}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-neutral-300 focus:outline-hidden focus:border-stone-900 bg-white"
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((member, idx) => {
          const assignedProjects = projects.filter((p) => p.teamMemberIds.includes(member.id));
          const memberTasks = tasks.filter((t) => t.responsibleId === member.id);
          const doneTasks = memberTasks.filter((t) => t.completed || t.status === 'concluida').length;
          const pendingTasks = memberTasks.length - doneTasks;

          return (
            <div
              key={`${member.id}-${idx}`}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all group"
            >
              <div>
                {/* Top: Avatar + Name + Edit button */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${member.avatarColor}`}>
                      {member.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-neutral-900">{member.name}</h3>
                        {member.isDirector && (
                          <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded-xs uppercase">
                            {member.role.includes('CEO') ? 'CEO' : member.role.includes('CSO') ? 'CSO' : 'Diretoria'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{member.role}</p>
                      <span className="text-[10px] uppercase font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded-xs mt-1 inline-block">
                        {member.department}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditMember(member)}
                    title="Editar dados do profissional"
                    className="p-1.5 text-neutral-400 hover:text-stone-900 hover:bg-neutral-100 rounded-md transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-neutral-600 mb-4 pt-3 border-t border-neutral-100">
                  {member.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-neutral-600">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {/* Workload */}
                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200/60 mb-4 text-xs">
                  <div className="flex items-center justify-between text-neutral-600 mb-1">
                    <span>Tarefas atribuídas:</span>
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      {memberTasks.length} ({doneTasks} concluídas)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-stone-900 h-full rounded-full transition-all duration-300"
                      style={{ width: `${memberTasks.length > 0 ? (doneTasks / memberTasks.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Assigned Projects */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block mb-1.5">
                    Projetos Atribuídos ({assignedProjects.length})
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {assignedProjects.length === 0 ? (
                      <span className="text-xs text-neutral-400 italic">Nenhum projeto alocado</span>
                    ) : (
                      assignedProjects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => onSelectProject(p.id)}
                          className="text-xs p-1.5 rounded bg-white hover:bg-stone-100 border border-neutral-200/80 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span className="truncate font-medium text-neutral-800">{p.name}</span>
                          <span className="text-[10px] font-mono text-neutral-500 shrink-0 ml-1">{p.code}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
