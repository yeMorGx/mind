# Migração para Supabase preservando os dados

Migração autorizada pelo proprietário em 14/10/2026. Projeto de destino: `rwltdjwjxrcmmxksxlxk`, URL `https://rwltdjwjxrcmmxksxlxk.supabase.co`.

## Estado atual

- A URL e a publishable key fornecidas respondem ao endpoint de configurações do Auth.
- O Auth por e-mail está habilitado; o provedor Google está desabilitado.
- As duas conexões Supabase disponíveis no Codex recusaram a consulta do projeto e das tabelas com `You do not have permission to perform this action`.
- Após a reconexão informada pelo proprietário, as conexões continuaram listando somente projetos de outras contas; o projeto Mind não estava entre os projetos acessíveis.
- Uma tentativa autorizada de login no painel parou na verificação hCaptcha, antes de concluir a autenticação. Essa etapa exige interação do usuário em seu navegador.
- A autenticação OAuth do MCP via CLI foi concluída e o acesso ao projeto Mind foi confirmado. A consulta inicial retornou zero tabelas no esquema `public` e zero usuários no Supabase Auth. A chave pública não oferece privilégios administrativos.
- O backup enviado pelo proprietário foi importado no esquema privado `mind_migration`: 1 perfil, 1 workspace, 3 prompts e 21 imagens dos prompts. Todos os prompts permanecem privados. A cópia está na área de preparação; ainda não é a biblioteca ativa da aplicação.
- O site continua no Firebase enquanto o acesso, a importação e a autenticação não forem validados. Nenhuma conta ou biblioteca foi apagada.

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
- `anon` e `authenticated` não têm acesso ao esquema nem às tabelas. RLS está habilitada, sem políticas para clientes de propósito. Não expor esse esquema pela Data API.
- Não foram criadas contas no Auth nem atribuídos emblemas a partir de e-mails, UIDs ou `emailVerified` declarados no JSON. Vincular os dados exige autenticação verificável e associação administrativa controlada. Não usar `user_metadata` para autorizar acesso.
- A verificação de advisors identificou a função interna `public.rls_auto_enable()` com grants de execução para clientes. A segunda migração revoga esses grants, mantendo sua função de event trigger.

As migrações SQL estão em `supabase/migrations`. O backup e o SQL gerado com seus dados ficam fora do repositório.

Para preparar outra importação autorizada:

```sh
node scripts/prepare-firebase-import.mjs /caminho/backup.json /tmp/mind-import-request.json
```

O arquivo gerado contém dados privados e deve ser passado somente ao `execute_sql` administrativo do projeto correto. O script valida a estrutura e os IDs e recusa gravar a saída dentro do repositório. A importação guarda dados como JSON, nunca executa conteúdo dos prompts.

## Configuração Google pendente

1. No Google Cloud do projeto escolhido, abra **Google Auth Platform → Clients → Create client**. Tipo **Web application**.
2. Origem JavaScript: `https://mind-lemon.vercel.app`.
3. Redirect URI: `https://rwltdjwjxrcmmxksxlxk.supabase.co/auth/v1/callback`.
4. Configure a tela de consentimento se solicitado. Em modo de teste, inclua o e-mail da conta que fará o primeiro login como test user.
5. No Supabase, **Authentication → Sign In / Providers → Google**, configure Client ID e Client Secret e habilite o provedor. O Client Secret pertence ao provedor no Supabase; não deve ir ao chat, repositório ou variável `NEXT_PUBLIC_*`.
6. Em **Authentication → URL Configuration**, Site URL: `https://mind-lemon.vercel.app`; Redirect URLs: `https://mind-lemon.vercel.app/auth/callback`.

Após configurar, preparar e validar a conta de destino e a liberação dos registros para a biblioteca ativa. Habilitar o provedor sozinho ainda não troca o backend do site.

## Acesso pendente

A conexão administrativa Supabase via MCP está disponível. O acesso aos dados Firebase ainda deve vir de uma exportação administrativa ou de sessões autenticadas dos próprios usuários. Não compartilhar credenciais de serviço em mensagens ou em arquivos do repositório.

As funcionalidades existentes não devem ser trocadas para um backend ainda não configurado; a migração termina somente quando as contas e os dados antigos estiverem acessíveis no destino.
