# Migração para Supabase preservando os dados

Migração autorizada pelo proprietário em 14/10/2026. Projeto de destino: `rwltdjwjxrcmmxksxlxk`, URL `https://rwltdjwjxrcmmxksxlxk.supabase.co`.

## Estado atual

- A URL e a publishable key fornecidas respondem ao endpoint de configurações do Auth.
- O Auth por e-mail está habilitado; o provedor Google está desabilitado.
- As duas conexões Supabase disponíveis no Codex recusaram a consulta do projeto e das tabelas com `You do not have permission to perform this action`.
- Após a reconexão informada pelo proprietário, as conexões continuaram listando somente projetos de outras contas; o projeto Mind não estava entre os projetos acessíveis.
- Uma tentativa autorizada de login no painel parou na verificação hCaptcha, antes de concluir a autenticação. Essa etapa exige interação do usuário em seu navegador.
- A autenticação OAuth do MCP via CLI foi concluída e o acesso ao projeto Mind foi confirmado. A consulta administrativa retornou zero tabelas no esquema `public` e zero usuários no Supabase Auth. Nenhum dado foi importado ainda. A chave pública não oferece privilégios administrativos.
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

## Acesso pendente

A conexão administrativa Supabase via MCP está disponível. O acesso aos dados Firebase ainda deve vir de uma exportação administrativa ou de sessões autenticadas dos próprios usuários. Não compartilhar credenciais de serviço em mensagens ou em arquivos do repositório.

As funcionalidades existentes não devem ser trocadas para um backend ainda não configurado; a migração termina somente quando as contas e os dados antigos estiverem acessíveis no destino.
