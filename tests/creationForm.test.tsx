import React from 'react';import {test} from 'node:test';import assert from 'node:assert/strict';import {act,create} from 'react-test-renderer';import {CreationFlow} from '../src/components/CreationFlow';import {INITIAL_PROJECTS,INITIAL_TEAM_MEMBERS} from '../src/data/mockData';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
test('failed creation save retains form and never displays false history',async()=>{
 let root:any,saved:any;await act(async()=>{root=create(<CreationFlow project={{...INITIAL_PROJECTS[0],currentPhase:'criacao_conceitual',award:undefined}} team={INITIAL_TEAM_MEMBERS} actor="tester" onSave={async p=>{saved=p;return false}}/>)});
 await act(async()=>root.root.findAllByType('button').find((b:any)=>b.props.children==='Concluir projeto conceitual').props.onClick());
 await act(async()=>root.root.findByType('form').props.onSubmit({preventDefault(){}}));
 assert.equal(saved.creationRounds[0].events.length,1);assert.equal(root.root.findAllByType('form').length,1);assert.match(root.root.findByProps({role:'alert'}).props.children,/Não foi possível/);
 assert.match(JSON.stringify(root.toJSON()),/Sem registros neste ciclo/);await act(async()=>root.unmount());
});

