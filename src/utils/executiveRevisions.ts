import {Project,Task,ArchitecturePhase,ExecutiveRevision} from '../types';
import {areaForPhase} from './workAreas';import {isValidDateString} from './dateUtils';
export function addExecutiveRevision(project:Project,input:{phase:ArchitecturePhase;request:string;responsibleId:string;dueDate:string},actor:string,today:string):{project:Project;task:Task}{
 if(areaForPhase(input.phase)!=='executivo'||!input.request.trim()||!input.responsibleId||!isValidDateString(input.dueDate)||input.dueDate<today)throw Error('Informe etapa, pedido, responsável e prazo válido.');
 const rounds=structuredClone(project.executiveRevisions||[]),last=rounds.at(-1);
 if(last?.state==='working')throw Error('Conclua e registre o envio da revisão atual antes de abrir outra.');
 if(last?.state==='waiting')last.state='superseded';
 const number=(last?.number||0)+1,taskId=crypto.randomUUID(),now=new Date().toISOString();
 rounds.push({...input,number,taskId,state:'working',createdAt:now,createdBy:actor,events:[]});
 const task:Task={id:taskId,projectId:project.id,title:`Executivo · Revisão ${String(number).padStart(2,'0')} — ${input.request.trim().slice(0,100)}`,description:input.request,phase:input.phase,responsibleId:input.responsibleId,startDate:today,endDate:input.dueDate,priority:'alta',status:'a_fazer',completed:false,createdAt:now,updatedAt:now};
 return {project:{...project,executiveRevisions:rounds},task};
}
export function recordExecutiveEvent(project:Project,tasks:Task[],action:'send'|'approve',input:{date:string;note:string;recipient:string;link:string},by:string):Project{
 const rounds=structuredClone(project.executiveRevisions||[]),r=rounds.at(-1);if(!r)throw Error('Abra uma revisão primeiro.');
 if(!isValidDateString(input.date)||!input.note.trim()||(input.link&&!/^https?:\/\//i.test(input.link)))throw Error('Informe data, resumo e link válido (opcional).');
 if(action==='send'){
 const task=tasks.find(t=>t.id===r.taskId);if(r.state!=='working'||!task||!(task.completed||task.status==='concluida'))throw Error('Conclua a tarefa desta revisão no quadro antes de registrar o envio.');
 if(!input.recipient.trim())throw Error('Informe o destinatário.');r.state='waiting';
 }else{if(r.state!=='waiting')throw Error('Registre o envio antes da aprovação.');r.state='approved';}
 r.events.push({...input,by,action});return {...project,executiveRevisions:rounds};
}
