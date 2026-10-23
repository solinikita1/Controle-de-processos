import {Project,Task} from '../types';import {localDay}from'./operations';
export function creationRevisionTasks(project:Project,tasks:Task[]):{project:Project;changes:Task[]}{
 const p=structuredClone(project),r=p.creationRounds?.at(-1),changes:Task[]=[];if(!r||r.number===0)return {project:p,changes};
 for(const kind of ['projectWork','budgetWork'] as const){const w=r[kind];if(!w)continue;const id=w.taskId||crypto.randomUUID(),old=tasks.find(t=>t.id===id);w.taskId=id;
 const task:Task={...old,id,projectId:p.id,title:`Criação · Revisão ${String(r.number).padStart(2,'0')} — ${kind==='projectWork'?'Projeto':'Orçamento'}`,description:r.request,phase:kind==='projectWork'?'criacao_conceitual':'criacao_orcamento',responsibleId:w.responsibleId,startDate:old?.startDate||localDay(),endDate:w.dueDate,priority:old?.priority||'alta',status:w.done?'concluida':old?.status==='concluida'?'em_andamento':old?.status||'a_fazer',completed:w.done,createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};changes.push(task);}
 return {project:p,changes};
}
export function syncCreationTask(project:Project,task:Task):Project|null{
 const p=structuredClone(project),r=p.creationRounds?.at(-1);if(!r||!['draft','ready'].includes(r.state))return null;const work=[r.projectWork,r.budgetWork].find(w=>w?.taskId===task.id);if(!work)return null;
 work.done=task.completed||task.status==='concluida';work.responsibleId=task.responsibleId;work.dueDate=task.endDate;
 r.state=[r.projectWork,r.budgetWork].every(w=>!w||w.done)?'ready':'draft';
 if(p.currentPhase.startsWith('criacao_'))p.currentPhase=r.state==='ready'?'criacao_apresentacao':r.projectWork&&!r.projectWork.done?'criacao_conceitual':'criacao_orcamento';return p;
}
