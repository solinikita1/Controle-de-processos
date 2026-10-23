import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { Project, Task, TeamMember } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { formatDatePT, formatDateShort, checkDateStatus } from './dateUtils';
import { workplacePdfLogo } from './workplacePdfLogo';

export interface PdfExportOptions {
  includeTeam?: boolean;
  includePhases?: boolean;
  includeTasks?: boolean;
  includeNotes?: boolean;
  tasksFilter?: 'all' | 'pending' | 'completed';
  coordinatorNotes?: string;
}
const graphite: [number, number, number] = [19,22,23];
const yellow: [number, number, number] = [243,193,3];
const done = (t: Task) => t.completed || t.status === 'concluida';
const issued = () => new Date().toLocaleDateString('pt-BR');

/** Shared A4 stationery. Every page reserves space for the original logo and footer. */
function report(title: string, reference: string) {
  const doc = new jsPDF({unit: 'mm', format: 'a4'});
  doc.setProperties({title, author: 'Workplace Arquitetura Corporativa', creator: 'Workplace - Gestão de Projetos'});
  let y = 37;
  const room = (height: number) => { if(y + height > 274) {doc.addPage(); y = 37;} };
  const paragraph = (text: string, size = 9, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...graphite);
    const lines = doc.splitTextToSize(text, 182) as string[];
    for(const line of lines) { room(size * 0.45 + 1); doc.text(line, 14, y); y += size * 0.45; }
    y += 3;
  };
  const section = (text: string) => {room(20); y += 3; paragraph(text,10,true);};
  const table = (head: string[], body: string[][], widths?: number[]) => {
    autoTable(doc, {startY:y, margin:{top:37,bottom:23,left:14,right:14}, head:[head], body,
      theme:'grid', rowPageBreak:'avoid',
      styles:{font:'helvetica',fontSize:8,cellPadding:2.3,textColor:graphite,lineColor:[222,225,225],overflow:'linebreak'},
      headStyles:{fillColor:graphite,textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[248,249,249]},
      columnStyles: widths ? Object.fromEntries(widths.map((w,i)=>[i,{cellWidth:w}])) : undefined,
    });
    y = (doc as jsPDF & {lastAutoTable:{finalY:number}}).lastAutoTable.finalY + 7;
  };
  const finish = () => {
    const count = doc.getNumberOfPages();
    for(let n=1;n<=count;n++) {
      doc.setPage(n); doc.setFillColor(...yellow); doc.rect(0,0,210,2,'F');
      doc.addImage(workplacePdfLogo,'PNG',14,8,67,67*346/2063,'workplace','FAST');
      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...graphite);
      doc.text(title,196,13,{align:'right',maxWidth:100});
      doc.setFont('helvetica','normal'); doc.setFontSize(7);
      doc.text(`Emissão: ${issued()}`,196,23,{align:'right'});
      doc.setDrawColor(...yellow); doc.setLineWidth(0.5); doc.line(14,29,196,29);
      doc.setDrawColor(215,219,219); doc.setLineWidth(0.2); doc.line(14,281,196,281);
      doc.setTextColor(79,85,86); doc.setFontSize(7);
      doc.text('WORKPLACE | ARQUITETURA CORPORATIVA',14,286);
      doc.text(`Página ${n} de ${count}`,196,286,{align:'right'});
      doc.setFontSize(6.5); doc.text(doc.splitTextToSize(reference,150)[0],14,290);
    }
    return doc;
  };
  return {doc, paragraph, section, table, finish, room};
}

export function generateProjectPdf(project:Project,tasks:Task[],team:TeamMember[],options:PdfExportOptions = {}): jsPDF {
  const {includeTeam=true,includePhases=true,includeTasks=true,includeNotes=true,tasksFilter='all',coordinatorNotes=''}=options;
  const r=report('RELATÓRIO EXECUTIVO DE PROJETO',`Projeto ${project.code}`);
  const projectTasks=tasks.filter(t=>t.projectId===project.id);
  const completed=projectTasks.filter(done).length;
  const pct=projectTasks.length?Math.round(completed/projectTasks.length*100):0;
  r.paragraph(`${project.code} | ${project.name}`,16,true);
  r.paragraph(`Cliente: ${project.client}`);
  r.paragraph(`Tipologia: ${project.typology} | Local: ${project.location}`);
  const phase=ARCHITECTURE_PHASES.find(p=>p.id===project.currentPhase);
  r.table(['Área corporativa','Fase atual','Prazo contratual','Progresso'],[[`${project.areaM2.toLocaleString('pt-BR')} m²`,phase?.name||project.currentPhase,`${formatDatePT(project.startDate)} a ${formatDatePT(project.targetEndDate)}`,`${pct}% (${completed}/${projectTasks.length} tarefas)`]],[31,67,49,35]);
  r.paragraph(`Situação do cronograma: ${checkDateStatus(project.targetEndDate,pct===100).label}.`);
  if(coordinatorNotes.trim()) {r.section('PARECER DA COORDENAÇÃO');r.paragraph(coordinatorNotes.trim());}
  if(includeTeam) {
    r.section('EQUIPE TÉCNICA DESIGNADA');
    r.table(['Profissional','Cargo / Departamento','E-mail','Entregas'],team.filter(m=>project.teamMemberIds.includes(m.id)).map(m=>{
      const mt=projectTasks.filter(t=>t.responsibleId===m.id);
      return [m.name,`${m.role} / ${m.department||'Projetos'}`,m.email||'',`${mt.filter(done).length}/${mt.length}`];
    }),[43,54,65,20]);
  }
  if(includePhases) {
    r.section('AVANÇO POR FASE');
    r.table(['Fase da arquitetura','Fase vigente','Entregas','Conclusão'],ARCHITECTURE_PHASES.map(p=>{
      const ts=projectTasks.filter(t=>t.phase===p.id), d=ts.filter(done).length;
      return [p.name,p.id===project.currentPhase?'Em andamento':'-',`${d}/${ts.length}`,`${ts.length?Math.round(d/ts.length*100):0}%`];
    }),[95,37,25,25]);
  }
  if(includeTasks) {
    const visible=projectTasks.filter(t=>tasksFilter==='pending'?!done(t):tasksFilter==='completed'?done(t):true);
    r.section(`CRONOGRAMA DETALHADO (${visible.length} tarefas)`);
    r.table(['Atividade / Entregável','Fase / Prioridade','Responsável','Início / Término','Situação'],visible.map(t=>[
      t.title+(t.deliverables?`\nEntregável: ${t.deliverables}`:''),
      `${ARCHITECTURE_PHASES.find(p=>p.id===t.phase)?.shortName||t.phase}\n${t.priority}`,
      team.find(m=>m.id===t.responsibleId)?.name||'Não atribuído',
      `${formatDateShort(t.startDate)}\n${formatDateShort(t.endDate)}`,
      done(t)?'Concluída':checkDateStatus(t.endDate,false).isOverdue?'Atrasada':t.status==='em_andamento'?'Em andamento':t.status==='em_revisao'?'Em revisão':'Pendente',
    ]),[65,32,34,25,26]);
  }
  if(includeNotes) {
    if(project.description){r.section('BRIEFING ARQUITETÔNICO');r.paragraph(project.description);}
    if(project.notes){r.section('NOTAS TÉCNICAS E PREMISSAS');r.paragraph(project.notes);}
  }
  r.room(45);
  r.section('CIÊNCIA DO RELATÓRIO');
  r.table(['Coordenação técnica Workplace','Cliente contratante'],[['Nome / assinatura:\n\nData: ____ / ____ / ______','Nome / assinatura:\n\nData: ____ / ____ / ______']],[91,91]);
  return r.finish();
}
export function downloadProjectPdf(project:Project,tasks:Task[],team:TeamMember[],options:PdfExportOptions={}):void {
  generateProjectPdf(project,tasks,team,options).save(`Workplace_Projeto_${project.code.replace(/[^a-zA-Z0-9_-]/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`);
}

export function generateStudioPdf(projects:Project[],tasks:Task[],team:TeamMember[],filterLabel='Todos'): jsPDF {
  const r=report('RELATÓRIO CONSOLIDADO | PROJETOS E SLA',`Filtro: ${filterLabel}`);
  const ids=new Set(projects.map(p=>p.id)); const selected=tasks.filter(t=>ids.has(t.projectId));
  r.paragraph('Gestão de projetos corporativos',16,true);
  r.paragraph(`Filtro aplicado: ${filterLabel}. Emissão: ${issued()}.`);
  r.table(['Projetos','Tarefas','Concluídas','Em atraso'],[[String(projects.length),String(selected.length),String(selected.filter(done).length),String(selected.filter(t=>!done(t)&&checkDateStatus(t.endDate,false).isOverdue).length)]]);
  r.section('CARTEIRA DE PROJETOS');
  r.table(['Código / Projeto','Cliente','Fase','Prazo final','Conclusão'],projects.map(p=>{
    const ts=selected.filter(t=>t.projectId===p.id);
    return [`${p.code}\n${p.name}`,p.client,ARCHITECTURE_PHASES.find(f=>f.id===p.currentPhase)?.shortName||p.currentPhase,formatDatePT(p.targetEndDate),`${ts.length?Math.round(ts.filter(done).length/ts.length*100):0}%`];
  }),[60,42,30,26,24]);
  r.section('EQUIPE | ENTREGAS NO RECORTE SELECIONADO');
  r.table(['Profissional','Cargo','Tarefas','Concluídas','Em atraso'],team.map(m=>{
    const ts=selected.filter(t=>t.responsibleId===m.id);
    return [m.name,m.role,String(ts.length),String(ts.filter(done).length),String(ts.filter(t=>!done(t)&&checkDateStatus(t.endDate,false).isOverdue).length)];
  }),[52,55,25,25,25]);
  return r.finish();
}
