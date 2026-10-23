import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProjectPdf, generateStudioPdf } from '../src/utils/pdfGenerator';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_TEAM_MEMBERS } from '../src/data/mockData';
test('project PDF paginates long notes and retains official brand without legacy title',()=>{
 const pdf=generateProjectPdf({...INITIAL_PROJECTS[0],notes:'Texto longo de coordenação. '.repeat(1000)},INITIAL_TASKS,INITIAL_TEAM_MEMBERS);
 assert.ok(pdf.getNumberOfPages()>3);
 const output=pdf.output();
 assert.ok(output.includes('/Subtype /Image'));
 assert.ok(!output.includes('ArchOffice'));
 assert.ok(output.includes('Texto longo'));
});
test('consolidated PDF uses only tasks belonging to selected projects',()=>{
 const p=INITIAL_PROJECTS[0];
 const foreign={...INITIAL_TASKS[0],id:'foreign',projectId:'other',title:'EXCLUDED FOREIGN TASK'};
 const a=generateStudioPdf([p],INITIAL_TASKS,INITIAL_TEAM_MEMBERS);
 const b=generateStudioPdf([p],[...INITIAL_TASKS,foreign],INITIAL_TEAM_MEMBERS);
 assert.equal(a.getNumberOfPages(),b.getNumberOfPages());
 // Compare page drawing commands, excluding generated PDF identifiers and creation metadata.
 assert.deepEqual((a as any).internal.pages,(b as any).internal.pages);
});
test('empty report still produces a branded A4 page',()=>{
 const pdf=generateStudioPdf([],[],[]);
 assert.equal(Math.round(pdf.internal.pageSize.getWidth()),210);
 assert.equal(Math.round(pdf.internal.pageSize.getHeight()),297);
 assert.ok(pdf.output().includes('/Subtype /Image'));
});
