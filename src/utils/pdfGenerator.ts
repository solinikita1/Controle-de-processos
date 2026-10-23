import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Task, TeamMember } from '../types';
import { ARCHITECTURE_PHASES } from '../data/mockData';
import { formatDatePT, formatDateShort, checkDateStatus, calculateDaysDifference } from './dateUtils';

export interface PdfExportOptions {
  includeTeam?: boolean;
  includePhases?: boolean;
  includeTasks?: boolean;
  includeNotes?: boolean;
  tasksFilter?: 'all' | 'pending' | 'completed';
  coordinatorNotes?: string;
}

export function generateProjectPdf(
  project: Project,
  tasks: Task[],
  allTeamMembers: TeamMember[],
  options: PdfExportOptions = {}
): jsPDF {
  const {
    includeTeam = true,
    includePhases = true,
    includeTasks = true,
    includeNotes = true,
    tasksFilter = 'all',
    coordinatorNotes = '',
  } = options;

  // Initialize A4 document (portrait, mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Filter tasks belonging to project
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t) => t.completed || t.status === 'concluida').length;
  const pendingTasks = totalTasks - completedTasks;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const overdueTasks = projectTasks.filter((t) => {
    if (t.completed || t.status === 'concluida') return false;
    return checkDateStatus(t.endDate, false).isOverdue;
  }).length;

  const projectTeam = allTeamMembers.filter((m) => project.teamMemberIds.includes(m.id));
  const currentPhaseInfo = ARCHITECTURE_PHASES.find((p) => p.id === project.currentPhase);
  const projectDuration = calculateDaysDifference(project.startDate, project.targetEndDate);
  const projectDateStatus = checkDateStatus(project.targetEndDate, percentage === 100);

  // Filter tasks for table if requested
  const filteredTasksForTable = projectTasks.filter((t) => {
    if (tasksFilter === 'pending') return !t.completed && t.status !== 'concluida';
    if (tasksFilter === 'completed') return t.completed || t.status === 'concluida';
    return true;
  });

  // --- HEADER SECTION ---
  // Dark header banner
  doc.setFillColor(28, 25, 23); // #1c1917 stone-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent line
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Office Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ArchOffice', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(214, 211, 209);
  doc.text('Studio de Arquitetura Corporativa & Gestão de Obras', margin, 18);

  // Document Title on the right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RELATÓRIO EXECUTIVO DE PROJETO', pageWidth - margin, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(214, 211, 209);
  const todayStr = formatDatePT(new Date().toISOString().slice(0, 10));
  doc.text(`Emissão: ${todayStr} · Código: ${project.code}`, pageWidth - margin, 18, { align: 'right' });

  let cursorY = 36;

  // --- PROJECT IDENTIFICATION BOX ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(28, 25, 23);
  doc.text(project.name, margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(87, 83, 78);
  doc.text(`Cliente: ${project.client}   |   Tipologia: ${project.typology}   |   Local: ${project.location}`, margin, cursorY);
  cursorY += 7;

  // 4 Key Metric Boxes in a row
  const boxWidth = (pageWidth - margin * 2 - 9) / 4;
  const boxHeight = 16;
  const boxY = cursorY;

  const metricBoxes = [
    {
      label: 'Área Corporativa',
      val: `${project.areaM2.toLocaleString('pt-BR')} m²`,
      sub: 'Laje projetada',
    },
    {
      label: 'Fase Atual',
      val: currentPhaseInfo ? currentPhaseInfo.shortName : project.currentPhase,
      sub: currentPhaseInfo ? currentPhaseInfo.name.split('(')[0].trim() : '',
    },
    {
      label: 'Prazo Contratual',
      val: `${formatDateShort(project.startDate)} a ${formatDateShort(project.targetEndDate)}`,
      sub: `${projectDuration} dias corridos`,
    },
    {
      label: 'Progresso Global',
      val: `${percentage}%`,
      sub: `${completedTasks}/${totalTasks} tarefas feitas`,
    },
  ];

  metricBoxes.forEach((box, i) => {
    const x = margin + i * (boxWidth + 3);
    doc.setFillColor(250, 250, 249);
    doc.setDrawColor(229, 229, 229);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 113, 108);
    doc.text(box.label.toUpperCase(), x + 3, boxY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(28, 25, 23);
    doc.text(box.val, x + 3, boxY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 113, 108);
    doc.text(box.sub, x + 3, boxY + 14);
  });

  cursorY += boxHeight + 8;

  // Deadline note / status alert
  if (projectDateStatus.isOverdue) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 7, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text(`ALERTA DE PRAZO: Projeto com ${Math.abs(projectDateStatus.daysRemaining)} dias de atraso em relação à data contratual.`, margin + 3, cursorY + 4.8);
    cursorY += 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Situação do Cronograma: ${projectDateStatus.label} para entrega final.`, margin, cursorY);
    cursorY += 5;
  }

  // Coordinator Notes (if provided by user in the modal)
  if (coordinatorNotes.trim()) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 10, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text('PARECER DA COORDENAÇÃO:', margin + 3, cursorY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 53, 15);
    doc.text(coordinatorNotes.trim(), margin + 3, cursorY + 7.5, { maxWidth: pageWidth - margin * 2 - 6 });
    cursorY += 14;
  }

  // --- SECTION: TEAM ALLOCATED ---
  if (includeTeam && projectTeam.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(28, 25, 23);
    doc.text('EQUIPE TÉCNICA DESIGNADA', margin, cursorY);
    cursorY += 2;

    const teamRows = projectTeam.map((m) => {
      const memberTasks = projectTasks.filter((t) => t.responsibleId === m.id);
      const done = memberTasks.filter((t) => t.completed || t.status === 'concluida').length;
      return [
        m.name,
        m.role,
        m.department || 'Projetos',
        m.email,
        `${done}/${memberTasks.length} tarefas`,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Profissional', 'Cargo / Especialidade', 'Departamento', 'E-mail Corporativo', 'Tarefas']],
      body: teamRows,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 37, 36],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [40, 40, 40],
        lineColor: [229, 231, 235],
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 25, halign: 'center' },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 7;
  }

  // --- SECTION: PHASES PROGRESS ---
  if (includePhases) {
    // Check if we need page break
    if (cursorY > pageHeight - 55) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(28, 25, 23);
    doc.text('AVANÇO POR FASE DO CICLO DE ARQUITETURA', margin, cursorY);
    cursorY += 2;

    const phaseRows = ARCHITECTURE_PHASES.map((p) => {
      const pTasks = projectTasks.filter((t) => t.phase === p.id);
      const done = pTasks.filter((t) => t.completed || t.status === 'concluida').length;
      const pct = pTasks.length > 0 ? `${Math.round((done / pTasks.length) * 100)}%` : '0%';
      const isCurrent = p.id === project.currentPhase ? 'Sim (Em andamento)' : '-';

      return [
        p.shortName,
        p.name,
        isCurrent,
        `${done} de ${pTasks.length}`,
        pct,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Sigla', 'Fase da Arquitetura', 'Fase Vigente', 'Entregas', 'Conclusão']],
      body: phaseRows,
      theme: 'grid',
      headStyles: {
        fillColor: [68, 64, 60],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [40, 40, 40],
        lineColor: [229, 231, 235],
      },
      columnStyles: {
        0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 75 },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 28, halign: 'center' },
        4: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 7;
  }

  // --- SECTION: DETAILED TASK SCHEDULE TABLE ---
  if (includeTasks && filteredTasksForTable.length > 0) {
    if (cursorY > pageHeight - 50) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(28, 25, 23);
    doc.text(`CRONOGRAMA DETALHADO DE TAREFAS (${filteredTasksForTable.length})`, margin, cursorY);
    cursorY += 2;

    const taskRows = filteredTasksForTable.map((t) => {
      const resp = allTeamMembers.find((m) => m.id === t.responsibleId);
      const isDone = t.completed || t.status === 'concluida';
      const dateStat = checkDateStatus(t.endDate, isDone);
      
      let sitLabel = 'Pendente';
      if (isDone) sitLabel = 'Concluída';
      else if (dateStat.isOverdue) sitLabel = 'Atrasada';
      else if (t.status === 'em_andamento') sitLabel = 'Em andamento';
      else if (t.status === 'em_revisao') sitLabel = 'Em revisão';

      const phaseObj = ARCHITECTURE_PHASES.find((p) => p.id === t.phase);
      const prioLabels: Record<string, string> = {
        critica: 'Crítica',
        alta: 'Alta',
        media: 'Média',
        baixa: 'Baixa',
      };

      return [
        t.title + (t.deliverables ? `\n[Entregável: ${t.deliverables}]` : ''),
        phaseObj ? phaseObj.shortName : t.phase,
        prioLabels[t.priority] || t.priority,
        resp ? resp.name.split(' ')[0] : 'Não atribuído',
        formatDateShort(t.startDate),
        formatDateShort(t.endDate),
        sitLabel,
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Atividade Técnica & Entregável', 'Fase', 'Prioridade', 'Responsável', 'Início', 'Término', 'Situação']],
      body: taskRows,
      theme: 'grid',
      headStyles: {
        fillColor: [28, 25, 23],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 6.8,
        cellPadding: 2,
        textColor: [40, 40, 40],
        lineColor: [229, 231, 235],
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 24 },
        4: { cellWidth: 17, halign: 'center' },
        5: { cellWidth: 17, halign: 'center' },
        6: { cellWidth: 21, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        // Highlight overdue or completed rows
        if (data.section === 'body' && data.column.index === 6) {
          const val = data.cell.raw;
          if (val === 'Concluída') {
            data.cell.styles.textColor = [16, 185, 129]; // emerald
          } else if (val === 'Atrasada') {
            data.cell.styles.textColor = [220, 38, 38]; // rose
          }
        }
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- SECTION: BRIEFING & NOTES ---
  if (includeNotes && (project.description || project.notes)) {
    if (cursorY > pageHeight - 45) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(28, 25, 23);
    doc.text('NOTAS TÉCNICAS E PREMISSAS CONSTRUTIVAS', margin, cursorY);
    cursorY += 4;

    if (project.description) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text('Briefing Arquitetônico:', margin, cursorY);
      cursorY += 3.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.text(project.description, margin, cursorY, { maxWidth: pageWidth - margin * 2 });
      cursorY += 10;
    }

    if (project.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      doc.text('Observações de Condomínio / Instalações:', margin, cursorY);
      cursorY += 3.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(55, 65, 81);
      doc.text(project.notes, margin, cursorY, { maxWidth: pageWidth - margin * 2 });
      cursorY += 10;
    }
  }

  // --- SIGNATURE BLOCK ---
  if (cursorY > pageHeight - 35) {
    doc.addPage();
    cursorY = 25;
  } else {
    cursorY = Math.max(cursorY + 6, pageHeight - 35);
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, cursorY + 12, margin + 70, cursorY + 12);
  doc.line(pageWidth - margin - 70, cursorY + 12, pageWidth - margin, cursorY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Coordenação Técnica ArchOffice', margin + 35, cursorY + 16, { align: 'center' });
  doc.text('De acordo / Cliente Contratante', pageWidth - margin - 35, cursorY + 16, { align: 'center' });

  // Add Footers to all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `ArchOffice Gestão de Arquitetura Corporativa · Relatório de Progresso · Projeto ${project.code}`,
      margin,
      pageHeight - 6
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}

export function downloadProjectPdf(
  project: Project,
  tasks: Task[],
  allTeamMembers: TeamMember[],
  options: PdfExportOptions = {}
): void {
  const doc = generateProjectPdf(project, tasks, allTeamMembers, options);
  const cleanCode = project.code.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Relatorio_Progresso_${cleanCode}_${dateStr}.pdf`);
}
