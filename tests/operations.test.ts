import test from 'node:test';
import assert from 'node:assert/strict';
import {operations,deadlineBucket} from '../src/utils/operations';
import {INITIAL_PROJECTS,INITIAL_TASKS,INITIAL_TEAM_MEMBERS} from '../src/data/mockData';
const p={...INITIAL_PROJECTS[0],id:'active',status:'desenvolvimento' as const};
const t={...INITIAL_TASKS[0],projectId:'active',completed:false,status:'a_fazer' as const,endDate:'2026-10-22'};
test('deadline boundaries include today and seven future calendar days',()=>{
 assert.equal(deadlineBucket('2026-10-22','2026-10-23'),'overdue');
 assert.equal(deadlineBucket('2026-10-23','2026-10-23'),'today');
 assert.equal(deadlineBucket('2026-10-30','2026-10-23'),'week');
 assert.equal(deadlineBucket('2026-10-31','2026-10-23'),'later');
 assert.equal(deadlineBucket('2026-02-30','2026-10-23'),'missing');
 assert.equal(deadlineBucket('','2026-10-23'),'missing');
});
test('completed and archived work never inflates operational urgency or workload',()=>{
 const data=operations([p,{...p,id:'archive',isArchived:true}], [t,{...t,id:'done',status:'concluida'},{...t,id:'arch',projectId:'archive'}],INITIAL_TEAM_MEMBERS,'2026-10-23');
 assert.equal(data.open.length,1); assert.equal(data.overdue.length,1);
 assert.equal(data.projects[0].total,2); assert.equal(data.projects[0].completed,1);
});
test('unknown responsible is flagged and zero task projects are retained',()=>{
 const data=operations([p,{...p,id:'empty'}],[{...t,responsibleId:'missing'}],INITIAL_TEAM_MEMBERS,'2026-10-23');
 assert.equal(data.unassigned.length,1); assert.equal(data.projects[1].total,0);
 assert.equal(data.workload.reduce((n,m)=>n+m.tasks.length,0),0);
});
