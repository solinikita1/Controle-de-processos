import {ArchitecturePhase,Task} from '../types';
export type WorkArea='captacao'|'criacao'|'executivo'|'obra';
export const areaNames:Record<WorkArea,string>={captacao:'Captação & Esteira',criacao:'Área de Criação',executivo:'Projeto Executivo',obra:'Acompanhamento de Obra'};
export function areaForPhase(phase:ArchitecturePhase):WorkArea {if(phase==='captacao_briefing')return 'captacao';if(phase==='acompanhamento_obra')return 'obra';if(['criacao_conceitual','criacao_orcamento','criacao_apresentacao','estudo_preliminar','anteprojeto'].includes(phase))return 'criacao';return 'executivo';}
export const firstPhase:Record<WorkArea,ArchitecturePhase>={captacao:'captacao_briefing',criacao:'criacao_conceitual',executivo:'executivo_plantas',obra:'acompanhamento_obra'};
export const tasksInArea=(tasks:Task[],projectId:string,area:WorkArea)=>tasks.filter(t=>t.projectId===projectId&&areaForPhase(t.phase)===area);
