import { ArchitecturePhaseInfo, Project, TeamMember, Task } from '../types';

export const ARCHITECTURE_PHASES: ArchitecturePhaseInfo[] = [
  {
    id: 'captacao_briefing',
    name: '1. Captação & Encaixe na Esteira',
    shortName: '1. Esteira',
    description: 'Entrada da nova demanda pelo Comercial, documentos na pasta de rede/SharePoint, briefing corporativo e ordenação na esteira com prioridade.',
    color: '#EC4899', // Rosa
    stageGroup: 'esteira'
  },
  {
    id: 'criacao_conceitual',
    name: '2.1 Criação: Projeto Conceitual',
    shortName: '2.1 Conceito',
    description: 'Área de Criação: desenvolvimento do projeto conceitual, layout espacial, volumetria 3D, salas acústicas e área wellness.',
    color: '#8B5CF6', // Roxo
    stageGroup: 'criacao'
  },
  {
    id: 'criacao_orcamento',
    name: '2.2 Criação: Orçamento do Cliente',
    shortName: '2.2 Orçamento',
    description: 'Área de Criação: desenvolvimento da planilha orçamentária do cliente, estimativa de CAPEX da obra, marcenaria e complementares.',
    color: '#3B82F6', // Azul
    stageGroup: 'criacao'
  },
  {
    id: 'criacao_apresentacao',
    name: '2.3 Criação: Apresentação (Conceito + Orçamento)',
    shortName: '2.3 Apresentação',
    description: 'Área de Criação: montagem e defesa da apresentação com os dois conteúdos (Conceito + Orçamento) para o cliente fechar o Award.',
    color: '#EAB308', // Dourado/Âmbar
    stageGroup: 'criacao'
  },
  {
    id: 'executivo_plantas',
    name: '3.1 Executivo: Todas as Plantas',
    shortName: '3.1 Plantas',
    description: 'Segundo Momento da Esteira (Pós-Award): emissão de todas as plantas de demolição, construção, piso elevado, forro, marcenaria e divisórias.',
    color: '#0EA5E9', // Ciano
    stageGroup: 'executivo'
  },
  {
    id: 'executivo_complementares',
    name: '3.2 Executivo: Complementares (Engenharias)',
    shortName: '3.2 Complementares',
    description: 'Engenharias complementares integradas: elétrica e dados, hidráulica, ar-condicionado (VRF) e combate ao incêndio (AVCB / Sprinklers).',
    color: '#06B6D4', // Ciano escuro
    stageGroup: 'executivo'
  },
  {
    id: 'executivo_aprovacao_condominio',
    name: '3.3 Executivo: Aprovação no Condomínio',
    shortName: '3.3 Condomínio',
    description: 'Aprovação junto à administração e engenharia do condomínio onde será a obra: análise de carga, ART/RRT e liberação de acesso.',
    color: '#F59E0B', // Laranja
    stageGroup: 'executivo'
  },
  {
    id: 'executivo_seguros_documentos',
    name: '3.4 Executivo: Seguros & Docs Obrigatórios',
    shortName: '3.4 Seguros & Docs',
    description: 'Seguro Risco de Engenharia (RC Obras), apólices, PGR, PCMSO, ASO e documentos obrigatórios do cliente e prestadores.',
    color: '#10B981', // Esmeralda
    stageGroup: 'executivo'
  },
  {
    id: 'acompanhamento_obra',
    name: '4. Implantação & Acompanhamento de Obra',
    shortName: '4. Obra',
    description: 'Acompanhamento técnico presencial, conferência de acabamentos corporativos e entrega das chaves da nova sede.',
    color: '#64748B', // Ardósia
    stageGroup: 'obra'
  },
  // Aliases legados para compatibilidade com dados existentes:
  {
    id: 'estudo_preliminar',
    name: '2.1 Criação: Projeto Conceitual (Estudo Preliminar)',
    shortName: '2.1 Conceito',
    description: 'Projeto conceitual, layout preliminar e zoneamento de postos e salas acústicas.',
    color: '#8B5CF6',
    stageGroup: 'criacao'
  },
  {
    id: 'anteprojeto',
    name: '2.2 Criação: Orçamento & Defesa',
    shortName: '2.2 Orçamento',
    description: 'Desenvolvimento do orçamento do cliente e layout detalhado.',
    color: '#3B82F6',
    stageGroup: 'criacao'
  },
  {
    id: 'projeto_legal',
    name: '3.3 Executivo: Aprovação Condomínio & Legal',
    shortName: '3.3 Condomínio',
    description: 'Aprovação de condomínio e adequações legais de bombeiros e acessibilidade.',
    color: '#F59E0B',
    stageGroup: 'executivo'
  },
  {
    id: 'projeto_executivo',
    name: '3.1 Executivo: Plantas & Complementares',
    shortName: '3.1 Executivo',
    description: 'Todas as plantas de arquitetura e projetos complementares.',
    color: '#0EA5E9',
    stageGroup: 'executivo'
  },
  {
    id: 'detalhamento',
    name: '3.1 Executivo: Detalhamento & Marcenaria',
    shortName: '3.1 Detalhamento',
    description: 'Detalhamento de marcenaria especial e divisórias acústicas.',
    color: '#10B981',
    stageGroup: 'executivo'
  }
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team-soli',
    name: 'Solimar Isaac (Soli)',
    role: 'CSO · Criadora & Desenvolvedora do Produto',
    email: 'solimar.isaac@gmail.com',
    phone: '(11) 98123-0001',
    initials: 'SI',
    avatarColor: 'bg-amber-600 text-white',
    department: 'Diretoria',
    isDirector: true
  },
  {
    id: 'team-thais',
    name: 'Thaís Trentin',
    role: 'CEO',
    email: 'thais@workplace.arq.br',
    phone: '(11) 98721-1102',
    initials: 'TT',
    avatarColor: 'bg-sky-700 text-white',
    department: 'Diretoria',
    isDirector: true
  },
  {
    id: 'team-mauricio',
    name: 'Maurício Lima',
    role: 'Engenheiro & Head de Operações',
    email: 'mauricio@workplace.arq.br',
    phone: '(11) 97340-7708',
    initials: 'ML',
    avatarColor: 'bg-indigo-700 text-white',
    department: 'Operações'
  },
  {
    id: 'team-leonardo',
    name: 'Leonardo Augusto',
    role: 'Head de Negócios',
    email: 'leonardo@workplace.arq.br',
    phone: '(11) 98112-4405',
    initials: 'LA',
    avatarColor: 'bg-violet-700 text-white',
    department: 'Negócios'
  },
  {
    id: 'team-cecilia',
    name: 'Cecília Michelan',
    role: 'Financeiro',
    email: 'cecilia@workplace.arq.br',
    phone: '(11) 99120-5506',
    initials: 'CM',
    avatarColor: 'bg-teal-700 text-white',
    department: 'Financeiro'
  },
  {
    id: 'team-viviane-c',
    name: 'Viviane Camilli Leone',
    role: 'Arquiteta',
    email: 'viviane.camilli@workplace.arq.br',
    phone: '(11) 99341-2203',
    initials: 'VC',
    avatarColor: 'bg-emerald-700 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-marion',
    name: 'Marion Scalzaretto',
    role: 'Arquiteta',
    email: 'marion@workplace.arq.br',
    phone: '(11) 97412-3304',
    initials: 'MS',
    avatarColor: 'bg-amber-700 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-ingrid',
    name: 'Ingrid Patricio',
    role: 'Arquiteta',
    email: 'ingrid@workplace.arq.br',
    phone: '(11) 98450-6607',
    initials: 'IP',
    avatarColor: 'bg-rose-700 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-anacarolina',
    name: 'Ana Carolina',
    role: 'Arquiteta',
    email: 'anacarolina@workplace.arq.br',
    phone: '(11) 99650-8809',
    initials: 'AC',
    avatarColor: 'bg-purple-700 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-demi',
    name: 'Demi Amorim',
    role: 'Arquiteto',
    email: 'demi@workplace.arq.br',
    phone: '(11) 98701-9910',
    initials: 'DA',
    avatarColor: 'bg-orange-700 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-monica',
    name: 'Mônica',
    role: 'Arquiteta',
    email: 'monica@workplace.arq.br',
    phone: '(11) 97200-1011',
    initials: 'MO',
    avatarColor: 'bg-stone-800 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-tatiane',
    name: 'Tatiane Silva',
    role: 'Arquiteta',
    email: 'tatiane@workplace.arq.br',
    phone: '(11) 99812-2012',
    initials: 'TS',
    avatarColor: 'bg-sky-800 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-talita',
    name: 'Talita',
    role: 'Arquiteta',
    email: 'talita@workplace.arq.br',
    phone: '(11) 98640-7017',
    initials: 'TA',
    avatarColor: 'bg-amber-800 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-felipe',
    name: 'Felipe Cardoso',
    role: 'Arquiteto',
    email: 'felipe@workplace.arq.br',
    phone: '(11) 98120-5015',
    initials: 'FC',
    avatarColor: 'bg-emerald-800 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-viviana-m',
    name: 'Viviana Mussia',
    role: 'Arquiteta',
    email: 'viviana.mussia@workplace.arq.br',
    phone: '(11) 99230-6016',
    initials: 'VM',
    avatarColor: 'bg-blue-800 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-patricia',
    name: 'Patrícia Damasceno',
    role: 'Arquiteta',
    email: 'patricia@workplace.arq.br',
    phone: '(11) 97530-8018',
    initials: 'PD',
    avatarColor: 'bg-yellow-800 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-julia',
    name: 'Júlia Gomes',
    role: 'Arquiteta',
    email: 'julia@workplace.arq.br',
    phone: '(11) 99420-9019',
    initials: 'JG',
    avatarColor: 'bg-teal-800 text-white',
    department: 'Projetos'
  },
  {
    id: 'team-fernanda',
    name: 'Fernanda',
    role: 'Comercial',
    email: 'fernanda@workplace.arq.br',
    phone: '(11) 99340-4014',
    initials: 'FE',
    avatarColor: 'bg-pink-700 text-white',
    department: 'Comercial'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-5',
    code: 'CORP-2026-05',
    name: 'Sede Corporativa & Tech Lab Pinheiros - Omni Logística',
    client: 'Omni Logística e Soluções Globais',
    location: 'Rua Butantã, 468 - 10º andar, Pinheiros, São Paulo - SP',
    areaM2: 2100,
    typology: 'Escritório Corporativo',
    description: 'Nova sede corporativa com 140 posições de trabalho, open space dinâmico, 8 salas de reunião acústicas com Teams Rooms, cafeteria central gourmet e estúdio de gravação para treinamentos corporativos.',
    status: 'briefing',
    currentPhase: 'captacao_briefing',
    priority: 'p1_urgente',
    pipelineStage: 'briefing_concluido',
    pipelineOrder: 1,
    entryDate: '2026-10-21',
    startDate: '2026-10-28',
    targetEndDate: '2027-03-15',
    estimatedBudgetBRL: 2950000,
    teamMemberIds: ['team-soli', 'team-thais', 'team-leonardo', 'team-fernanda', 'team-viviane-c', 'team-ingrid'],
    createdAt: '2026-10-21',
    briefing: {
      submittedAt: '2026-10-21 11:30',
      submittedByMemberId: 'team-leonardo',
      submittedByName: 'Leonardo Augusto (Head de Negócios)',
      documentsFolderUrl: 'https://workplace.sharepoint.com/sites/projetos/2026/CORP-2026-05-Omni-Pinheiros',
      clientContactPerson: 'Roberto Albuquerque',
      clientContactEmail: 'roberto.albuquerque@omnilog.com.br',
      clientContactPhone: '(11) 98991-4433',
      clientContactRole: 'VP de Operações e Facilities & Real Estate',
      negotiationModel: 'bts',
      negotiationNotes: 'Contrato Built to Suit (BTS) de 10 anos estruturado com Fundo Imobiliário proprietário do edifício. A Workplace Arquitetura é contratada para projeto conceitual, executivo e coordenação total das engenharias complementares.',
      programOfNeeds: {
        workstations: 140,
        meetingRooms: 8,
        focusPods: 6,
        specialRooms: 'Estúdio de gravação e podcast, Diretoria acústica, Auditório flexível para 60 pessoas, Cafeteria gourmet',
        hasServerRoom: true,
        expansionForecast: '20% em 18 meses',
        hasWellnessArea: true,
        wellnessDetails: 'Espaço Wellness Corporativo de 85 m² com sala de descompressão, poltronas de massagem, lactário para colaboradoras, biofilia ativa e vestiários privativos para ciclistas.'
      },
      premisesAndAlerts: 'Condomínio restringe obras ruidosas aos finais de semana e noites. Piso elevado existente de 12cm precisa de substituição parcial de placas. Isolamento acústico entre diretoria e open space é primordial (Rw mínimo de 50 dB).',
      targetKickoffDate: '2026-10-28',
      estimatedBudgetRange: 'R$ 2.800.000 a R$ 3.100.000 (CAPEX Imobiliário)',
      clientDeadlines: 'Inauguração inegociável em 15/03/2027 devido ao vencimento do aluguel anterior.',
      commercialObservations: 'Demanda prioritária fechada pela diretoria. Leonardo organizou os documentos técnicos (DWG de arquitetura do prédio, fotos da laje vazia e manual de reformas do condomínio) diretamente na pasta do SharePoint.',
      readyForDesignTeam: true
    },
    notes: 'Documentos do edifício carregados pelo Head de Negócios na pasta oficial do SharePoint. Aguardando alocação dos arquitetos para início do Estudo Preliminar.'
  },
  {
    id: 'proj-1',
    code: 'CORP-2026-01',
    name: 'Sede FinTech Nexus - Edifício Plaza Faria Lima',
    client: 'Nexus Soluções Financeiras S.A.',
    location: 'Av. Brigadeiro Faria Lima, 3477 - 12º e 14º andares, Itaim Bibi, São Paulo - SP',
    areaM2: 3200,
    typology: 'Escritório Corporativo',
    description: 'Projeto corporativo completo com open spaces colaborativos, 24 salas de reunião acústicas com videoconferência, auditório flexível para 120 pessoas, cafeteria central e sala de descompressão com certificação LEED Gold.',
    status: 'desenvolvimento',
    currentPhase: 'projeto_executivo',
    priority: 'p1_urgente',
    pipelineStage: 'desenvolvimento_ativo',
    pipelineOrder: 2,
    entryDate: '2026-08-01',
    startDate: '2026-08-10',
    targetEndDate: '2026-12-15',
    estimatedBudgetBRL: 4850000,
    teamMemberIds: ['team-soli', 'team-thais', 'team-leonardo', 'team-ingrid', 'team-marion', 'team-cecilia'],
    createdAt: '2026-08-01',
    briefing: {
      submittedAt: '2026-08-01 09:00',
      submittedByMemberId: 'team-leonardo',
      submittedByName: 'Leonardo Augusto (Head de Negócios)',
      documentsFolderUrl: 'https://workplace.sharepoint.com/sites/projetos/2026/CORP-2026-01-Nexus-FariaLima',
      clientContactPerson: 'Dra. Camila Vasconcelos',
      clientContactEmail: 'camila.vasconcelos@nexusfinance.com.br',
      clientContactPhone: '(11) 99120-7766',
      clientContactRole: 'Head of People, Workplace & Facilities',
      negotiationModel: 'capex_direto',
      negotiationNotes: 'Investimento corporativo direto (CAPEX Próprio do cliente) aprovado pelo conselho. Verba total de R$ 4.850.000 para arquitetura, ar-condicionado VRF, automação predial e acústica.',
      programOfNeeds: {
        workstations: 280,
        meetingRooms: 24,
        focusPods: 16,
        specialRooms: 'Auditório 120 pax, Sala de descompressão, Centro de Operações Financeiras 24/7',
        hasServerRoom: true,
        expansionForecast: '15% ao ano',
        hasWellnessArea: true,
        wellnessDetails: 'Área Wellness completa com sala de meditação com controle de iluminação circadiana, cabines de descanso, espaço lactário e chuveiros com locker para funcionários.'
      },
      premisesAndAlerts: 'Certificação LEED Gold obrigatória. Piso elevado de 15cm para cabeamento estruturado Cat6A.',
      targetKickoffDate: '2026-08-10',
      estimatedBudgetRange: 'R$ 4.500.000 a R$ 5.000.000 (CAPEX Próprio)',
      clientDeadlines: 'Entrega final para Dezembro de 2026',
      commercialObservations: 'Briefing e cadastros validados pelo cliente com pasta completa no SharePoint.',
      readyForDesignTeam: true
    },
    notes: 'Cliente exige piso elevado de 15cm para cabeamento estruturado Cat6A. Ar-condicionado VRF central com grelhas lineares contínuas embutidas no forro acústico.'
  },
  {
    id: 'proj-2',
    code: 'CORP-2026-02',
    name: 'Retrofit e Expansão Sede Paulista - Advocacia Mattos & Prado',
    client: 'Mattos & Prado Advogados Associados',
    location: 'Av. Paulista, 1842 - 8º andar, Bela Vista, São Paulo - SP',
    areaM2: 1850,
    typology: 'Sede Institucional',
    description: 'Retrofit corporativo de alto padrão para banca de advocacia, com 32 escritórios privativos acústicos, biblioteca jurídica integrada, recepção com revestimento em mármore travertino e madeira nogueira natural.',
    status: 'aprovacao',
    currentPhase: 'detalhamento',
    priority: 'p2_alta',
    pipelineStage: 'desenvolvimento_ativo',
    pipelineOrder: 3,
    entryDate: '2026-08-18',
    startDate: '2026-09-01',
    targetEndDate: '2027-01-30',
    estimatedBudgetBRL: 3100000,
    teamMemberIds: ['team-soli', 'team-viviane-c', 'team-tatiane', 'team-patricia'],
    createdAt: '2026-08-20',
    briefing: {
      submittedAt: '2026-08-18 14:20',
      submittedByMemberId: 'team-leonardo',
      submittedByName: 'Leonardo Augusto (Head de Negócios)',
      documentsFolderUrl: 'https://workplace.sharepoint.com/sites/projetos/2026/CORP-2026-02-MattosPrado-Paulista',
      clientContactPerson: 'Dr. Rodrigo Mattos',
      clientContactEmail: 'rodrigo.mattos@mattosprado.adv.br',
      clientContactPhone: '(11) 98223-1100',
      clientContactRole: 'Sócio Gestor & Diretor de Infraestrutura',
      negotiationModel: 'turnkey',
      negotiationNotes: 'Turnkey Fechado: projeto de arquitetura corporativa e coordenação executiva de obras de alto padrão.',
      programOfNeeds: {
        workstations: 70,
        meetingRooms: 12,
        focusPods: 4,
        specialRooms: 'Biblioteca jurídica privativa, Sala de conferência dos sócios, Recepção mármore travertino',
        hasServerRoom: true,
        hasWellnessArea: true,
        wellnessDetails: 'Espaço lounge café para descanso dos advogados, iluminação antirreflexo e biofilia nos corredores principais.'
      },
      premisesAndAlerts: 'Atenção extrema ao isolamento acústico entre salas de sócios (Rw mínimo de 52 dB).',
      targetKickoffDate: '2026-09-01',
      estimatedBudgetRange: 'R$ 3.000.000 a R$ 3.300.000',
      clientDeadlines: 'Janeiro de 2027',
      commercialObservations: 'Briefing validado presencialmente com os sócios.',
      readyForDesignTeam: true
    },
    notes: 'Atenção extrema ao isolamento acústico entre salas de sócios (Rw mínimo de 52 dB). Especificação de divisórias de vidro duplo com micropersianas embutidas.'
  },
  {
    id: 'proj-3',
    code: 'CORP-2026-03',
    name: 'Hub de Inovação & Tech Lab Berrini',
    client: 'Veloce Data Systems Brasil',
    location: 'Av. Eng. Luís Carlos Berrini, 105 - 5º andar, Brooklin, São Paulo - SP',
    areaM2: 2400,
    typology: 'Hub de Inovação',
    description: 'Ambiente ágil de alta tecnologia com cabines individuais de foco (focus pods), arquibancada modular para hackathons, laboratório de hardware e iluminação circadiana dinâmica.',
    status: 'obra',
    currentPhase: 'acompanhamento_obra',
    priority: 'p2_alta',
    pipelineStage: 'desenvolvimento_ativo',
    pipelineOrder: 4,
    entryDate: '2026-06-25',
    startDate: '2026-07-15',
    targetEndDate: '2026-11-28',
    estimatedBudgetBRL: 3600000,
    teamMemberIds: ['team-monica', 'team-felipe', 'team-mauricio', 'team-anacarolina', 'team-demi'],
    createdAt: '2026-07-01',
    briefing: {
      submittedAt: '2026-06-25 16:45',
      submittedByMemberId: 'team-fernanda',
      submittedByName: 'Fernanda (Comercial)',
      documentsFolderUrl: 'https://workplace.sharepoint.com/sites/projetos/2026/CORP-2026-03-Veloce-Berrini',
      clientContactPerson: 'Marina Duarte',
      clientContactEmail: 'marina.duarte@velocedata.com',
      clientContactPhone: '(11) 97134-8899',
      clientContactRole: 'Diretora de Engenharia & Operações',
      negotiationModel: 'bts',
      negotiationNotes: 'Contrato BTS com retrofit predial coordenado. Allowance concedida pelo proprietário para ar-condicionado e laje.',
      programOfNeeds: {
        workstations: 160,
        meetingRooms: 10,
        focusPods: 14,
        specialRooms: 'Laboratório de prototipagem rápida, Arquibancada para 80 pessoas, Sala gamer',
        hasServerRoom: true,
        hasWellnessArea: true,
        wellnessDetails: 'Área gamer, sala de repouso rápido com cápsulas acústicas, copa colaborativa e bicicletário no subsolo com vestiários.'
      },
      premisesAndAlerts: 'Lajes nervuradas aparentes, dutos galvanizados expostos e piso vinílico de alta resistência.',
      targetKickoffDate: '2026-07-15',
      estimatedBudgetRange: 'R$ 3.500.000',
      clientDeadlines: 'Fim de Novembro de 2026',
      commercialObservations: 'Documentos do prédio e vistoria inicial anexados.',
      readyForDesignTeam: true
    },
    notes: 'Obra civil em andamento. Execução do cabeamento e montagem das estruturas metálicas suspensas para bandejas aparentes.'
  },
  {
    id: 'proj-4',
    code: 'CORP-2026-04',
    name: 'Espaço Coworking Prime Vila Olímpia',
    client: 'Workspace Prime Empreendimentos',
    location: 'Rua Funchal, 418 - Cobertura e 15º andar, Vila Olímpia, São Paulo - SP',
    areaM2: 1450,
    typology: 'Coworking',
    description: 'Espaço corporativo multi-empresas com terraço panorâmico descontraído, bar de café especial, 40 postos nômades e 18 salas privativas modulares.',
    status: 'desenvolvimento',
    currentPhase: 'anteprojeto',
    priority: 'p3_media',
    pipelineStage: 'em_esteira_iniciacao',
    pipelineOrder: 5,
    entryDate: '2026-09-20',
    startDate: '2026-10-01',
    targetEndDate: '2027-03-20',
    estimatedBudgetBRL: 2200000,
    teamMemberIds: ['team-thais', 'team-fernanda', 'team-talita', 'team-julia'],
    createdAt: '2026-09-25',
    briefing: {
      submittedAt: '2026-09-20 15:10',
      submittedByMemberId: 'team-fernanda',
      submittedByName: 'Fernanda (Comercial)',
      documentsFolderUrl: 'https://workplace.sharepoint.com/sites/projetos/2026/CORP-2026-04-WorkspacePrime-Funchal',
      clientContactPerson: 'André Siqueira',
      clientContactEmail: 'andre.siqueira@workspaceprime.com.br',
      clientContactPhone: '(11) 99882-3344',
      clientContactRole: 'Sócio Operacional & Real Estate',
      negotiationModel: 'taxa_administracao',
      negotiationNotes: 'Gestão por taxa de administração (Cost-Plus) para flexibilidade de compras de mobiliário.',
      programOfNeeds: {
        workstations: 110,
        meetingRooms: 6,
        focusPods: 8,
        specialRooms: 'Rooftop bar café, Lounge para eventos, Espaço de descompressão',
        hasServerRoom: false,
        hasWellnessArea: true,
        wellnessDetails: 'Terraço ao ar livre com área de yoga e contemplação, paisagismo biofílico exuberante e área de relaxamento.'
      },
      premisesAndAlerts: 'Cargas sobre a laje da cobertura limitadas a 300 kgf/m².',
      targetKickoffDate: '2026-10-01',
      estimatedBudgetRange: 'R$ 2.000.000 a R$ 2.400.000',
      clientDeadlines: 'Março de 2027',
      commercialObservations: 'Briefing inicial cadastrado com plantas da cobertura na pasta.',
      readyForDesignTeam: true
    },
    notes: 'Estudo de carga sobre a laje da cobertura para implantação de pergolado metálico e espelho d’água decorativo.'
  }
];

export const INITIAL_TASKS: Task[] = [
  // Projeto 5: Omni Logística (Captação, Briefing e Iniciação)
  {
    id: 'task-501',
    projectId: 'proj-5',
    title: 'Consolidação do Briefing Comercial e Validação do Programa de Necessidades',
    description: 'Entrevista de alinhamento com VP de Facilities, estruturação do quadro de áreas e dimensionamento das 140 estações e salas acústicas.',
    phase: 'captacao_briefing',
    responsibleId: 'team-leonardo', // Leonardo Augusto (Head de Negócios)
    startDate: '2026-10-21',
    endDate: '2026-10-24',
    priority: 'critica',
    status: 'concluida',
    completed: true,
    deliverables: 'Briefing técnico validado e quadro de necessidades',
    checklist: [
      { id: 'c501-1', text: 'Catalogar postos de trabalho e salas de reunião com o cliente', completed: true },
      { id: 'c501-2', text: 'Obter regras de reforma e restrições do condomínio predial', completed: true },
      { id: 'c501-3', text: 'Centralizar arquivos cadastrais na pasta oficial do SharePoint', completed: true }
    ],
    createdAt: '2026-10-21',
    updatedAt: '2026-10-21'
  },
  {
    id: 'task-502',
    projectId: 'proj-5',
    title: 'Organização da Pasta de Documentos e Conferência das Plantas Cadastrais DWG',
    description: 'Download e verificação das plantas de arquitetura fornecidas pelo condomínio, conferência de cotas e organização na pasta corporativa.',
    phase: 'captacao_briefing',
    responsibleId: 'team-fernanda', // Fernanda (Comercial)
    startDate: '2026-10-21',
    endDate: '2026-10-25',
    priority: 'alta',
    status: 'concluida',
    completed: true,
    deliverables: 'Plantas bases cadastradas e limpas no padrão Workplace',
    checklist: [
      { id: 'c502-1', text: 'Verificar prumadas e pilares existentes', completed: true },
      { id: 'c502-2', text: 'Criar estrutura de pastas no SharePoint do projeto', completed: true }
    ],
    createdAt: '2026-10-21',
    updatedAt: '2026-10-21'
  },
  {
    id: 'task-503',
    projectId: 'proj-5',
    title: 'Kickoff do Projeto Conceitual e Estudo Preliminar de Zoneamento',
    description: 'Início da criação arquitetônica com base nas informações do briefing: fluxos de circulação, setorização de departamentos e acústica.',
    phase: 'estudo_preliminar',
    responsibleId: 'team-viviane-c', // Viviane Camilli Leone (Arquiteta)
    startDate: '2026-10-28',
    endDate: '2026-11-12',
    priority: 'critica',
    status: 'a_fazer',
    completed: false,
    deliverables: 'Plantas conceituais de zoneamento e fluxogramas espaciais',
    createdAt: '2026-10-21',
    updatedAt: '2026-10-21'
  },

  // Projeto 1: Sede FinTech Nexus
  {
    id: 'task-101',
    projectId: 'proj-1',
    title: 'Compatibilização BIM: Dutos de Climatização VRF x Forro Acústico',
    description: 'Verificar interferências no modelo federado Revit entre a rede de ar-condicionado, luminárias lineares contínuas e os tirantes das placas de gesso acartonado perfurado nos pavimentos 12 e 14.',
    phase: 'projeto_executivo',
    responsibleId: 'team-leonardo', // Leonardo Augusto
    startDate: '2026-10-12',
    endDate: '2026-10-24',
    priority: 'critica',
    status: 'em_andamento',
    completed: false,
    deliverables: 'Relatório Navisworks Clash Detection e modelo IFC revisado',
    checklist: [
      { id: 'c1', text: 'Rodar detecção de colisões no Navisworks', completed: true },
      { id: 'c2', text: 'Alinhar com engenheiro de HVAC as alturas mínimas de plenum', completed: true },
      { id: 'c3', text: 'Ajustar níveis de corte no modelo de arquitetura', completed: false }
    ],
    createdAt: '2026-10-12',
    updatedAt: '2026-10-18'
  },
  {
    id: 'task-102',
    projectId: 'proj-1',
    title: 'Caderno de Detalhamento da Marcenaria: Recepção & Coffee Point',
    description: 'Elaborar pranchas de detalhamento técnico em escala 1:20 e 1:5 do balcão curvo da recepção em Corian branco e madeira freijó ripada, com passagem embutida de fiação de TI e iluminação indireta LED.',
    phase: 'detalhamento',
    responsibleId: 'team-marion', // Marion Scalzaretto
    startDate: '2026-10-15',
    endDate: '2026-10-28',
    priority: 'alta',
    status: 'em_andamento',
    completed: false,
    deliverables: 'Pranchas DET-01 a DET-06 em PDF e DWG',
    checklist: [
      { id: 'c4', text: 'Definir raios de curvatura e estrutura metálica interna', completed: true },
      { id: 'c5', text: 'Especificar ferragens de amortecimento e puxadores cava', completed: false },
      { id: 'c6', text: 'Validar amostra física da lâmina natural de freijó com cliente', completed: false }
    ],
    createdAt: '2026-10-14',
    updatedAt: '2026-10-19'
  },
  {
    id: 'task-103',
    projectId: 'proj-1',
    title: 'Levantamento Cadastral e Conferência In Loco dos Shafts Hidráulicos',
    description: 'Visita técnica com trena laser para conferir prumadas existentes, caixas de passagem e posições reais dos pilares de concreto antes de finalizar a planta civil.',
    phase: 'estudo_preliminar',
    responsibleId: 'team-thais', // Thais Trentin
    startDate: '2026-08-15',
    endDate: '2026-08-22',
    priority: 'alta',
    status: 'concluida',
    completed: true,
    deliverables: 'Nuvem de pontos e planta cadastral validada',
    checklist: [
      { id: 'c7', text: 'Medir diagonais das lajes de 1.600m²', completed: true },
      { id: 'c8', text: 'Fotografar shafts e caixas de incêndio', completed: true }
    ],
    createdAt: '2026-08-14',
    updatedAt: '2026-08-22'
  },
  {
    id: 'task-104',
    projectId: 'proj-1',
    title: 'Especificação Técnica de Revestimentos Acústicos e Carpetes Modulares',
    description: 'Planilha de especificações para certificação LEED Gold: carpete em placas 50x50 com base reciclada e painéis acústicos de feltro PET para paredes das salas de videoconferência.',
    phase: 'projeto_executivo',
    responsibleId: 'team-ingrid', // Ingrid Patricio
    startDate: '2026-10-05',
    endDate: '2026-10-19',
    priority: 'media',
    status: 'concluida',
    completed: true,
    deliverables: 'Memorial descritivo e fichas técnicas dos fabricantes',
    checklist: [
      { id: 'c9', text: 'Calcular NRC mínimo de 0.85 para salas de reunião', completed: true },
      { id: 'c10', text: 'Coletar certificados EPD dos fabricantes de carpete', completed: true }
    ],
    createdAt: '2026-10-04',
    updatedAt: '2026-10-19'
  },
  {
    id: 'task-105',
    projectId: 'proj-1',
    title: 'Emissão e Aprovação do Projeto no Condomínio do Edifício',
    description: 'Submeter documentação técnica, RRT de projeto e memorial de reformas à administração predial do Edifício Plaza Faria Lima para liberação do acesso de fornecedores.',
    phase: 'projeto_legal',
    responsibleId: 'team-soli', // Soli
    startDate: '2026-10-20',
    endDate: '2026-10-31',
    priority: 'critica',
    status: 'a_fazer',
    completed: false,
    deliverables: 'Carimbo de aprovação da administradora predial e RRT quitado',
    checklist: [
      { id: 'c11', text: 'Emitir RRT de projeto de arquitetura no CAU/SP', completed: false },
      { id: 'c12', text: 'Preencher formulário de plano de reformas ABNT NBR 16280', completed: false }
    ],
    createdAt: '2026-10-19',
    updatedAt: '2026-10-19'
  },
  {
    id: 'task-106',
    projectId: 'proj-1',
    title: 'Diagramação das Pranchas de Iluminação e Circuitos Elétricos',
    description: 'Geração dos layouts de luminárias lineares LED 3000K/4000K, sensores de presença e comando DALI integrados à automação predial.',
    phase: 'projeto_executivo',
    responsibleId: 'team-cecilia', // Cecília Michelan
    startDate: '2026-10-25',
    endDate: '2026-11-08',
    priority: 'media',
    status: 'a_fazer',
    completed: false,
    deliverables: 'Pranchas ELEC-01 a ELEC-04',
    createdAt: '2026-10-19',
    updatedAt: '2026-10-19'
  },

  // Projeto 2: Advocacia Mattos & Prado
  {
    id: 'task-201',
    projectId: 'proj-2',
    title: 'Detalhamento do Painel de Nogueira e Estante da Biblioteca Jurídica',
    description: 'Desenho construtivo da marcenaria em madeira nobre certificada, nichos com fitas de LED invisíveis e nichos blindados para arquivos confidenciais.',
    phase: 'detalhamento',
    responsibleId: 'team-patricia', // Patricia Damasceno
    startDate: '2026-10-10',
    endDate: '2026-10-26',
    priority: 'alta',
    status: 'em_andamento',
    completed: false,
    deliverables: 'Caderno executivo de marcenaria DET-BIB-01',
    checklist: [
      { id: 'c20', text: 'Revisar folgas de dilatação térmica do piso ao teto', completed: true },
      { id: 'c21', text: 'Desenhar detalhe de junção com forro de gesso', completed: false }
    ],
    createdAt: '2026-10-09',
    updatedAt: '2026-10-18'
  },
  {
    id: 'task-202',
    projectId: 'proj-2',
    title: 'Ensaio Acústico Teórico das Divisórias das Salas dos Sócios',
    description: 'Cálculo de isolamento acústico entre as salas de audiência e salas de sócios com laudo preliminar para validação do cliente.',
    phase: 'projeto_executivo',
    responsibleId: 'team-viviane-c', // Viviane Camilli Leone
    startDate: '2026-09-20',
    endDate: '2026-10-05',
    priority: 'critica',
    status: 'concluida',
    completed: true,
    deliverables: 'Relatório técnico de atenuação sonora',
    createdAt: '2026-09-18',
    updatedAt: '2026-10-05'
  },
  {
    id: 'task-203',
    projectId: 'proj-2',
    title: 'Aprovação de Layout e Acabamentos com o Comitê Diretor',
    description: 'Apresentação presencial da maquete 3D e amostras de materiais (moodboard) para os sócios titulares da banca de advocacia.',
    phase: 'anteprojeto',
    responsibleId: 'team-soli', // Soli
    startDate: '2026-10-27',
    endDate: '2026-11-04',
    priority: 'critica',
    status: 'a_fazer',
    completed: false,
    deliverables: 'Ata de aprovação assinada pelo cliente',
    createdAt: '2026-10-15',
    updatedAt: '2026-10-15'
  },
  {
    id: 'task-204',
    projectId: 'proj-2',
    title: 'Modelagem dos Detalhes Construtivos em Revit e Extração de Quantitativos',
    description: 'Modelagem precisa das esquadrias acústicas de vidro duplo com micropersianas integradas e extração de tabelas quantitativas.',
    phase: 'projeto_executivo',
    responsibleId: 'team-tatiane', // Tatiane Silva
    startDate: '2026-10-22',
    endDate: '2026-11-05',
    priority: 'alta',
    status: 'em_andamento',
    completed: false,
    deliverables: 'Tabela quantitativa de esquadrias e detalhe construtivo 3D',
    createdAt: '2026-10-18',
    updatedAt: '2026-10-20'
  },

  // Projeto 3: Hub de Inovação Veloce
  {
    id: 'task-301',
    projectId: 'proj-3',
    title: 'Vistoria Semanal de Instalação dos Dutos Aparentes e Bandejamentos',
    description: 'Fiscalização no 5º pavimento do posicionamento dos eletrodutos galvanizados e da pintura em preto fosco das lajes nervuradas expostas.',
    phase: 'acompanhamento_obra',
    responsibleId: 'team-felipe', // Felipe Cardoso
    startDate: '2026-10-18',
    endDate: '2026-10-22',
    priority: 'alta',
    status: 'em_andamento',
    completed: false,
    deliverables: 'Relatório fotográfico RDO nº 14 com lista de não conformidades',
    checklist: [
      { id: 'c30', text: 'Conferir alinhamento das bandejas de infraestrutura de dados', completed: true },
      { id: 'c31', text: 'Verificar prumo dos montantes da arquibancada metálica', completed: false }
    ],
    createdAt: '2026-10-17',
    updatedAt: '2026-10-20'
  },
  {
    id: 'task-302',
    projectId: 'proj-3',
    title: 'Aprovação do Mockup Físico das Cabines de Ligação (Phone Booths)',
    description: 'Inspeção na fábrica da divisória acústica montada em tamanho real antes do envio do lote completo de 12 cabines para a obra.',
    phase: 'acompanhamento_obra',
    responsibleId: 'team-monica', // Monica
    startDate: '2026-10-22',
    endDate: '2026-10-29',
    priority: 'critica',
    status: 'a_fazer',
    completed: false,
    deliverables: 'Termo de liberação de fabricação assinado',
    createdAt: '2026-10-18',
    updatedAt: '2026-10-18'
  },
  {
    id: 'task-303',
    projectId: 'proj-3',
    title: 'Fiscalização da Infraestrutura de Ar Condicionado e Ventilação Forçada',
    description: 'Conferência de teste de estanqueidade dos dutos e alinhamento dos difusores rotacionais no teto aparente.',
    phase: 'acompanhamento_obra',
    responsibleId: 'team-mauricio', // Mauricio Lima
    startDate: '2026-10-15',
    endDate: '2026-10-25',
    priority: 'alta',
    status: 'em_andamento',
    completed: false,
    deliverables: 'Checklist de vistoria técnica predial',
    createdAt: '2026-10-14',
    updatedAt: '2026-10-19'
  },
  {
    id: 'task-304',
    projectId: 'proj-3',
    title: 'Definição do Layout de Mobiliário Colaborativo e Postos de Foco',
    description: 'Estudo de densidade de ocupação e fluxos de circulação com estofados modulares e mesas com regulagem de altura.',
    phase: 'anteprojeto',
    responsibleId: 'team-demi', // Demi Amorim
    startDate: '2026-09-10',
    endDate: '2026-09-25',
    priority: 'media',
    status: 'concluida',
    completed: true,
    deliverables: 'Planta humanizada de layout executivo aprovada',
    createdAt: '2026-09-08',
    updatedAt: '2026-09-25'
  },

  // Projeto 4: Coworking Prime Vila Olímpia
  {
    id: 'task-401',
    projectId: 'proj-4',
    title: 'Estudo de Zoneamento e Cargas Estruturais da Cobertura Panorâmica',
    description: 'Alinhamento com engenheiro calculista para determinar capacidade de carga por metro quadrado (kN/m²) na laje do 16º pavimento.',
    phase: 'estudo_preliminar',
    responsibleId: 'team-thais', // Thais Trentin
    startDate: '2026-10-05',
    endDate: '2026-10-25',
    priority: 'critica',
    status: 'em_andamento',
    completed: false,
    deliverables: 'Parecer estrutural e planta de ocupação permitida',
    createdAt: '2026-10-04',
    updatedAt: '2026-10-16'
  },
  {
    id: 'task-402',
    projectId: 'proj-4',
    title: 'Alinhamento Comercial e Estruturação de Proposta para Novos Locatários',
    description: 'Prospecção e negociação de contratos de ocupação das salas privativas do coworking e estruturação da tabela de valores com a diretoria.',
    phase: 'anteprojeto',
    responsibleId: 'team-fernanda', // Fernanda (Comercial)
    startDate: '2026-10-26',
    endDate: '2026-11-12',
    priority: 'media',
    status: 'a_fazer',
    completed: false,
    deliverables: 'Tabela comercial de locação e proposta executiva',
    createdAt: '2026-10-18',
    updatedAt: '2026-10-18'
  },
  {
    id: 'task-403',
    projectId: 'proj-4',
    title: 'Protocolo Legal do Plano de Reforma e Consulta Preliminar na Subprefeitura',
    description: 'Elaboração da documentação técnica e anexos para certidão de conformidade de acessibilidade e segurança contra incêndio.',
    phase: 'projeto_legal',
    responsibleId: 'team-talita', // Talita
    startDate: '2026-10-12',
    endDate: '2026-10-30',
    priority: 'alta',
    status: 'em_andamento',
    completed: false,
    deliverables: 'Guia de protocolo e pranchas de acessibilidade NBR 9050',
    createdAt: '2026-10-10',
    updatedAt: '2026-10-18'
  },
  {
    id: 'task-404',
    projectId: 'proj-4',
    title: 'Desenvolvimento das Pranchas de Paginação de Piso e Forro',
    description: 'Definição de paginação de forro modular acústico e transição entre vinílico e porcelanato de grande formato.',
    phase: 'projeto_executivo',
    responsibleId: 'team-julia', // Julia Gomes
    startDate: '2026-10-24',
    endDate: '2026-11-06',
    priority: 'media',
    status: 'a_fazer',
    completed: false,
    deliverables: 'Pranchas PAG-01 a PAG-03',
    createdAt: '2026-10-18',
    updatedAt: '2026-10-18'
  }
];
