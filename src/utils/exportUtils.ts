import { Project, Task, TeamMember } from '../types';
import { formatDatePT } from './dateUtils';
import { ARCHITECTURE_PHASES } from '../data/mockData';

/**
 * Triggers a download of string content as a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a single project and all its technical tasks to Excel-compatible CSV (UTF-8 with BOM)
 */
export function exportProjectToCsv(
  project: Project,
  tasks: Task[],
  teamMembers: TeamMember[]
): void {
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const getMember = (id: string) => teamMembers.find((m) => m.id === id);
  const getPhaseName = (phaseId: string) =>
    ARCHITECTURE_PHASES.find((p) => p.id === phaseId)?.name || phaseId;

  const sanitize = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Build CSV Rows
  const rows: string[] = [];

  // Project Header Block
  rows.push('RELATÓRIO EXECUTIVO DE PROJETO - WORKPLACE ARQUITETURA CORPORATIVA');
  rows.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  rows.push('');
  rows.push('INFORMAÇÕES GERAIS DO PROJETO');
  rows.push(`Código;Nome do Projeto;Cliente;Tipologia;Área (m²);Status;Fase Atual;Prioridade na Esteira;Orçamento Estimado (R$);Data de Início;Data de Conclusão;Pasta de Documentos (SharePoint/Rede)`);
  rows.push(
    [
      sanitize(project.code),
      sanitize(project.name),
      sanitize(project.client),
      sanitize(project.typology),
      sanitize(project.areaM2),
      sanitize(project.status.toUpperCase()),
      sanitize(getPhaseName(project.currentPhase)),
      sanitize(project.priority ? project.priority.toUpperCase() : 'P2 ALTA'),
      sanitize(project.estimatedBudgetBRL ? `R$ ${project.estimatedBudgetBRL.toLocaleString('pt-BR')}` : 'Não informado'),
      sanitize(formatDatePT(project.startDate)),
      sanitize(formatDatePT(project.targetEndDate)),
      sanitize(project.briefing?.documentsFolderUrl || 'Não informado'),
    ].join(';')
  );

  rows.push('');
  rows.push('DADOS DO BRIEFING DE ARQUITETURA CORPORATIVA & ENTRADA');
  if (project.briefing) {
    const b = project.briefing;
    const modelLabel =
      b.negotiationModel === 'bts'
        ? 'Built to Suit (BTS)'
        : b.negotiationModel === 'capex_direto'
        ? 'CAPEX Direto do Cliente'
        : b.negotiationModel === 'turnkey'
        ? 'Turnkey Fechado'
        : b.negotiationModel === 'taxa_administracao'
        ? 'Taxa de Administração (Cost-Plus)'
        : b.negotiationModel === 'projeto_arquitetura'
        ? 'Escopo Fechado de Arquitetura'
        : b.negotiationModel || 'Não informado';

    rows.push(`Head Responsável:;${sanitize(b.submittedByName)}`);
    rows.push(`Data/Hora de Registro:;${sanitize(b.submittedAt)}`);
    rows.push(`Ponto de Contato no Cliente:;${sanitize(b.clientContactPerson || 'N/A')}`);
    rows.push(`Cargo do Contato:;${sanitize(b.clientContactRole || 'N/A')}`);
    rows.push(`E-mail do Contato:;${sanitize(b.clientContactEmail || 'N/A')}`);
    rows.push(`Telefone / Celular do Contato:;${sanitize(b.clientContactPhone || 'N/A')}`);
    rows.push(`Modelo de Negociação:;${sanitize(modelLabel)}`);
    rows.push(`Faixa de Investimento (CAPEX):;${sanitize(b.estimatedBudgetRange || 'N/A')}`);
    rows.push(`Notas da Oferta Comercial:;${sanitize(b.negotiationNotes || 'N/A')}`);
    rows.push(`Postos de Trabalho (Open Space):;${sanitize(b.programOfNeeds.workstations || 0)}`);
    rows.push(`Salas de Reunião Acústicas:;${sanitize(b.programOfNeeds.meetingRooms || 0)}`);
    rows.push(`Cabines de Foco (Phone Booths):;${sanitize(b.programOfNeeds.focusPods || 0)}`);
    rows.push(`Previsão de Expansão:;${sanitize(b.programOfNeeds.expansionForecast || 'N/A')}`);
    rows.push(`Área Wellness Contemplada?:;${sanitize(b.programOfNeeds.hasWellnessArea ? 'SIM' : 'NÃO')}`);
    rows.push(`Detalhes da Área Wellness:;${sanitize(b.programOfNeeds.wellnessDetails || 'N/A')}`);
    rows.push(`Ambientes Especiais:;${sanitize(b.programOfNeeds.specialRooms || 'N/A')}`);
    rows.push(`Premissas e Restrições do Condomínio:;${sanitize(b.premisesAndAlerts)}`);
    rows.push(`Notas de Bastidores Comercial:;${sanitize(b.commercialObservations || 'N/A')}`);
  } else {
    rows.push('Briefing não preenchido ou importado.');
  }

  rows.push('');
  rows.push('LISTA DE TAREFAS E ENTREGAS TÉCNICAS (ESTILO MONDAY.COM)');
  rows.push(
    'ID Tarefa;Título da Tarefa;Fase de Arquitetura;Responsável;E-mail;Data Início;Data Término;Prioridade;Status;Já Concluiu?;Entregáveis Técnicos;Checklist de Itens'
  );

  projectTasks.forEach((t) => {
    const resp = getMember(t.responsibleId);
    const checklistSummary = t.checklist
      ? t.checklist.map((c) => `[${c.completed ? 'X' : ' '}] ${c.text}`).join(' | ')
      : 'Nenhum';

    rows.push(
      [
        sanitize(t.id),
        sanitize(t.title),
        sanitize(getPhaseName(t.phase)),
        sanitize(resp ? `${resp.name} (${resp.role})` : 'Não atribuído'),
        sanitize(resp?.email || ''),
        sanitize(formatDatePT(t.startDate)),
        sanitize(formatDatePT(t.endDate)),
        sanitize(t.priority.toUpperCase()),
        sanitize(t.status.toUpperCase().replace('_', ' ')),
        sanitize(t.completed || t.status === 'concluida' ? 'SIM' : 'NÃO'),
        sanitize(t.deliverables || 'N/A'),
        sanitize(checklistSummary),
      ].join(';')
    );
  });

  // UTF-8 BOM prefix for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const filename = `${project.code}_Workplace_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports all office projects summary to CSV (Monday.com Portfolio View)
 */
export function exportAllProjectsToCsv(projects: Project[], tasks: Task[]): void {
  const sanitize = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [];
  rows.push('PORTFÓLIO CONSOLIDADO DE PROJETOS - WORKPLACE ARQUITETURA');
  rows.push(`Exportado em: ${new Date().toLocaleString('pt-BR')}`);
  rows.push('');
  rows.push(
    'Código;Nome do Projeto;Cliente;Tipologia;Área (m²);Fase Atual;Prioridade na Esteira;Status;Progresso (%);Total Tarefas;Tarefas Feitas;Tarefas Pendentes;Início;Término;Orçamento (R$);Arquivado?'
  );

  projects.forEach((p) => {
    const pTasks = tasks.filter((t) => t.projectId === p.id);
    const done = pTasks.filter((t) => t.completed || t.status === 'concluida').length;
    const progress = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
    const phaseName = ARCHITECTURE_PHASES.find((ph) => ph.id === p.currentPhase)?.name || p.currentPhase;

    rows.push(
      [
        sanitize(p.code),
        sanitize(p.name),
        sanitize(p.client),
        sanitize(p.typology),
        sanitize(p.areaM2),
        sanitize(phaseName),
        sanitize(p.priority ? p.priority.toUpperCase() : 'P2 ALTA'),
        sanitize(p.status.toUpperCase()),
        sanitize(`${progress}%`),
        sanitize(pTasks.length),
        sanitize(done),
        sanitize(pTasks.length - done),
        sanitize(formatDatePT(p.startDate)),
        sanitize(formatDatePT(p.targetEndDate)),
        sanitize(p.estimatedBudgetBRL ? `R$ ${p.estimatedBudgetBRL.toLocaleString('pt-BR')}` : 'N/A'),
        sanitize(p.isArchived ? 'SIM (ARQUIVADO)' : 'NÃO (ATIVO)'),
      ].join(';')
    );
  });

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const filename = `Portfolio_Workplace_Arquitetura_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports complete project and its tasks to JSON backup
 */
export function exportProjectToJson(project: Project, tasks: Task[]): void {
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const data = {
    exportDate: new Date().toISOString(),
    schemaVersion: '1.0',
    platform: 'Workplace Arquitetura Corporativa',
    project,
    tasks: projectTasks,
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const filename = `${project.code}_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(jsonStr, filename, 'application/json');
}
