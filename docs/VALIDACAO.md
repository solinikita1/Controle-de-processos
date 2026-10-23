# Validação das correções — 23/10/2026

- `npm run lint`: passou (TypeScript).
- `npm test`: 24 testes aprovados, cobrindo autenticação com SDK simulado, fluxo de gravação do App, abertura do login, armazenamento, validação de backups, datas e restauração.
- `npm run test:rules`: 9 testes aprovados no emulador Firestore, incluindo SDK real para restauração administrativa e rejeição atômica da restauração por editor.
- `npm run build`: passou. Permanece aviso de tamanho do bundle principal (~2,02 MB minificado / 588 kB gzip); otimização de carregamento fica para outra etapa.
- `npm audit --omit=dev`: nenhum alerta nas dependências de produção no momento da verificação. O conjunto de ferramentas de desenvolvimento ainda apresenta avisos moderados.
- Prévia local aberta no navegador: tela de login renderizada, botão de entrada exibiu corretamente a necessidade de configuração do Microsoft, sem erros de console.
- Lockfiles npm e Bun atualizados; conflito de esbuild resolvido e react-is declarado.

## Limites

Nenhuma regra foi publicada e nenhum dado de produção foi modificado. O login com uma conta Microsoft real e a sincronização entre dispositivos precisam de homologação após configuração do Entra/Firebase, conforme ATIVACAO.md. Os testes do provedor usam respostas simuladas; os testes das regras e restauração usam emulador local.

Os formulários de projeto, tarefa, equipe, briefing e award agora aguardam a gravação para fechar. Na falha, continuam disponíveis para correção/reenvio. Backups criados após a versão antiga são compatíveis com a importação canônica e com o antigo campo teamMembers.
