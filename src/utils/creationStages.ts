import {ArchitecturePhase,Task} from '../types';
export const creationStages=[
 {id:'criacao_conceitual' as const,title:'Desenvolvimento do Projeto',description:'Conceito, layout, estudos e revisões do projeto.'},
 {id:'criacao_orcamento' as const,title:'Desenvolvimento do Orçamento',description:'Quantitativos, custos, cotações e revisões do orçamento.'},
 {id:'criacao_apresentacao' as const,title:'Desenvolvimento da Apresentação',description:'Montagem, revisão e preparação do material para o cliente.'}
];
export function canonicalCreationPhase(phase:ArchitecturePhase){return phase==='estudo_preliminar'?'criacao_conceitual':phase==='anteprojeto'?'criacao_orcamento':phase;}
export function tasksInCreationStage(tasks:Task[],phase:ArchitecturePhase){return tasks.filter(t=>canonicalCreationPhase(t.phase)===phase);}
