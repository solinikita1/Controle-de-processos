# Ativação do acesso Microsoft e das regras

Status desta entrega: código e testes locais. Nenhuma configuração, regra ou dado de produção foi alterado.

## 1. Preservar os dados existentes

Exportar o JSON atual pela versão anterior e guardar uma cópia do banco e das regras publicadas. Se houver dados somente no navegador, exportá-los antes da troca de versão. O cache local antigo não é apagado nem enviado automaticamente ao servidor pela versão nova.

## 2. Configurar Microsoft e Firebase

No Microsoft Entra, registrar a aplicação para contas somente do tenant da Workplace. Configurar o retorno OAuth indicado no Firebase, normalmente `https://gen-lang-client-0862256022.firebaseapp.com/__/auth/handler` neste projeto. A administração deve confirmar o URI exibido pelo console.

No Firebase Authentication, habilitar o provedor Microsoft e informar Client ID e Client Secret do registro Entra. O segredo deve ficar no console do Firebase, nunca em uma variável `VITE_`, no navegador ou no GitHub. Autorizar o domínio real do aplicativo. Configurar o Tenant ID na variável de build `VITE_MICROSOFT_TENANT_ID`.

Referência oficial: [autenticação Microsoft com Firebase](https://firebase.google.com/docs/auth/web/microsoft-oauth).

## 3. Autorizar o primeiro administrador

Com o provedor configurado, fazer um primeiro login Microsoft na versão de homologação para criar o usuário em Firebase Authentication. O app continuará bloqueado até a autorização.

No banco nomeado `ai-studio-archofficegestod-541def0f-9bbe-4e3e-957b-19e4e78db516`, um administrador do Firebase deve criar `access/UID_DO_USUARIO`:

```json
{
  "enabled": true,
  "role": "admin",
  "teamMemberId": "ID_REAL_DO_COLABORADOR"
}
```

O UID é o do Firebase Authentication, não o ID do Microsoft Entra. `teamMemberId` deve apontar para o colaborador existente para que Minhas Tarefas mantenha o vínculo. Para os demais colaboradores, usar `editor`; desativação: `enabled: false`. O aplicativo não pode criar nem editar esses documentos.

## 4. Homologação antes de produção

Validar com uma conta corporativa real: login, logout/recarregamento, usuário não autorizado, criação/edição de projeto e tarefa, sincronização em dois navegadores e restauração de um backup em ambiente separado. Os testes locais não substituem essa autenticação real nem confirmam o estado do console.

## 5. Publicação coordenada

A configuração `firebase.json` é usada pelos testes do emulador. Para as regras do banco nomeado, usar explicitamente `firebase.production.json` e o projeto correto. Preparar a nova versão e configurar o provedor antes do corte. Combinar uma janela curta de atualização das regras e do aplicativo, porque clientes antigos não enviam a revisão exigida.

Com aprovação da implantação e credenciais administrativas adequadas, o comando de publicação das regras seria:

```sh
npx firebase deploy --only firestore:rules --project gen-lang-client-0862256022 --config firebase.production.json
```

Este comando não foi executado nesta entrega. Atualizar somente o front-end não protege o banco enquanto as regras antigas estiverem publicadas.

## Windows: teste do emulador

Java 21 deve estar no PATH. Se o Java não conseguir criar sua conexão interna no diretório temporário do Windows, usar uma pasta temporária do projeto pelo argumento JVM `-Djdk.net.unixdomain.tmpdir`, sem alterar firewall ou proteções do sistema. Na máquina desta análise, essa configuração permitiu executar os testes do emulador.
