import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {ProjectModal} from '../src/components/ProjectModal';
import {TaskModal} from '../src/components/TaskModal';
import {BriefingModal} from '../src/components/BriefingModal';
import {INITIAL_PROJECTS,INITIAL_TEAM_MEMBERS} from '../src/data/mockData';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
const submit=async(root:any)=>act(async()=>root.root.findByType('form').props.onSubmit({preventDefault(){}}));
for(const Component of [ProjectModal,BriefingModal]) {
  test(`${Component.name} preserves Award and archive metadata on edit`,async()=>{
    const original={...INITIAL_PROJECTS[0],award:{marker:'keep'},isArchived:true,archivedAt:'2026-10-23T12:00:00.000Z',archivedReason:'keep',estimatedBudgetBRL:12345} as any;
    let saved:any,root:any;
    await act(async()=>{root=create(<Component isOpen onClose={()=>{}} onSave={async p=>{saved=p;return true;}} projectToEdit={original} allTeamMembers={INITIAL_TEAM_MEMBERS}/>)});
    await submit(root);
    assert.ok(saved,'valid existing project must save');
    assert.deepEqual(saved.award,original.award);
    assert.equal(saved.isArchived,true);
    assert.equal(saved.archivedReason,'keep');
    assert.equal(saved.estimatedBudgetBRL,12345);
    await act(async()=>root.unmount());
  });
}
test('project rejects missing required values and remains open after failed save',async()=>{
  let saved=0,closed=0,root:any;
  const props={isOpen:true,onClose:()=>{closed++},onSave:async()=>{saved++;return false},allTeamMembers:INITIAL_TEAM_MEMBERS};
  await act(async()=>{root=create(<ProjectModal {...props}/>)});
  await submit(root); assert.equal(saved,0);
  await act(async()=>root.update(<ProjectModal {...props} projectToEdit={INITIAL_PROJECTS[0]}/>));
  await submit(root); assert.equal(saved,1);assert.equal(closed,0);
  await act(async()=>root.unmount());
});
test('task rejects missing title, creates valid task and waits for save success',async()=>{
 let saved:any,closed=0,root:any;
 await act(async()=>{root=create(<TaskModal isOpen projectId={INITIAL_PROJECTS[0].id} projectTeam={INITIAL_TEAM_MEMBERS} allTeamMembers={INITIAL_TEAM_MEMBERS} onClose={()=>closed++} onSave={async t=>{saved=t;return false}}/>)});
 await submit(root); assert.equal(saved,undefined);
 const title=root.root.findAllByType('input').find((i:any)=>i.props.type==='text');
 await act(async()=>title!.props.onChange({target:{value:'Temporary test'}}));
 await submit(root);assert.equal(saved.title,'Temporary test');assert.equal(saved.status,'a_fazer');assert.equal(saved.completed,false);assert.equal(closed,0);
 await act(async()=>root.root.findByProps({id:'task-completed-toggle'}).props.onChange({target:{checked:true}}));
 await submit(root);assert.equal(saved.status,'concluida');assert.equal(saved.completed,true);
 await act(async()=>root.unmount());
});

test('new briefing validates required fields then creates a demand with an existing responsible',async()=>{
 let saved:any,closed=0,root:any;
 await act(async()=>{root=create(<BriefingModal isOpen allTeamMembers={INITIAL_TEAM_MEMBERS} onClose={()=>closed++} onSave={async p=>{saved=p;return true}}/>)});
 await submit(root);assert.equal(saved,undefined);
 await act(async()=>{
   root.root.findByProps({placeholder:'Ex: Sede Corporativa Pinheiros - Omni Logística'}).props.onChange({target:{value:'Briefing de teste'}});
   root.root.findByProps({placeholder:'Ex: Omni Logística e Soluções Globais S.A.'}).props.onChange({target:{value:'Cliente de teste'}});
 });
 await submit(root);assert.equal(saved.name,'Briefing de teste');assert.equal(saved.currentPhase,'captacao_briefing');assert.equal(closed,1);
 assert.ok(INITIAL_TEAM_MEMBERS.some(m=>m.id===saved.briefing.submittedByMemberId));
 await act(async()=>root.unmount());
});
