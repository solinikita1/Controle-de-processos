import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types';
import { X, UserPlus, Mail, Phone, Award, Briefcase, AlertCircle } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => Promise<boolean>;
  memberToEdit?: TeamMember | null;
}

const AVATAR_COLORS = [
  'bg-stone-800 text-stone-100',
  'bg-sky-700 text-white',
  'bg-emerald-700 text-white',
  'bg-violet-700 text-white',
  'bg-amber-700 text-white',
  'bg-rose-700 text-white',
  'bg-indigo-700 text-white',
  'bg-teal-700 text-white',
];

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<TeamMember['department']>('Projetos');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setRole(memberToEdit.role);
      setEmail(memberToEdit.email);
      setPhone(memberToEdit.phone || '');
      setDepartment(memberToEdit.department);
      setAvatarColor(memberToEdit.avatarColor || AVATAR_COLORS[0]);
      setErrors({});
    } else {
      setName('');
      setRole('Arquiteto(a) de Projetos');
      setEmail('');
      setPhone('');
      setDepartment('Projetos');
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
      setErrors({});
    }
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.slice(0, 2).toUpperCase() || 'AR';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = 'O nome do profissional é obrigatório.';
    if (!role.trim()) newErrors.role = 'O cargo ou especialidade é obrigatório.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const member: TeamMember = {
      id: memberToEdit ? memberToEdit.id : `team-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@archoffice.com.br`,
      phone: phone.trim() || undefined,
      initials: getInitials(name),
      avatarColor,
      department,
    };

    if (await onSave(member)) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-xl shadow-xl my-8 overflow-hidden text-neutral-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-stone-900 text-white rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900">
                {memberToEdit ? 'Editar Profissional da Equipe' : 'Adicionar Membro à Equipe'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Cadastre arquitetos, coordenadores e consultores do escritório.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Nome Completo <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="Ex: Beatriz Fontes"
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

          {/* Role and Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                Cargo / Especialidade <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (errors.role) setErrors({ ...errors, role: '' });
                }}
                placeholder="Ex: Arquiteta Sênior de Interiores"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${
                  errors.role ? 'border-rose-400' : 'border-neutral-300'
                }`}
              />
              {errors.role && <p className="text-xs text-rose-600 mt-1">{errors.role}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Área / Núcleo
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as TeamMember['department'])}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              >
                <option value="Diretoria">Diretoria Executiva</option>
                <option value="Negócios">Negócios</option>
                <option value="Comercial">Comercial</option>
                <option value="Operações">Operações & Engenharia</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Orçamento">Orçamento</option>
                <option value="Criação">Criação</option>
                <option value="Executivo">Executivo</option>
                <option value="Projetos">Projetos & Arquitetura</option>
              </select>
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                E-mail Corporativo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@archoffice.com.br"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
              Cor do Avatar de Identificação
            </label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((colorClass, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarColor(colorClass)}
                  className={`w-7 h-7 rounded-md transition-all ${colorClass.split(' ')[0]} ${
                    avatarColor === colorClass ? 'ring-2 ring-stone-900 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
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
              {memberToEdit ? 'Salvar Alterações' : 'Adicionar Profissional'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
