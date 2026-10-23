import { z } from "zod";
import type { BackupPayload } from "../types";
import { isValidDateString } from "./dateUtils";

const id = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[^/]+$/);
const date = z.string().refine(isValidDateString, "Data inválida");
const text = z.string();
const nonempty = text.trim().min(1);
const timestamp = text.refine(
  (v) => Number.isFinite(Date.parse(v)),
  "Timestamp inválido",
);
const phase = z.enum([
  "captacao_briefing",
  "criacao_conceitual",
  "criacao_orcamento",
  "criacao_apresentacao",
  "executivo_plantas",
  "executivo_complementares",
  "executivo_aprovacao_condominio",
  "executivo_seguros_documentos",
  "acompanhamento_obra",
  "estudo_preliminar",
  "anteprojeto",
  "projeto_legal",
  "projeto_executivo",
  "detalhamento",
]);
const program = z
  .object({
    workstations: z.number().nonnegative().optional(),
    meetingRooms: z.number().nonnegative().optional(),
    focusPods: z.number().nonnegative().optional(),
    specialRooms: text.optional(),
    hasServerRoom: z.boolean().optional(),
    expansionForecast: text.optional(),
    hasWellnessArea: z.boolean().optional(),
    wellnessDetails: text.optional(),
  })
  .passthrough();
const briefing = z
  .object({
    submittedAt: nonempty,
    submittedByMemberId: id,
    submittedByName: nonempty,
    documentsFolderUrl: text,
    programOfNeeds: program,
    premisesAndAlerts: text,
    targetKickoffDate: date,
    clientDeadlines: text,
    readyForDesignTeam: z.boolean(),
    updatedAt: text.optional(),
    clientContactPerson: text.optional(),
    clientContactEmail: text.optional(),
    clientContactPhone: text.optional(),
    clientContactRole: text.optional(),
    negotiationNotes: text.optional(),
    negotiationModel: z
      .enum([
        "bts",
        "capex_direto",
        "turnkey",
        "taxa_administracao",
        "projeto_arquitetura",
        "outro",
      ])
      .optional(),
    estimatedBudgetRange: text.optional(),
    commercialObservations: text.optional(),
  })
  .passthrough();
const creationWork = z.object({taskId:id.optional(),responsibleId:text,dueDate:z.union([z.literal(''),date]),done:z.boolean()});
const creationRound = z.object({number:z.number().int().nonnegative(),scope:z.enum(['initial','project','budget','both']),request:text,state:z.enum(['draft','ready','presented','waiting','approved','closed']),projectWork:creationWork.optional(),budgetWork:creationWork.optional(),presentationWork:creationWork.optional(),events:z.array(z.object({id,at:timestamp,by:nonempty,action:z.enum(['concept','budget','schedule','present','send','revise','projectDone','budgetDone','approve','close']),date,note:text,link:text,recipient:text,followUp:z.union([z.literal(''),date])}))});
export const projectSchema = z
  .object({
    id,
    creationRounds: z.array(creationRound).optional(),
    executiveRevisions:z.array(z.object({number:z.number().int().positive(),phase,request:nonempty,responsibleId:id,dueDate:date,taskId:id,state:z.enum(['working','waiting','approved','superseded']),createdAt:timestamp,createdBy:nonempty,events:z.array(z.object({action:z.enum(['send','approve']),date,by:nonempty,note:nonempty,recipient:text,link:text}))})).optional(),
    code: nonempty,
    name: nonempty,
    client: nonempty,
    location: text,
    areaM2: z.number().nonnegative(),
    description: text,
    typology: z.enum([
      "Escritório Corporativo",
      "Hub de Inovação",
      "Sede Institucional",
      "Coworking",
      "Retrofit Comercial",
      "Data Center & Tech",
    ]),
    status: z.enum([
      "briefing",
      "desenvolvimento",
      "aprovacao",
      "obra",
      "pausado",
      "entregue",
      "arquivado",
    ]),
    currentPhase: phase,
    startDate: date,
    targetEndDate: date,
    teamMemberIds: z.array(id),
    createdAt: timestamp,
    priority: z
      .enum(["p1_urgente", "p2_alta", "p3_media", "p4_baixa"])
      .optional(),
    pipelineStage: z
      .enum([
        "captacao_esteira",
        "criacao_andamento",
        "aguardando_award",
        "executivo_pos_award",
        "obra_implantacao",
        "briefing_rascunho",
        "briefing_concluido",
        "em_esteira_iniciacao",
        "desenvolvimento_ativo",
        "entregue",
      ])
      .optional(),
    pipelineOrder: z.number().optional(),
    entryDate: date.optional(),
    briefing: briefing.optional(),
    award: z
      .object({
        status: z.enum(["em_concorrencia", "awarded", "declinado"]),
        awardedAt: text.optional(),
        awardValueBRL: z.number().nonnegative().optional(),
        clientDecisionMaker: text.optional(),
        notes: text.optional(),
      })
      .optional(),
    isArchived: z.boolean().optional(),
    archivedAt: text.optional(),
    archivedReason: text.optional(),
    estimatedBudgetBRL: z.number().nonnegative().optional(),
    notes: text.optional(),
  })
  .passthrough()
  .refine((p) => p.startDate <= p.targetEndDate, "Datas do projeto invertidas");
export const taskSchema = z
  .object({
    id,
    projectId: id,
    title: nonempty,
    description: text.optional(),
    phase,
    responsibleId: id,
    startDate: date,
    endDate: date,
    priority: z.enum(["baixa", "media", "alta", "critica"]),
    status: z.enum(["a_fazer", "em_andamento", "em_revisao", "concluida"]),
    completed: z.boolean(),
    deliverables: text.optional(),
    checklist: z
      .array(z.object({ id, text, completed: z.boolean() }))
      .optional(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .passthrough()
  .refine((t) => t.startDate <= t.endDate, "Datas da tarefa invertidas")
  .refine(
    (t) => t.completed === (t.status === "concluida"),
    "Status e conclusão inconsistentes",
  );
export const teamSchema = z
  .object({
    id,
    name: nonempty,
    role: nonempty,
    email: z.email(),
    initials: nonempty,
    avatarColor: text,
    department: text,
    isDirector: z.boolean().optional(),
    phone: text.optional(),
    cau: text.optional(),
  })
  .passthrough();
const payloadSchema = z
  .object({
    version: z.literal("5.0.0").default("5.0.0"),
    systemName: text.default("Workplace Arquitetura Corporativa"),
    exportedAt: timestamp.default(() => new Date().toISOString()),
    exportedBy: text.optional(),
    projects: z.array(projectSchema),
    tasks: z.array(taskSchema),
    team: z.array(teamSchema),
  })
  .superRefine((data, ctx) => {
    for (const key of ["projects", "tasks", "team"] as const) {
      if (new Set(data[key].map((x) => x.id)).size !== data[key].length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "IDs duplicados",
        });
    }
    const projects = new Set(data.projects.map((p) => p.id)),
      team = new Set(data.team.map((m) => m.id));
    data.tasks.forEach((t, i) => {
      if (!projects.has(t.projectId))
        ctx.addIssue({
          code: "custom",
          path: ["tasks", i, "projectId"],
          message: "Projeto inexistente",
        });
      if (!team.has(t.responsibleId))
        ctx.addIssue({
          code: "custom",
          path: ["tasks", i, "responsibleId"],
          message: "Responsável inexistente",
        });
    });
    data.projects.forEach((p, i) => {
      if (p.teamMemberIds.some((member) => !team.has(member)))
        ctx.addIssue({
          code: "custom",
          path: ["projects", i, "teamMemberIds"],
          message: "Membro inexistente",
        });
    });
  });

export function validateBackupPayload(value: unknown): {
  valid: boolean;
  payload?: BackupPayload;
  error?: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { valid: false, error: "Objeto de backup inválido." };
  const input = value as Record<string, unknown>;
  // Compatibility with JSON exported by the old header.
  const result = payloadSchema.safeParse({
    ...input,
    team: input.team ?? input.teamMembers,
  });
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      valid: false,
      error: `Backup inválido (${issue.path.join(".") || "arquivo"}): ${issue.message}`,
    };
  }
  return { valid: true, payload: result.data as BackupPayload };
}
