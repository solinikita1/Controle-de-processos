import {Project,CreationRound,CreationEvent,CreationWork} from '../types';
import {isValidDateString} from './dateUtils';
export type CreationAction='concept'|'budget'|'schedule'|'present'|'send'|'revise'|'projectDone'|'budgetDone'|'approve'|'close';
export interface CreationInput {date:string;note:string;link:string;recipient:string;followUp:string;scope:'project'|'budget'|'both';projectOwner:string;projectDue:string;budgetOwner:string;budgetDue:string;}
export function initialRound(project:Project):CreationRound {
 const ready=['criacao_apresentacao'].includes(project.currentPhase);
 return {number:0,scope:'initial',request:'Proposta inicial',state:ready?'ready':'draft',events:[],
 projectWork:{responsibleId:'',dueDate:'',done:ready||['criacao_orcamento','anteprojeto'].includes(project.currentPhase)},
 budgetWork:{responsibleId:'',dueDate:'',done:ready}};
}
export function creationTransition(project:Project,action:CreationAction,input:CreationInput,by:string,now=new Date().toISOString()):Project {
 const rounds:CreationRound[]=structuredClone(project.creationRounds?.length?project.creationRounds:[initialRound(project)]);
 let round=rounds[rounds.length-1];
 if(['approved','closed'].includes(round.state)) throw Error('Esta rodada já foi encerrada.');
 if(!isValidDateString(input.date)) throw Error('Informe uma data válida para o registro.');
 if(input.link && !/^https?:\/\//i.test(input.link)) throw Error('Use um link http ou https.');
 let phase=project.currentPhase, pipeline=project.pipelineStage;
 const ready=()=> !round.projectWork || round.projectWork.done;
 const allDone=()=>ready()&&(!round.budgetWork||round.budgetWork.done);
 if(action==='concept'||action==='projectDone') {
  if(round.state!=='draft'||!round.projectWork||round.projectWork.done) throw Error('Projeto não está pendente nesta rodada.');
  round.projectWork.done=true; phase=round.budgetWork&&!round.budgetWork.done?'criacao_orcamento':'criacao_apresentacao';
  if(allDone()) round.state='ready';
 } else if(action==='budget'||action==='budgetDone') {
  if(round.state!=='draft'||!round.budgetWork||round.budgetWork.done||!ready()) throw Error('Conclua primeiro a revisão do projeto.');
  round.budgetWork.done=true; phase='criacao_apresentacao'; if(allDone())round.state='ready';
 } else if(action==='schedule') {
  if(!['ready','presented'].includes(round.state))throw Error('Conclua a proposta antes de agendar.');
 } else if(action==='present') {
  if(!['ready','presented'].includes(round.state))throw Error('Conclua projeto e orçamento antes de apresentar.');
  round.state='presented'; phase='criacao_apresentacao';
 } else if(action==='send') {
  if(!(round.state==='presented'||round.number>0&&round.state==='ready'))throw Error('Registre a apresentação inicial ou conclua a revisão antes do envio.');
  if(!input.recipient.trim()||!input.note.trim()) throw Error('Informe destinatário e o resumo da versão enviada.');
  if(!isValidDateString(input.followUp)||input.followUp<input.date)throw Error('Informe uma data de acompanhamento igual ou posterior ao envio.');
  round.state='waiting'; phase='criacao_apresentacao';
 } else if(action==='revise') {
  if(round.state!=='waiting')throw Error('Registre o envio antes do retorno do cliente.');
  if(!input.note.trim())throw Error('Descreva o pedido do cliente.');
  const work=(owner:string,due:string):CreationWork=>{if(!owner||!isValidDateString(due)||due<input.date)throw Error('Informe responsável e prazo válido para cada revisão.');return {responsibleId:owner,dueDate:due,done:false};};
  round={number:round.number+1,scope:input.scope,request:input.note.trim(),state:'draft',events:[]};
  if(input.scope!=='budget')round.projectWork=work(input.projectOwner,input.projectDue);
  if(input.scope!=='project')round.budgetWork=work(input.budgetOwner,input.budgetDue);
  rounds.push(round); phase=input.scope==='budget'?'criacao_orcamento':'criacao_conceitual'; pipeline='criacao_andamento';
 } else if(action==='approve'||action==='close') {
  if(round.state!=='waiting')throw Error('A aprovação ou encerramento exige uma proposta enviada.');
  if(!input.note.trim())throw Error('Registre o retorno do cliente.');
  round.state=action==='approve'?'approved':'closed';
  if(action==='approve')pipeline='aguardando_award';
 }
 const event:CreationEvent={id:crypto.randomUUID(),at:now,by,action,date:input.date,note:input.note.trim(),link:input.link.trim(),recipient:action==='send'?input.recipient.trim():'',followUp:action==='send'?input.followUp:''};
 round.events.push(event);
 return {...project,currentPhase:phase,pipelineStage:pipeline||'criacao_andamento',...(action==='close'?{status:'pausado' as const}:{}),creationRounds:rounds};
}
