# Planos, assinatura e contatos

## Escopo e direção

Extensão das páginas internas do Mind autorizada em 17/10/2026: planos Free, Plus, Premium e Enterprise; gerenciamento da assinatura; candidaturas; propostas de divulgação, patrocínio, parceria e Enterprise. O rodapé interno reúne os novos destinos. A apresentação da landing permanece fora deste escopo.

Modo principal: **Operate** para assinatura, desbloqueio, formulários e caixa de entrada; **Persuade** na comparação de planos. A tarefa é entender as condições, escolher uma ação e receber um estado verdadeiro. A identidade visual é a já estabelecida em `DESIGN.md`; esta extensão não cria um sistema global novo.

## Composição e identidade herdada

Comparação do código e das oito capturas com o contexto existente: fonte Geist, fundo claro, superfícies brancas, texto escuro, divisórias suaves, botões primários escuros e botões secundários neutros. As cores principais vêm dos tokens semânticos existentes (`background`, `surface`, `foreground`, `muted`, `media`, `border-color`). O verde discreto comunica apenas o desconto anual; vermelho escuro sobre fundo claro comunica falhas. Esses usos estão restritos aos componentes internos.

O header, a busca e a navegação inferior são os componentes compartilhados existentes. O rodapé conserva o painel tipográfico e a marca Mind grande, acrescentando os links de planos, assinatura e contato. Os estilos desta extensão ficam sob `.site-app`; não definem tema para a landing.

- Planos: largura máxima de 1.600 px, quatro colunas no desktop, duas até 1.100 px e uma até 540 px. Plus recebe destaque por tom e borda, sem inventar selo de popularidade. Alternância Mensal/Anual usa estado pressionado explícito. As regras de desbloqueio ficam abaixo da comparação.
- Conta autenticada: largura máxima de 1.120 px, painel do plano e ações, seguido do saldo quando os limites estão ativos. O estado de visitante apresenta título, explicação e Entrar.
- Contatos: largura máxima de 1.280 px, introdução e formulário lado a lado; uma coluna até 767 px. A introdução deixa de ser sticky no celular. Nome/e-mail ficam em duas colunas, passando a uma até 540 px.
- Cantos de 16 px nos painéis, campos com cantos de 10 px e controles de pelo menos 44 px. No celular, os campos usam 16 px. Foco visível, rótulos persistentes e mensagens de estado/erro integram os controles.

## Destinos e comportamento implementado

| Destino | Função |
|---|---|
| `/plans` | Compara Free, Plus, Premium e Enterprise; consulta disponibilidade antes de habilitar contratação. |
| `/home/billing` | Solicita login ao visitante; para a conta, consulta plano, saldo, renovação, pendências e acesso ao Customer Portal. |
| `/business` | Propostas de divulgação, patrocínio, parceria e Enterprise. |
| `/business?subject=enterprise` | Abre o mesmo formulário com Enterprise selecionado. |
| `/work-with-us` | Candidaturas espontâneas com nome, e-mail, área, portfólio opcional e mensagem. |
| `/home/inbox` | Caixa paginada de contatos; o servidor exige emblema administrativo `owner`. |

O rodapé aponta para Planos, Minha assinatura, Trabalhe conosco e Para empresas. Configurações oferece o acesso à assinatura. A conta proprietária recebe o link da caixa de entrada somente quando o status administrativo é confirmado.

| Plano | Preço mensal | Preço anual | Novos desbloqueios | Publicações |
|---|---:|---:|---|---|
| Free | R$ 0 | R$ 0 | 2 por dia UTC | 5 |
| Plus | R$ 19,90 | R$ 191,04 | 100 por mês | 50 |
| Premium | R$ 39,90 | R$ 383,04 | Ilimitados | Ilimitadas |
| Enterprise | Sob consulta | Sob consulta | Definidos na proposta | Definidas na proposta |

O anual tem desconto de 20%; os créditos do Plus continuam renovando mensalmente e não acumulam. Enterprise abre contato, sem Checkout ou benefícios automáticos. Os limites só entram em vigor após ativação administrativa. Publicações existentes são preservadas quando excedem o limite; novas publicações são limitadas. Markdown e MCP participam desse limite.

O texto de prompt protegido exige desbloqueio explícito; consultar status não consome crédito. Conteúdo próprio e prompts que o criador deixa livres não gastam desbloqueios. Reabrir um prompt já liberado não consome novamente, mas retirar a publicação encerra sua disponibilidade pública. O criador recebe a opção de acesso livre na página do próprio prompt publicado.

Checkout e Customer Portal abrem destinos Stripe verificados. O retorno de Checkout não concede acesso: a confirmação exige status `active`/`trialing` e período pago válido, com atualização limitada enquanto se aguarda o Stripe. Atualizar manualmente mostra carregamento, desabilita o controle e oculta o estado anterior; falha de consulta limpa o status exibido. A conta é a origem do vínculo Stripe; não há seleção de customer pelo navegador.

Formulários exigem consentimento e mensagem de 20 a 5.000 caracteres. O sucesso só aparece após a API confirmar persistência e fornecer uma referência. Falhas preservam o formulário e permitem nova tentativa. Os contatos são privados e destinados à administração; o código não envia notificação por e-mail nem promete prazo de resposta. Validação, honeypot e limites de envio ficam no servidor.

## Estados de disponibilidade e ativação

**Rollout desligado nesta entrega.** As capturas mostram os planos pagos “Em preparação”, os formulários com aviso de preparação e envio desabilitado, e a assinatura solicitando login. O acesso público atual continua disponível enquanto a cobrança e os limites estão desligados.

O proprietário confirmou conta Stripe existente e informou que configurará `STRIPE_SECRET_KEY` e `SUPABASE_SERVICE_ROLE_KEY` na Vercel; a conclusão dessa configuração não foi confirmada. As chaves não estavam disponíveis aqui. A conexão MCP Supabase recusou operações administrativas neste projeto, portanto a migração remota não foi aplicada.

Existem migração SQL gerada pela CLI, script de configuração Stripe e instruções em `docs/billing-setup.md`. A ativação depende do banco, segredos e preços, webhook, Customer Portal, proteção das cópias antigas Firebase e flags de rollout. O procedimento técnico e as implicações do rollback estão no guia; a presença das páginas não comprova que esses passos foram concluídos.

## Evidência e limites

Capturas do servidor local com build de produção e visitante real, em desktop e celular:

- `.impeccable/review/billing/plans-desktop.png` e `plans-mobile.png`.
- `.impeccable/review/billing/business-desktop.png` e `business-mobile.png`.
- `.impeccable/review/billing/careers-desktop.png` e `careers-mobile.png`.
- `.impeccable/review/billing/billing-desktop.png` e `billing-mobile.png`.

Nos arquivos longos de página inteira no celular, a barra inferior fixa aparece na altura do viewport inicial. Isso é uma característica da captura, não uma posição relativa no meio do conteúdo.

ESLint e build de produção Next passaram após as correções, e as oito capturas foram refeitas no build de produção. As capturas sustentam a comparação visual dos estados de visitante. O veredito final da revisão foi **“Ship for the disabled rollout”**. O revisor considerou resolvidos os dois achados de estado de conta por inspeção do código; nenhuma sessão autenticada foi usada para demonstrá-los. Não foram verificados pagamentos, cobranças, submissões, fluxos autenticados, execução de migração ou testes de implementação.

`DESIGN.md` e `.impeccable/design.json` permanecem preservados: esta documentação descreve a extensão no sistema existente. Nenhum reparo de drift do sistema de design integra esta entrega.
