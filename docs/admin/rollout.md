# Administração do Mind — implementação e ativação

## Estado

A base inclui visão geral, busca paginada de perfis, gestão de emblemas com motivo, campanhas, propostas recebidas e histórico. A tag GA4 `G-PVW65CG68J` está instalada nas páginas públicas, incluindo a landing por autorização explícita, e seu status aparece no admin. Relatórios GA4 no painel e performance continuam pendentes, sem números simulados. Conteúdo, assinaturas, convites de equipe, relatórios GA4 e telemetria de performance são próximas entregas; não estão implementados como gestão completa neste pacote. O escopo da medição está em `docs/analytics.md`.

A ativação está **fechada por padrão** no código. Em produção, o DNS IONOS e o HTTPS de `admin.mindapp.icu` foram confirmados em 24/10/2026, e o proprietário confirmou o cadastro do retorno de login no Supabase. As variáveis de habilitação foram configuradas para o domínio administrativo; consultas e alterações continuam exigindo todas as barreiras do modo configurado. O owner inicial é a conta existente `gabrielmcgoes@gmail.com`, resolvida pelo banco; o perfil institucional `@mind` não recebe poderes automaticamente.

O modo escolhido pelo proprietário é `application`: autenticação e autorização no servidor, com MFA obrigatório, sem depender de Cloudflare Access. Ele exige configuração explícita; o padrão continua sendo `cloudflare`, e uma configuração inválida nunca muda automaticamente para outro modo. As variáveis de produção são `MIND_ADMIN_ACCESS_MODE=application`, `MIND_ADMIN_HOST=admin.mindapp.icu` e `MIND_ADMIN_ENABLED=true`. Alterações de ambiente entram em vigor em uma nova publicação.

O login iniciado em `/admin` usa Google diretamente pelo Supabase, sem abrir o popup Firebase do fluxo público legado. O callback e o desafio MFA conservam somente o destino fixo `/admin`, sem aceitar URL de retorno arbitrária. O modal administrativo não oferece cadastro ou métodos Firebase; a navegação pública mantém seus métodos existentes. Essa escolha de interface não concede permissão: todas as APIs continuam exigindo associação privada e MFA no servidor.

O catálogo de emblemas contém dez opções atribuíveis: verificado, moderador, criador, parceiro, equipe, embaixador, colaborador, pioneiro, educador e desenvolvedor. Fundador continua fora desse conjunto e protegido no banco. A prévia usa os dados da pessoa selecionada e muda apenas em memória até salvar, mantendo motivo obrigatório e auditoria transacional. A migração `20261024202656` amplia a validação da RPC sem conceder execução a clientes ou alterar associações administrativas. A conferência posterior confirmou o catálogo ampliado, o histórico da migração e a execução restrita ao servidor; nenhum emblema real foi alterado nessa conferência.

## Controles implementados

1. Habilitação explícita de servidor, hostname canônico e HTTPS obrigatórios. As APIs antigas usam a mesma autorização; `/home/campaigns`, `/home/badges` e `/home/inbox` redirecionam ao admin.
2. No modo opcional `cloudflare`, JWT Access com assinatura RS256, issuer, audience e expiração verificados por JWKS fixado na configuração do servidor. No modo `application`, essa barreira externa não existe; as proteções de login, associação privada, MFA, sessão e origem continuam obrigatórias. DNS e nomes difíceis de adivinhar não autorizam acesso.
3. Login Supabase verificado no Auth, com e-mail confirmado. No modo Cloudflare, o e-mail também deve corresponder ao titular do token Access. Firebase não é aceito no admin; o login público existente é preservado.
4. Funções `owner`, `admin`, `moderator` em tabela privada, separada de emblemas e `user_metadata`. Somente o proprietário existente foi provisionado. Não há endpoint de autopromoção ou atribuição de função nesta entrega.
5. AAL2 e desafio MFA feito nos últimos 15 minutos. Atualizar o JWT não substitui um desafio recente. Sessão deve existir em `auth.sessions` e não estar expirada/revogada.
6. Limite distribuído de 60 requisições por minuto por administrador. O limite não substitui rate limiting/DDoS na borda.
7. Emblemas e campanhas gravam auditoria na mesma transação da alteração. Consultas à caixa de entrada registram acesso. Não há API para apagar histórico; a administração do banco continua tecnicamente capaz de alterá-lo.
8. Escrita direta de emblemas por clientes Supabase revogada; RPCs administrativas somente para `service_role`. Fundador protegido. Usuários legados recebem emblemas no diretório, sem violar o vínculo de contas nativas.
9. Sem cache para respostas administrativas; frame embedding bloqueado, tipo de conteúdo protegido e referrer restrito no admin.

## Configuração externa necessária — IONOS

1. Em IONOS → Domínios e SSL → `mindapp.icu` → DNS, cadastrar `CNAME`, nome `admin`, destino `a53f877b761f8550.vercel-dns-017.com`. Esse é o valor recomendado pela Vercel para este projeto. Se houver A/AAAA/CNAME especificamente em `admin`, substituir somente esses registros conflitantes. Preservar `@`, `www`, MX, TXT e nameservers. Não há migração de zona para Cloudflare.
2. Conferir a propagação e o certificado HTTPS pela Vercel. A associação ao projeto e a verificação DNS estão concluídas; a Vercel confirmou o CNAME recomendado, e o acesso HTTPS ao admin retornou 200 com proteção contra enquadramento.
3. No Supabase → Authentication → URL Configuration, adicionar `https://admin.mindapp.icu/auth/callback` aos Redirect URLs, preservando os endereços existentes e o Site URL público. A API administrativa recusou esta configuração (HTTP 403); o proprietário confirmou que salvou o endereço no painel.
4. Na Vercel, usar variáveis **de servidor**, nunca `NEXT_PUBLIC_`: `MIND_ADMIN_HOST=admin.mindapp.icu` e `MIND_ADMIN_ACCESS_MODE=application`. Depois de DNS/HTTPS e login configurados, habilitar `MIND_ADMIN_ENABLED=true` e publicar novamente. Não habilitar automaticamente por uma resposta pública de DNS.
5. Cadastrar e verificar TOTP no Mind; entrar novamente no domínio administrativo e concluir o desafio. O login no admin usa sessão própria dessa origem, sem transportar tokens entre domínios em URLs.
6. Conferir as negações e o acesso permitido antes de considerar o painel operacional. A IONOS fornece DNS; não há proxy de identidade externo, bloqueio de rede da origem ou alerta externo configurado. Regras adicionais na borda da Vercel dependem do plano e da configuração da conta.

### Camada Cloudflare opcional

Se adotada posteriormente, configurar `MIND_ADMIN_ACCESS_MODE=cloudflare`, `CLOUDFLARE_ACCESS_TEAM_DOMAIN=https://<equipe>.cloudflareaccess.com` e `CLOUDFLARE_ACCESS_AUD=<audience>`, com uma aplicação Access cobrindo todo o hostname, incluindo APIs e callback. O servidor verifica assinatura e vincula o e-mail Access à conta Supabase. Uma falha de configuração não libera o modo `application`.

## Verificações para liberar produção

- No modo Cloudflare: sem Access, token forjado, issuer/audience incorretos ou expirado: bloqueado.
- No modo application: sem Bearer válido, e-mail não confirmado, hostname/HTTPS/origem incorretos: bloqueado.
- Login comum, usuário sem associação ativa, Firebase, membro revogado: bloqueado.
- AAL1, MFA antigo, sessão revogada: bloqueado.
- Conta autorizada + Access válido + AAL2 recente: consultas por função e alterações permitidas.
- Emblema `verified`/`moderator` isolado não concede administração.
- Alterar emblemas do fundador, elevar funções e gravar diretamente pelo cliente: bloqueado.
- Ações com corpo inválido, origem externa, volume excedido e versão antiga da campanha: bloqueadas.
- Campanha e emblema com auditoria ausente: a transação deve falhar.

O fluxo completo com login e MFA reais do proprietário ainda precisa ser percorrido pelo próprio usuário; nenhuma sessão foi simulada para apresentá-lo como validado. O modo Cloudflare não foi ativado nem validado com Access real. Não chamar essa entrega de teste de invasão, auditoria formal concluída ou garantia de invulnerabilidade. As referências complementares da skill `codex-security:threat-model` estavam inacessíveis; não foi produzido um artefato formal dessa skill. Políticas administrativas legadas do Firebase não foram auditadas/alteradas; os poderes do novo admin são decididos exclusivamente na associação privada Supabase.

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
