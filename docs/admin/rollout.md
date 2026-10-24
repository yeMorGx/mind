# Administração do Mind — implementação e ativação

## Estado

A base inclui visão geral, busca paginada de perfis, gestão de emblemas com motivo, campanhas, propostas recebidas e histórico. Analytics/performance mostram a integração pendente, sem números simulados. Conteúdo, assinaturas, convites de equipe, relatórios GA4 e telemetria de performance são próximas entregas; não estão implementados como gestão completa neste pacote.

A ativação está **fechada por padrão**. A interface pode ser vista em `/admin`, mas nenhuma consulta ou alteração administrativa é liberada sem todas as barreiras. Nenhuma configuração externa Cloudflare, DNS ou GA4 foi aplicada nesta sessão. O owner inicial é a conta existente `gabrielmcgoes@gmail.com`, resolvida pelo banco; o perfil institucional `@mind` não recebe poderes automaticamente.

## Controles implementados

1. Habilitação explícita de servidor, hostname canônico e HTTPS obrigatórios. As APIs antigas usam a mesma autorização; `/home/campaigns`, `/home/badges` e `/home/inbox` redirecionam ao admin.
2. JWT Cloudflare Access com assinatura RS256, issuer, audience e expiração verificados por JWKS fixado na configuração do servidor. Cabeçalhos de e-mail ou `Host` sozinhos não autorizam acesso.
3. Login Supabase verificado no Auth, com e-mail correspondente ao titular do token Access. Firebase não é aceito no admin; o login público existente é preservado.
4. Funções `owner`, `admin`, `moderator` em tabela privada, separada de emblemas e `user_metadata`. Somente o proprietário existente foi provisionado. Não há endpoint de autopromoção ou atribuição de função nesta entrega.
5. AAL2 e desafio MFA feito nos últimos 15 minutos. Atualizar o JWT não substitui um desafio recente. Sessão deve existir em `auth.sessions` e não estar expirada/revogada.
6. Limite distribuído de 60 requisições por minuto por administrador. O limite não substitui rate limiting/DDoS na borda.
7. Emblemas e campanhas gravam auditoria na mesma transação da alteração. Consultas à caixa de entrada registram acesso. Não há API para apagar histórico; a administração do banco continua tecnicamente capaz de alterá-lo.
8. Escrita direta de emblemas por clientes Supabase revogada; RPCs administrativas somente para `service_role`. Fundador protegido. Usuários legados recebem emblemas no diretório, sem violar o vínculo de contas nativas.
9. Sem cache para respostas administrativas; frame embedding bloqueado, tipo de conteúdo protegido e referrer restrito no admin.

## Configuração externa necessária

1. Confirmar onde o DNS está hospedado e obter acesso da conta Cloudflare. Ao adicionar a zona, revisar todos os registros, incluindo MX/TXT; preservar e-mail e serviços existentes antes de qualquer troca de nameservers.
2. Associar `admin.mindapp.icu` ao projeto na Vercel, configurar o registro indicado pela plataforma e ativar o proxy Cloudflare com TLS Full (strict). Esta associação e a migração de DNS não foram feitas automaticamente.
3. Criar uma aplicação self-hosted no Cloudflare Zero Trust abrangendo **todo** o hostname `admin.mindapp.icu`, incluindo `/api/*` e `/auth/callback`. Política allow somente para o e-mail do proprietário inicialmente, com MFA no provedor; sem bypass público.
4. Na Vercel, configurar variáveis **de servidor**, nunca `NEXT_PUBLIC_`:
   - `MIND_ADMIN_HOST=admin.mindapp.icu`
   - `CLOUDFLARE_ACCESS_TEAM_DOMAIN=https://<equipe>.cloudflareaccess.com`
   - `CLOUDFLARE_ACCESS_AUD=<Application Audience do Access>`
   - `MIND_ADMIN_ENABLED=true` **somente após configurar e conferir os itens anteriores**.
5. No Supabase Auth, autorizar `https://admin.mindapp.icu/auth/callback`. O login no admin usa sessão própria dessa origem, sem transportar tokens em URLs. Cadastrar e verificar TOTP no Mind; entrar novamente no domínio administrativo.
6. Ativar logging, alertas e limites de borda no Cloudflare. Nenhum alerta externo ou entrega de e-mail foi configurado aqui.
7. Conferir rotas do domínio protegido e os aliases originais da Vercel. A aplicação exige o token Access assinado mesmo na origem; usar regras de firewall da Vercel para reduzir tráfego direto quando disponíveis. Proteção de rede da origem não foi configurada.

## Verificações para liberar produção

- Sem Access, token forjado, issuer/audience incorretos ou expirado: bloqueado.
- Login comum, usuário sem associação ativa, Firebase, membro revogado: bloqueado.
- AAL1, MFA antigo, sessão revogada: bloqueado.
- Conta autorizada + Access válido + AAL2 recente: consultas por função e alterações permitidas.
- Emblema `verified`/`moderator` isolado não concede administração.
- Alterar emblemas do fundador, elevar funções e gravar diretamente pelo cliente: bloqueado.
- Ações com corpo inválido, origem externa, volume excedido e versão antiga da campanha: bloqueadas.
- Campanha e emblema com auditoria ausente: a transação deve falhar.

Os fluxos com Access real e MFA real permanecem pendentes até a configuração externa. Não chamar essa entrega de teste de invasão, auditoria formal concluída ou garantia de invulnerabilidade. As referências complementares da skill `codex-security:threat-model` estavam inacessíveis; não foi produzido um artefato formal dessa skill. Políticas administrativas legadas do Firebase não foram auditadas/alteradas; os poderes do novo admin são decididos exclusivamente na associação privada Supabase.

## Manutenção

Revogar uma associação remove o acesso na próxima requisição, mesmo com tokens antigos. Revisar membros regularmente; conservar um procedimento administrativo de recuperação fora do aplicativo, sem rota de bypass pública. Proteger as credenciais Cloudflare, Vercel, Supabase e as contas de recuperação com MFA. O projeto de teste não deve receber chaves ou dados de produção. Não registrar tokens, segredos TOTP ou dados de pagamento na auditoria.

## Evidências da implementação nesta sessão

- DNS público consultado: `ui-dns.de`, `ui-dns.com`, `ui-dns.org`, `ui-dns.biz` (IONOS). Não houve troca de DNS.
- Migração aplicada com registro transacional no projeto Mind. Leitura posterior confirmou RLS nas três tabelas novas, uma associação owner, nenhuma permissão de escrita direta de emblemas para clientes autenticados e RPC de alteração sem execução pública.
- Verificação transacional com rollback confirmou atualização de emblemas no diretório legado com auditoria, bloqueio de não membro e proteção do fundador. Nenhuma alteração de emblema ou registro de teste foi persistido.
- O console é recriado ao trocar de usuário; dados administrativos em memória não transitam entre logins. Renovação MFA é mostrada sem desmontar o editor de campanhas, preservando rascunhos em memória. Gravações continuam bloqueadas pelo servidor até confirmar o desafio.

O hostname administrativo tem redirecionamento próprio de `/` para `/admin`; a landing no domínio público permanece igual. A validação de sessão consulta AAL2 e existência atual de um fator verificado no banco, além das alegações assinadas. Remover o MFA impede o uso administrativo, mesmo que um JWT anterior ainda não tenha expirado.

As consultas HTTP locais sem configuração retornaram 503 `admin_setup_required` em sessão, usuários, emblemas, campanhas/lista, campanhas/mídia e caixa de entrada. A revisão visual cobriu o estado de entrada nos temas claro e escuro, desktop e celular com movimento reduzido. As telas autenticadas e a integração Access real ainda exigem a validação de ativação; não foram apresentados dados ilustrativos como atividade de produção.

A remoção de todos os emblemas é autoritativa quando o perfil já está no Supabase: o cliente não repõe emblemas antigos do fallback Firebase quando encontra um conjunto vazio no perfil atual. O fallback é conservado para contas ainda sem perfil nesse diretório.
