# Assinaturas e contatos — ativação do Mind

## Estado desta entrega

O código fornece planos, Checkout e Customer Portal do Stripe, webhooks assinados, desbloqueios por conta, limites de publicações, formulários de candidaturas/propostas e caixa de entrada administrativa. **Os planos de produção foram configurados na Stripe; os limites do Supabase e o Checkout foram ativados.** A ativação segue a orientação expressa do proprietário de não alterar o Firebase. Foram criados produtos e preços, sem criar cliente, assinatura ou cobrança real. Os formulários de contato conservam sua ativação independente.

## 1. Banco

A migração `supabase/migrations/20261017203513_billing_and_contact.sql` já foi aplicada no projeto `rwltdjwjxrcmmxksxlxk`, pela conexão administrativa MCP autenticada da CLI. Não reaplicar. Ela adiciona tabelas, funções e gatilhos, mas deixa `mind_billing_settings.enabled=false`.

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

## 4. Escopo: Supabase

O proprietário instruiu expressamente seguir sem Firebase. A migração `billing_supabase_rollout` remove a dependência da confirmação administrativa de regras legadas; não marca `legacy_rules_confirmed` como verdadeiro nem afirma ter protegido o Firestore. Nenhuma regra, conta ou documento Firebase foi alterado.

O paywall protege os snapshots públicos do Supabase, preservando o texto completo em `mind_billing.prompt_content`. Cópias antigas fora do Supabase estão fora desta proteção: eventual acesso pelo Firebase continua sujeito às regras existentes nesse serviço. Perfis continuam públicos, e a apresentação da landing não foi alterada.

## 5. Ativação controlada

Após confirmar a instalação do banco, os vínculos de conta e a configuração Stripe no ambiente escolhido:

1. Na Vercel, definir `BILLING_CHECKOUT_ENABLED=true` e fazer novo deploy com todos os preços/segredos.
2. Para o rollout com Supabase, executar administrativamente:

```sql
update public.mind_billing_settings
set enabled=true
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

Build e TypeScript do Next e ESLint foram conferidos na entrega do código. As capturas de design usam o servidor local e estado de visitante, sem cobrar, enviar formulários ou gravar dados reais. A instalação remota confirmou `enabled=false`, `legacy_rules_confirmed=false`, zero assinaturas e zero prompts protegidos; os oito snapshots públicos existentes permanecem disponíveis. Os papéis anon/authenticated não podem executar o RPC que atribui planos. O advisor informa RLS sem políticas nas tabelas exclusivamente administrativas, conforme projetado; a proteção contra senhas vazadas já estava desativada antes desta instalação.

A autenticação direta do MCP oficial da Stripe e da CLI da Vercel foi concluída. A conta Stripe é **Mind**, em produção; o projeto Vercel confirmado é `mind`, equipe `yemorgxs-projects`. As chaves Stripe, webhook e Supabase estão cadastradas como Secret em Production; seus valores não foram lidos ou expostos.

Foram criados e conferidos os quatro preços recorrentes BRL, com quantidade fixa e lookup keys `mind_<plano>_<monthly|yearly>_v1`. Os IDs foram cadastrados em Production na Vercel:

| Variável | ID |
|---|---|
| `STRIPE_PRICE_PLUS_MONTHLY` | `price_1URkbCKHp5qmp50gqLdElAca` |
| `STRIPE_PRICE_PLUS_YEARLY` | `price_1URkbDKHp5qmp50gkqJBwXzb` |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_1URkbDKHp5qmp50gJQ8Ukvdu` |
| `STRIPE_PRICE_PREMIUM_YEARLY` | `price_1URkbEKHp5qmp50gioauv9pL` |

O webhook existente `we_1URkMPKHp5qmp50gVIdHbvjk` foi preservado e limitado aos cinco eventos desta integração; o segredo não foi rotacionado. Os logs da Vercel confirmaram entregas reais da Stripe com HTTP 200 durante a configuração dos produtos/preços, quando o endpoint ainda recebia esses eventos. Isso confirma o processamento de assinaturas criptográficas pelo handler; não equivale a validar uma compra ou a concessão de um plano pago. O portal padrão `bpc_1URkbfKHp5qmp50gRnE3oWm7` permite consultar faturas, atualizar pagamento, cancelar ao fim do período e trocar somente entre os quatro preços. Quantidade não é editável; reduções de valor e encurtamentos de intervalo são agendados para o fim do período, com rateio nas demais trocas.

`BILLING_CHECKOUT_ENABLED=true` foi cadastrado em Production e `mind_billing_settings.enabled=true` foi aplicado em transação com conferência dos originais preservados. O campo histórico `legacy_rules_confirmed` permanece falso, coerente com o Firebase fora do escopo. A autorização Firebase foi abandonada após a orientação expressa do proprietário. Não foi realizado pagamento de teste nem criada assinatura ou cliente real; o fluxo completo de compra, concessão de plano, ticket e cancelamento ainda não foi exercitado por uma conta real.

## Cópias e concessão administrativa (19/10/2026)

A migração `20261019115240_prompt_copy_usage_and_grants.sql` troca a medição de novos desbloqueios por eventos de cópia: Free permite duas cópias por dia UTC, Plus 100 por período mensal, Premium ilimitado. Cada clique conta, inclusive repetições do mesmo prompt; “Usar com IA” passa pela mesma autorização. Abrir/desbloquear não consome cópia. Prompts privados da própria biblioteca continuam disponíveis ao dono. Publicações com texto livre também usam a cota quando copiadas pelo site. A seleção/cópia manual de texto já exibido não é um mecanismo de cobrança controlado pelo navegador.

`mind_copy_prompt` usa o mesmo lock por conta dos desbloqueios, verifica o saldo e grava o evento em uma transação. Um UUID por ação evita duplicação da mesma solicitação. A API verifica a sessão/MFA antes de fornecer o ator à RPC. As tabelas de eventos e concessões têm RLS e acesso apenas de serviço. O contador começa com os eventos desta migração; o histórico de desbloqueios é preservado.

`mind_plan_grants` concede Premium de cortesia sem inventar assinaturas ou pagamentos Stripe. A migração resolve a conta solicitada por `auth.users.email` e `mind_accounts`, sem criar outro usuário. Eventos Stripe continuam atualizando exclusivamente os registros de assinatura. A página de assinatura identifica a cortesia; o grant pode ser revogado administrativamente sem tocar em pagamentos.

Aplicada em 19/10/2026 no projeto Mind pela API administrativa, com registro no histórico de migrações na mesma transação. A leitura posterior confirmou Premium para a conta solicitada, cortesia sem expiração e sem assinatura Stripe criada; confirmou também RLS nas duas tabelas, RPC sem execução para clientes autenticados e execução permitida ao serviço. A conexão OAuth da CLI foi renovada; as conexões do conector continuavam sem acesso a este projeto.
