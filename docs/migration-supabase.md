# Migração para Supabase preservando os dados

Migração autorizada pelo proprietário em 14/10/2026. Projeto de destino: `rwltdjwjxrcmmxksxlxk`, URL `https://rwltdjwjxrcmmxksxlxk.supabase.co`.

## Estado atual

- A URL e a publishable key fornecidas respondem ao endpoint de configurações do Auth.
- O Auth por e-mail e o provedor Google estão habilitados. A resposta de configurações foi conferida após a configuração feita pelo proprietário.
- As duas conexões Supabase disponíveis no Codex recusaram a consulta do projeto e das tabelas com `You do not have permission to perform this action`.
- Após a reconexão informada pelo proprietário, as conexões continuaram listando somente projetos de outras contas; o projeto Mind não estava entre os projetos acessíveis.
- Uma tentativa autorizada de login no painel parou na verificação hCaptcha, antes de concluir a autenticação. Essa etapa exige interação do usuário em seu navegador.
- A autenticação OAuth do MCP via CLI foi concluída e o acesso ao projeto Mind foi confirmado. A consulta inicial retornou zero tabelas no esquema `public` e zero usuários no Supabase Auth. A chave pública não oferece privilégios administrativos.
- O backup enviado pelo proprietário foi importado no esquema privado `mind_migration`: 1 perfil, 1 workspace, 3 prompts e 21 imagens dos prompts. Todos os prompts permanecem privados. A cópia está na área de preparação; ainda não é a biblioteca ativa da aplicação.
- Contas ainda não migradas continuam no Firebase. A integração de contas migradas usa sessão e dados Supabase após confirmação Google e liberação autorizada. Nenhuma conta ou biblioteca Firebase foi apagada.

## Backup disponível

Em **Meu perfil de criador → Seus dados → Baixar backup dos meus dados**, o usuário autenticado pode exportar um JSON com UID original, dados privados do perfil/onboarding, workspace e todos os prompts desse workspace, incluindo imagens e datas. O acesso é conferido pelas regras do Firebase e pela identificação do proprietário do workspace.

O arquivo não inclui senha, tokens de sessão ou chaves de infraestrutura. Não publique esse backup: ele contém dados privados. O backup de um usuário não substitui uma exportação administrativa de todas as contas do projeto.

## Sequência de migração

1. Reconectar a integração Supabase com uma conta que administra o projeto de destino e conferir as tabelas existentes, sem sobrescrevê-las.
2. Preparar uma cópia verificável dos dados do Firebase. Preservar o UID e os IDs antigos em campos de origem, além de títulos, textos, favoritos, imagens, datas, perfil e visibilidade de cada publicação.
3. Configurar autenticação Google e redirecionamentos na origem/destino. Associar identidades antigas a novas contas somente após autenticar o proprietário; a chave pública e um e-mail digitado não provam propriedade de uma conta.
4. Adaptar o esquema preparado em `SUPABASE_SETUP.sql` às funcionalidades atuais: perfil sempre público, capa/avatar, prompts privados com publicação individual, emblemas administrados e biblioteca privada. Aplicar RLS e grants explícitos, verificar os advisors e preservar o histórico da migração.
5. Importar em operações que possam ser repetidas sem duplicação. Conferir contagens e amostras de conteúdos/imagens/datas, permissões privadas e links públicos. Não validar apenas uma biblioteca vazia.
6. Atualizar as variáveis da Vercel e os fluxos da aplicação, validar login e acesso às bibliotecas existentes e só então ativar Supabase em produção.

## Importação recebida e verificada

- Formato `mind-firebase-backup`, versão 1; arquivo com 1.070.783 bytes.
- SHA-256: `96e8870595d1632bbee71bc8f1cf643ee08f896434bd1a94722ffec202ad503b`.
- `mind_migration.firebase_imports` guarda os bytes originais e um manifesto de contagens. Uma constraint confere o SHA-256 no banco.
- `mind_migration.firebase_records` guarda os documentos de usuário, workspace e prompts com seus IDs de origem. As imagens, datas, conteúdo, favoritos e dados do perfil são preservados sem conversão no JSON de origem.
- A conferência SQL retornou digest idêntico, registros JSON iguais aos da origem e contagens de 3 prompts/21 imagens. A repetição da importação não criou duplicatas.
- `anon` e `authenticated` não têm acesso às tabelas do backup. RLS está habilitada, sem políticas para clientes de propósito. O esquema permanece fora da Data API; `authenticated` recebe somente USAGE e execução da função privada de vinculação, que verifica a sessão e a aprovação administrativa.
- Não foram criadas contas no Auth nem atribuídos emblemas a partir de e-mails, UIDs ou `emailVerified` declarados no JSON. Vincular os dados exige autenticação verificável e associação administrativa controlada. Não usar `user_metadata` para autorizar acesso.
- A verificação de advisors identificou a função interna `public.rls_auto_enable()` com grants de execução para clientes. A segunda migração revoga esses grants, mantendo sua função de event trigger.

As migrações SQL estão em `supabase/migrations`. O backup e o SQL gerado com seus dados ficam fora do repositório.

Para preparar outra importação autorizada:

```sh
node scripts/prepare-firebase-import.mjs /caminho/backup.json /tmp/mind-import-request.json
```

O arquivo gerado contém dados privados e deve ser passado somente ao `execute_sql` administrativo do projeto correto. O script valida a estrutura e os IDs e recusa gravar a saída dentro do repositório. A importação guarda dados como JSON, nunca executa conteúdo dos prompts.

## Configuração Google pendente

Google foi habilitado e os endereços abaixo foram informados como salvos pelo proprietário. O primeiro login ainda precisa confirmar o retorno real ao callback.

1. No Google Cloud do projeto escolhido, abra **Google Auth Platform → Clients → Create client**. Tipo **Web application**.
2. Origem JavaScript: `https://mind-lemon.vercel.app`.
3. Redirect URI: `https://rwltdjwjxrcmmxksxlxk.supabase.co/auth/v1/callback`.
4. Configure a tela de consentimento se solicitado. Em modo de teste, inclua o e-mail da conta que fará o primeiro login como test user.
5. No Supabase, **Authentication → Sign In / Providers → Google**, configure Client ID e Client Secret e habilite o provedor. O Client Secret pertence ao provedor no Supabase; não deve ir ao chat, repositório ou variável `NEXT_PUBLIC_*`.
6. Em **Authentication → URL Configuration**, Site URL: `https://mind-lemon.vercel.app`; Redirect URLs: `https://mind-lemon.vercel.app/auth/callback`.

Após configurar, preparar e validar a conta de destino e a liberação dos registros para a biblioteca ativa. Habilitar o provedor sozinho ainda não troca o backend do site.

## Concluir a migração de uma conta autorizada

1. A administração confere a origem do backup e aprova, em `mind_migration.account_claims`, o UID, digest e e-mail esperado. Essa associação é administrativa e não deriva automaticamente dos campos de um arquivo enviado pelo cliente.
2. O proprietário entra no Mind com sua conta existente e abre **Meu perfil de criador → Seus dados → Concluir migração com Google**.
3. O callback troca o código PKCE por uma sessão Supabase. A função de vinculação verifica `auth.uid()` e o e-mail confirmado em `auth.users`, e confere a associação administrativa. `user_metadata` nunca autoriza o acesso.
4. A primeira vinculação copia perfil, workspace e prompts do backup para as tabelas ativas numa transação. O UID original fica como `public_id`, e os IDs de workspace e prompts são mantidos. Repetir o login usa os dados atuais da conta vinculada, sem reimportar por cima das edições.
5. O navegador ativa a sessão nativa somente após concluir a vinculação. A biblioteca, perfil, imagens, favoritos e publicação passam a usar Supabase. Salvar perfil atualiza as duas cópias numa operação; editar/publicar um prompt atualiza sua versão pública na mesma operação; excluir um prompt remove a cópia pública por FK.
6. Perfis são sempre públicos. A biblioteca e os documentos privados usam RLS por proprietário. Apenas `mind_public_prompts` fornece prompts aos visitantes. A landing usa essa tabela para a vitrine.
7. Os links `/u/{uid}` e `/share/{uid}/{promptId}` e os IDs dos prompts privados continuam os mesmos. A página `/p/{uid}~{promptId}` atende os cards da vitrine Supabase.

A aprovação da conta do proprietário foi registrada com o backup recebido. A atribuição de fundador, verificado e administrador de emblemas está ligada à aprovação administrativa e ocorre apenas após autenticar essa conta; o cliente não pode editar `badge_admin` nem a coroa.

O cadastro de novas contas e o primeiro login de contas sem backup continuam no Firebase nesta etapa. Contas já migradas são reconhecidas pelo perfil público e encaminhadas à confirmação Google para entrar no Supabase. Isso mantém uma ponte de entrada Firebase enquanto a migração das demais contas não está concluída. Não remover o Firebase nem suas variáveis antes de migrar e verificar as outras contas.

A configuração dos endereços de retorno e o primeiro login Google real precisam ser concluídos pelo proprietário. Compilação, lint, grants, RLS e advisors foram conferidos; a conta ainda não foi vinculada sem esse login. Não afirmar que o login completo ou a biblioteca autenticada foram validados apenas com uma resposta de configurações.

## Perfis públicos antes da migração

O perfil público não depende da liberação da biblioteca. `mind_creator_directory` mantém somente nome, bio, apresentação, foto e capa, além de emblemas administrados. O perfil do proprietário foi inicializado a partir do backup autorizado. Os demais são provisionados no login Firebase ou ao abrir o editor.

A Edge Function `sync-creator-profile` verifica a assinatura RS256 do ID token Firebase, issuer `https://securetoken.google.com/mind-a9499`, audience `mind-a9499`, subject e expiração. O UID é extraído do token validado; o corpo não pode escolher o proprietário ou os emblemas. Nenhum e-mail, convite, dado de equipe ou prompt privado é copiado para o diretório. Clientes recebem apenas SELECT; gravações ficam no servidor.

O gateway Supabase usa `verify_jwt: false` nesta função porque ela aceita JWT Firebase; a verificação de autenticação está obrigatoriamente no corpo da função antes de qualquer gravação. A implantação é feita pelo MCP com essa opção, não pelo padrão que exige JWT Supabase. Tokens ausentes ou inválidos recebem 401. A service role é usada somente no ambiente da função, nunca no navegador.

Perfis nativos em `mind_creators` têm prioridade sobre o diretório. Um token Firebase não pode editar por esta função um perfil que já migrou: o servidor exige voltar ao login Google nativo. Salvar perfil legado atualiza o diretório e depois a cópia privada no Firebase; essas gravações são em serviços distintos. Perfis nativos continuam usando a transação SQL para atualizar as duas cópias.

A primeira vinculação nativa prefere o perfil atual do diretório ao perfil antigo do backup, preservando edições públicas feitas nesse intervalo. Isso não modifica a aprovação de identidade nem os emblemas administrativos.

O crachá 3D fica dentro de “Conheça o criador”, sem faixa fixa à esquerda. A página pública não é ocultada quando apenas a consulta dos prompts falha; nesse caso, ela informa que a lista não pôde ser carregada.

## Acesso pendente

A conexão administrativa Supabase via MCP está disponível. O acesso aos dados Firebase ainda deve vir de uma exportação administrativa ou de sessões autenticadas dos próprios usuários. Não compartilhar credenciais de serviço em mensagens ou em arquivos do repositório.

As funcionalidades existentes não devem ser trocadas para um backend ainda não configurado; a migração termina somente quando as contas e os dados antigos estiverem acessíveis no destino.
