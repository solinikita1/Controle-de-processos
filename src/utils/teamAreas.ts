import {ArchitecturePhase,TeamMember} from '../types';import {areaForPhase}from'./workAreas';
export function departmentForPhase(phase:ArchitecturePhase){if(phase==='criacao_orcamento'||phase==='anteprojeto')return 'Orçamento';const area=areaForPhase(phase);return area==='criacao'?'Criação':area==='executivo'?'Executivo':area==='captacao'?'Comercial':'Operações';}
export function membersForPhase(members:TeamMember[],phase:ArchitecturePhase){const department=departmentForPhase(phase);return [...members].sort((a,b)=>Number(b.department===department)-Number(a.department===department));}
