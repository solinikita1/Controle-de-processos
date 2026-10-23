import test from 'node:test';
import assert from 'node:assert/strict';
import {creationTransition,CreationInput,CreationAction} from '../src/utils/creationFlow';
import {INITIAL_PROJECTS} from '../src/data/mockData';
import {projectSchema} from '../src/utils/backupValidation';
import {Project} from '../src/types';
const input:CreationInput={date:'2026-10-23',note:'Registro do cliente',recipient:'cliente@example.com',followUp:'2026-10-26',link:'https://example.com/proposta',scope:'both',projectOwner:'arquiteto',projectDue:'2026-10-27',budgetOwner:'orcamentista',budgetDue:'2026-10-28'};
const base:Project={...INITIAL_PROJECTS[0],currentPhase:'criacao_conceitual',creationRounds:undefined};
const step=(p:Project,a:CreationAction,i=input)=>creationTransition(p,a,i,'soli@workplace.arq.br');
function sent(){return ['concept','budget','present','send'].reduce((p,a)=>step(p,a as CreationAction),base);}
test('initial proposal enforces order and records sending without mutating original',()=>{
 assert.throws(()=>step(base,'send'));assert.throws(()=>step(base,'budget'));assert.throws(()=>step(base,'present'));
 const p=sent();assert.equal(p.creationRounds![0].state,'waiting');assert.equal(p.creationRounds![0].events.length,4);assert.equal(base.creationRounds,undefined);
 assert.equal(p.creationRounds![0].events[3].recipient,input.recipient);
});
test('numbered revisions preserve history and separate owners/deadlines, then approval awaits Award',()=>{
 const p=sent(), old=JSON.stringify(p.creationRounds);let next=step(p,'revise');
 assert.equal(JSON.stringify(p.creationRounds),old);assert.equal(next.creationRounds![1].number,1);
 assert.equal(next.creationRounds![1].projectWork!.responsibleId,'arquiteto');assert.equal(next.creationRounds![1].budgetWork!.dueDate,'2026-10-28');
 assert.throws(()=>step(next,'send'));next=step(step(next,'projectDone'),'budgetDone');next=step(next,'send');
 next=step(next,'revise',{...input,scope:'budget'});assert.equal(next.creationRounds![2].number,2);assert.equal(next.creationRounds![2].projectWork,undefined);
 next=step(step(next,'budgetDone'),'send');next=step(next,'approve');assert.equal(next.pipelineStage,'aguardando_award');assert.deepEqual(next.award,base.award);
 assert.throws(()=>step(next,'revise'));assert.deepEqual(projectSchema.parse(JSON.parse(JSON.stringify(next))).creationRounds,next.creationRounds);
});
test('invalid sending and revision requirements fail; closure preserves history',()=>{
 const p=sent();assert.throws(()=>step(p,'revise',{...input,projectOwner:''}));assert.throws(()=>step(p,'revise',{...input,budgetDue:'2026-10-22'}));
 const ready=step(step(step(base,'concept'),'budget'),'present');
 for(const patch of [{recipient:''},{note:''},{followUp:'2026-10-22'},{link:'javascript:alert(1)'}])assert.throws(()=>step(ready,'send',{...input,...patch}));
 const closed=step(p,'close');assert.equal(closed.status,'pausado');assert.equal(closed.creationRounds![0].events.length,5);
});
test('scheduling preserves ready state and presentation date; malformed backup rejected',()=>{
 const ready=step(step(base,'concept'),'budget');const p=step(ready,'schedule');assert.equal(p.creationRounds![0].state,'ready');assert.equal(p.creationRounds![0].events.at(-1)!.date,input.date);
 assert.equal(projectSchema.safeParse({...p,creationRounds:[{number:-1}]}).success,false);
});
