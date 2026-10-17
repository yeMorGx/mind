# Cadastro e preparação da biblioteca

Superfície: `/register` e suas etapas. Modo: Operate. O fluxo passa de sete para quatro etapas visíveis, preservando a autenticação, os dados existentes e o esquema de persistência. A landing permanece fora deste escopo.

## Referências

- [Vercel Signup](https://vercel.com/signup), visitado e capturado em `.impeccable/review/ref-vercel-signup.png`: hierarquia direta para criação de conta.
- [shadcn/ui Signup Blocks](https://ui.shadcn.com/blocks/signup), visitado e capturado em `.impeccable/review/ref-shadcn-signup.png`: formulário claro com rótulos e ações explícitas.

Notion e Mobbin bloquearam o acesso com 403. Linear mostrou somente um carregamento com logo. Essas visitas não sustentam decisões visuais.

## Jornada e interface

| Etapa | Rota | Conteúdo e condição para avançar |
| --- | --- | --- |
| Sua conta | `/register` | Nome, e-mail e senha; usa `createEmailPasswordAccount`. Mostrar senha é opcional; outras formas de acesso abrem o modal existente. |
| Seu perfil | `/register/step-2` | Nome público, @ obrigatório e atividade. Carrega o identificador existente; salva nome/@ com `saveCreatorProfile` e atividade com `saveOnboardingProgress`. |
| Sua biblioteca | `/register/step-4` | Nome da biblioteca e uso individual/equipe. Consulta @ e atividade antes de exibir o formulário; `createWorkspaceForUser` também exige @. |
| Tudo pronto | `/register/finish` | Exige `onboardingComplete` e @ consultado; resume perfil, biblioteca e uso, com acesso à biblioteca e ao perfil público. |

No desktop, painel lateral cinza claro com etapas numeradas e concluídas, formulário branco de até 460 px e navegação contextual no topo. Até 900 px, o painel dá lugar à marca compacta e a quatro segmentos de progresso. O header global e seus offsets ficam ausentes somente nas rotas do cadastro. Campos têm rótulos, autocomplete quando aplicável, foco visível e tamanho de 16 px no celular. Carregamento e falhas têm mensagens e opção de tentar novamente quando a consulta de identidade falha.

`UsernameInput` mantém o formato de 3 a 24 caracteres, iniciando por letra, com letras minúsculas, números e `_`. Exibe consulta de disponibilidade após 300 ms, indisponibilidade e falha de consulta; salvar usa a validação e a exclusividade já existentes no banco. A consulta visual não reserva o identificador. Durante `/register`, o @ é solicitado dentro do formulário, sem o popup de `RequiredUsername`; fora dessa jornada, a proteção permanece.

Na biblioteca, a escolha de equipe revela nome, tamanho e e-mails opcionais. Endereços são validados e deduplicados, ficam salvos e não geram convites. Ícone e origem ficam numa seção opcional recolhível. Os formulários recebem os valores anteriores e os salvamentos preservam os demais campos de perfil/progresso. As rotas antigas `/register/step-3`, `step-5`, `step-6` e `step-7` redirecionam para `step-4`, sem alteração de esquema.

## Evidências e limites

Revisados os diffs de `app/register`, `OnboardingLayout`, `SiteLayout`, `RequiredUsername`, `lib/firebase/auth.ts` e `lib/firebase/data.ts`, além de `CreatorSetupForm`, `LibrarySetupForm`, `UsernameInput` e seus estilos.

As capturas em `.impeccable/review/onboarding-{account,profile,library,team}-{desktop,mobile}.png` registram a conta real em acesso anônimo e os formulários reais de perfil/biblioteca/equipe com propriedades iniciais de prévia, sem mutações. As rotas locais usadas nessas prévias são temporárias e foram removidas antes do build. Foram inspecionadas visualmente as capturas de conta no desktop, perfil no celular e equipe no desktop.

Esta documentação registra interface e revisão de código. Nenhum cadastro real, salvamento de perfil, criação de biblioteca ou envio de e-mail foi exercitado; a exclusividade do @ foi avaliada pelo contrato existente, sem disputa real entre contas.

Ao voltar da configuração da biblioteca para o perfil, o rascunho dos campos permanece no contexto da sessão; essa navegação não grava no banco. A conclusão salva os dados pelas funções existentes.
