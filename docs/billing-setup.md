# Assinaturas e contatos — ativação do Mind

## Estado desta entrega

O código fornece planos, Checkout e Customer Portal do Stripe, webhooks assinados, desbloqueios por conta, limites de publicações, formulários de candidaturas/propostas e caixa de entrada administrativa. **A cobrança, os limites e o envio dos formulários começam desativados.** O frontend informa preparação até a infraestrutura estar pronta. As conexões administrativas Supabase desta sessão recusaram o projeto Mind; não foi possível aplicar a migração remota. Nenhuma cobrança, produto ou assinatura real foi criada por esta entrega.

## 1. Banco

Aplicar `supabase/migrations/20261017203513_billing_and_contact.sql` no projeto `rwltdjwjxrcmmxksxlxk`, por conexão administrativa autorizada (MCP, CLI vinculada ou SQL Editor). A migração foi criada pela CLI. Ela adiciona tabelas, funções e gatilhos, mas deixa `mind_billing_settings.enabled=false`.

- Todas as tabelas de cobrança e contatos têm RLS, sem permissões de leitura/escrita a visitantes ou usuários. Apenas o servidor com service role acessa esses dados.
- Os RPCs com IDs de conta são exclusivos de service_role. O servidor valida a assinatura do token Firebase ou o usuário Supabase e o MFA antes de chamar esses RPCs.
- `mind_billing.prompt_content` preserva o texto original em esquema privado. Quando a ativação ocorre, snapshots públicos passam a ter um aviso; o texto completo é liberado por um endpoint sem cache após conferir o acesso.
- O endpoint de status não consome créditos; desbloquear exige ação explícita. Repetições são idempotentes, com lock por conta e unicidade por prompt.
- Free: 2 novos desbloqueios/dia UTC, 5 publicações. Plus: 100 novos desbloqueios/mês e 50 publicações. Premium: ilimitados. O ciclo anual mantém a renovação mensal dos créditos. Saldo não acumula.
- Publicações existentes não são excluídas quando excedem o limite; editar é permitido. Somente novas publicações são limitadas.
- O modo livre para todos é escolhido pelo criador na página de um prompt publicado. Ele não consome créditos. Markdown e MCP continuam acessíveis e participam do limite de publicações.
- A migração de uma conta Firebase restaura o texto original na biblioteca privada, mesmo quando o snapshot público está protegido.

## 2. Variáveis de servidor na Vercel

Configurar somente no servidor, sem prefixo NEXT_PUBLIC_:

```
SUPABASE_SERVICE_ROLE_KEY=<chave secreta do projeto Mind>
STRIPE_SECRET_KEY=<chave Stripe da conta correta e do ambiente escolhido>
STRIPE_WEBHOOK_SECRET=<segredo do endpoint abaixo>
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PLUS_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
BILLING_CHECKOUT_ENABLED=false
CONTACT_FORMS_ENABLED=false
```

As duas variáveis públicas Supabase existentes continuam configuradas. Nunca enviar chaves secretas pelo chat ou adicioná-las ao Git. Usar apenas credenciais Stripe do mesmo ambiente (teste ou produção) para preços e webhook.

## 3. Produtos e preços do Stripe

| Plano | Mensal | Anual (20% de desconto) |
|---|---:|---:|
| Plus | R$ 19,90 | R$ 191,04 |
| Premium | R$ 39,90 | R$ 383,04 |

Preços recorrentes BRL, quantidade 1, cobrança fixa (licensed), sem metered billing do Stripe. O limite de desbloqueios é controlado no Mind.

Criar manualmente no Dashboard ou, com `STRIPE_SECRET_KEY` disponível no terminal confiável, executar deliberadamente:

```
node scripts/setup-stripe.mjs --webhook
```

O script usa lookup keys/idempotência e gera `.env.stripe.local` ignorado pelo Git, com permissões 0600. Não sobrescreve um arquivo existente. O segredo do webhook é salvo nesse arquivo, nunca impresso no terminal. Não cria clientes, pagamentos ou assinaturas. Copiar as variáveis geradas para a Vercel.

Endpoint do webhook:

```
https://mind-lemon.vercel.app/api/stripe/webhook
```

Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

Ativar o Customer Portal no Dashboard. Permitir cancelamento ao fim do período pago, consulta às faturas e atualização de pagamento. Para trocas de plano, incluir somente os quatro preços acima, quantidade fixa em 1. Configurar as regras de rateio no Stripe de acordo com a política comercial escolhida. O Mind abre o portal da própria conta e nunca aceita um customer ID enviado pelo navegador.

O retorno de Checkout não concede benefícios. O webhook verifica assinatura/timestamp, busca a assinatura atual no Stripe, confere customer e metadata com o vínculo do banco e permite apenas preços configurados. Eventos repetidos não reprocessam benefícios, e respostas com leitura anterior não substituem estado mais recente. Assinaturas canceladas antigas não substituem uma nova assinatura ativa.

## 4. Proteção das cópias antigas do Firebase

Antes do paywall, publicar o `firestore.rules` atualizado pelo processo administrativo existente. Criar pelo console/admin o documento `/billing/features` com `enabled: true`. Isso fecha a leitura pública de snapshots antigos em `publicPrompts`; os próprios criadores continuam com acesso. Clientes não podem alterar esse documento. Confirmar que essa proteção foi aplicada antes de marcar a confirmação abaixo.

Perfis continuam públicos, e a apresentação da landing não foi alterada. O acesso público atual via Supabase permanece disponível enquanto a ativação está desligada.

## 5. Ativação controlada

Após confirmar a instalação do banco, os vínculos de conta, a proteção do Firebase e o processamento dos eventos Stripe no ambiente escolhido:

1. Na Vercel, definir `BILLING_CHECKOUT_ENABLED=true` e fazer novo deploy com todos os preços/segredos.
2. Somente depois de concluir a proteção do Firebase, executar administrativamente:

```sql
update public.mind_billing_settings
set legacy_rules_confirmed=true, enabled=true
where id=true;
```

A atualização aplica a proteção a todos os snapshots públicos na mesma transação. Se a cópia de conteúdo falhar, a transação não ativa a proteção. Os limites só começam quando `enabled=true`. A página de planos consulta essa configuração antes de habilitar Checkout.

Para suspender temporariamente novas assinaturas, definir `BILLING_CHECKOUT_ENABLED=false` na Vercel; isso preserva os benefícios e a proteção existentes. Desativar `mind_billing_settings.enabled` torna novamente livre o texto público e retira os limites: só usar esse rollback quando a abertura do conteúdo for intencional. Contas, pagamentos e originais não são apagados por nenhuma dessas operações.

## 6. Formulários e caixa de entrada

Depois da migração e da chave de servidor configuradas, definir `CONTACT_FORMS_ENABLED=true` e fazer redeploy. As páginas verificam a disponibilidade da tabela antes de oferecer envio. Sucesso só aparece após persistir a mensagem.

- `/work-with-us`: candidaturas espontâneas; nome, e-mail, área, portfólio e mensagem.
- `/business`: divulgação, patrocínios, parcerias e Enterprise; empresa, site, investimento previsto e mensagem.
- `/home/inbox`: leitura privada, paginada, exclusiva de contas com emblema administrativo `owner`, validado no servidor. Há link na página de assinatura da conta proprietária.
- Os contatos são salvos no banco; esta entrega não envia notificações por e-mail nem anuncia prazo de resposta.
- Validação no servidor, consentimento explícito para contato, campo de honeypot e limites de 3 envios/hora e 10/dia por IP hash. O endereço IP não é armazenado em texto; o hash usa HMAC com segredo de servidor. A origem de IP considera o header `x-real-ip` normalizado pela infraestrutura Vercel. Outra hospedagem exige rever esse header confiável.
- As mensagens não são públicas. Definir política de retenção administrativa antes de usar a caixa em produção; não há exclusão automática prometida pelo formulário.

## Referências técnicas consultadas

- https://docs.stripe.com/billing/subscriptions/build-subscriptions?ui=checkout
- https://docs.stripe.com/webhooks
- https://supabase.com/docs/guides/api/securing-your-api.md
- https://supabase.com/changelog.md (alterações TLS e Postgres consultadas; nenhuma exige mudança no cliente Node moderno usado aqui)

## Verificação e limites de evidência

Build e TypeScript do Next e ESLint são conferidos antes da publicação. As capturas de design usam o servidor local e estado de visitante, sem cobrar, enviar formulários ou gravar dados reais. Não foram executados testes de implementação ou pagamentos, nem aplicada a migração ao Supabase remoto. A ativação depende dos passos administrativos acima.
