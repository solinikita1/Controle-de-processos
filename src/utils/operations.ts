import { Project, Task, TeamMember } from '../types';
export const taskDone = (t: Task) => t.completed || t.status === 'concluida';
export function localDay(date = new Date()) {
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function deadlineBucket(date: string, today: string) {
 const valid = (v:string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v;
 if(!valid(date)) return 'missing';
 if(date<today) return 'overdue';
 if(date===today) return 'today';
 const days=(Date.parse(date)-Date.parse(today))/86400000;
 return days<=7?'week':'later';
}
export function operations(projects:Project[], tasks:Task[], team:TeamMember[], today=localDay()) {
 const active=projects.filter(p=>!p.isArchived&&p.status!=='arquivado'&&p.status!=='entregue');
 const ids=new Set(active.map(p=>p.id)), members=new Set(team.map(m=>m.id));
 const open=tasks.filter(t=>ids.has(t.projectId)&&!taskDone(t));
 const priority={critica:0,alta:1,media:2,baixa:3};
 open.sort((a,b)=>(a.endDate||'9999').localeCompare(b.endDate||'9999') || priority[a.priority]-priority[b.priority] || a.title.localeCompare(b.title));
 return {active,open,
   unassigned:open.filter(t=>!members.has(t.responsibleId)),
   overdue:open.filter(t=>deadlineBucket(t.endDate,today)==='overdue'),
   dueToday:open.filter(t=>deadlineBucket(t.endDate,today)==='today'),
   week:open.filter(t=>deadlineBucket(t.endDate,today)==='week'),
   missing:open.filter(t=>deadlineBucket(t.endDate,today)==='missing'),
   workload:team.map(member=>({member,tasks:open.filter(t=>t.responsibleId===member.id)})).sort((a,b)=>b.tasks.length-a.tasks.length),
   projects:active.map(project=>{
     const all=tasks.filter(t=>t.projectId===project.id), pending=open.filter(t=>t.projectId===project.id);
     return {project,total:all.length,completed:all.filter(taskDone).length,pending,
       overdue:pending.filter(t=>deadlineBucket(t.endDate,today)==='overdue').length,
       next:pending.find(t=>deadlineBucket(t.endDate,today)!=='missing')};
   })
 };
}
