# Controle de processos — Workplace

Aplicação React/TypeScript com autenticação Microsoft via Firebase, projetos, tarefas, equipe, cronogramas e backups.

## Desenvolvimento e testes

Requisitos: Node 24, npm 11 e Java 21 para os testes do Firestore.

```sh
npm ci
npm run lint
npm test
npm run test:rules
npm run build
npm run dev
```

`npm test` usa dados isolados e um SDK simulado. `npm run test:rules` inicia o emulador com o projeto fictício `demo-workplace`, testa as regras e executa uma restauração com o SDK real. Não acessa o banco em produção.

Os lockfiles npm e Bun estão versionados. Depois de mudar dependências, atualizar ambos; não usar `--legacy-peer-deps`.

## Acesso corporativo

A aplicação não considera um perfil no localStorage como autenticação. Usa apenas Microsoft, com domínio `workplace.arq.br`, e exige autorização administrativa em `access/{firebaseUid}`. Sem configuração do provedor, a tela informa que o acesso está em configuração.

O procedimento de ativação e migração está em [docs/ATIVACAO.md](docs/ATIVACAO.md). Não publicar esta versão antes de configurar o provedor, autorizar o primeiro administrador e combinar a atualização das regras com o aplicativo.

## Dados e restauração

- Não há carga automática de dados demonstrativos.
- Coleções vazias são válidas; o banco é a fonte dos dados operacionais após o login.
- JSON de backup usa `projects`, `tasks`, `team`. A importação também reconhece o antigo campo `teamMembers`.
- Backups inválidos ou com referências ausentes são rejeitados antes de qualquer gravação.
- Uma restauração salva um ponto anterior, remove registros ausentes no backup e aplica o novo conteúdo em uma transação.
- Todas as gravações avançam `system/revision`. A restauração é cancelada se a revisão mudar durante a operação.
- Limite preventivo: 448 alterações de registros por restauração, mais backup anterior e revisão; 900 kB por documento. Acima disso, é necessária migração assistida.
- Leitura disponível a usuários autorizados. Edição de projetos/tarefas: `editor` e `admin`. Equipe e backups: somente `admin`. Autorizações são administradas fora do aplicativo.

Os clientes antigos deixam de gravar após a ativação das novas regras. Não reabrir acesso público para manter versões antigas funcionando.
