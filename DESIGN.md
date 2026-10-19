---
name: Mind
description: Shared site navigation and a single light theme for prompt creators and visitors.
colors:
  background: "#fafafa"
  foreground: "#17181a"
  surface: "#ffffff"
  surface-hover: "#f0f0f3"
  muted: "#565660"
  subtle: "#696975"
  border: "#dedee5"
  media: "#eeedf3"
  primary: "#17181a"
  primary-foreground: "#ffffff"
  primary-hover: "#34343d"
  sky-top: "#6ca8da"
  sky-bottom: "#b9ddf3"
typography:
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "14px"
    lineHeight: "20px"
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "36px"
rounded:
  xl: "12px"
  2xl: "16px"
components:
  header:
    height: "72px"
    backgroundColor: "{colors.surface}"
  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
---

# Mind — layout e tema compartilhados

## Direção

Por solicitação do proprietário, as páginas internas usam somente o tema claro. A landing (`/`) é uma exceção explícita: mantém a apresentação original, sem header/sidebar globais e com seus estilos próprios. A biblioteca, os prompts, os perfis, o cadastro, o login interno e os estados de erro compartilham a mesma paleta. O céu e a galeria da landing são conteúdo visual; os emblemas mantêm as cores que indicam sua identidade.

O conteúdo conduz a página: imagens e texto do prompt primeiro; identidade, detalhes e instruções depois. Evitar estatísticas fictícias e reformulações de conteúdo sem necessidade.

## Navegação persistente

`components/layout/SiteLayout.tsx`, aplicado no layout raiz, é o único responsável por montar o `Header`. As páginas internas não repetem esses componentes nem reservam offsets próprios para eles. Na rota `/`, o layout raiz entrega a landing sem esse chrome nem seus offsets.

- Header fixo de 72 px, fundo branco e borda inferior, com logo, navegação, busca, criação de prompt e avatar da conta. O botão cria um rascunho privado; a publicação continua sendo uma decisão separada.
- Sem sidebar, por solicitação do proprietário. Explorar, Biblioteca e Favoritos ficam no header. Perfil e saída ficam no menu da conta, com fechamento por Escape e clique fora. No celular, Explorar, Biblioteca e Favoritos ficam em uma barra inferior fixa, com ícones e rótulos.
- Os menus levam a Meus prompts, Explorar, Favoritos e Meu perfil. Categorias e modelos ficam no botão Filtros junto à grade, derivam dos registros reais e filtram o catálogo atual; não há links de recursos indisponíveis, métricas fictícias ou ordenação “em alta” sem dados.
- A raiz reserva somente o topo: 72 px no desktop e 116 px no celular, onde a busca ocupa uma segunda linha. A busca funciona na biblioteca e no catálogo; ao enviar de outra página, abre o catálogo público.
- `/explore` é o catálogo público interno, independente da landing protegida. Usuários sem conta podem abrir e copiar prompts publicados. O acesso a funções privadas pede login.
- A landing mantém seus arquivos, seu comportamento e seus estilos anteriores. As novas regras de CSS são restritas a `.site-app`.

### Catálogo inspirado na referência

O catálogo usa colunas responsivas e capas reais (proporções variáveis em Explorar), sem borda externa nos cards públicos, e metadados abaixo das imagens com título, autor ou status, modelo quando informado e ação de copiar. A biblioteca conserva as ações animadas de editar, copiar, favoritar e duplicar, além de publicar/tornar privado e excluir. Não há contadores de visualizações ou curtidas inventados. Os estados vazios e falhas de carregamento permanecem explícitos.

## Cores e componentes

`app/globals.css` define os tokens semânticos e os registra no Tailwind. Usar `background`, `surface`, `foreground`, `muted`, `subtle`, `border`, `primary` e `primary-foreground` em vez de escolher cores claras ou escuras em cada página.

Textos secundários usam cores opacas legíveis, não branco translúcido. Campos são claros, com bordas discretas e foco escuro. Ações principais são escuras com texto branco; ações secundárias são neutras. Erros usam vermelho escuro sobre fundos claros. Branco sobre preto continua permitido em etiquetas de fotografia, marcas e backdrops de imagens.

Action nodes, upload dropzones, editores e lightbox usam os mesmos tokens. Geist é a fonte da interface. Instrument Serif permanece nos títulos da landing. O código do prompt mantém a fonte monospace.

## Perfis e prompts

O perfil mantém a capa, o avatar sobreposto e a grade de publicações. O dono abre uma seção de edição pelo botão “Editar perfil” na própria página. Administração de emblemas permanece nessa seção; backup e atualização de acesso ficam em Configurações. `/home/profile` redireciona para o perfil canônico.

O crachá 3D fica dentro do card “Conheça o criador”, com uma cena de até 300 × 310 px. O nome aparece apenas na arte do crachá; os emblemas e o link ficam abaixo. A foto ou inicial serve de fallback sem WebGL.

Resultados de prompts usam um carrossel horizontal automático, sem imagens duplicadas, com pausa ao passar o mouse, focar controles, arrastar ou abrir a imagem. A preferência de movimento reduzido desativa o avanço. É possível arrastar com mouse, deslizar no celular ou usar setas quando a galeria está em foco. Clicar sem arrastar abre a imagem completa. A comparação antes/depois preserva as cores necessárias sobre as fotografias.

## Regras

- Preservar contas, dados, links e ações ao alterar a apresentação.
- Manter um único header e nenhuma sidebar por página interna, inclusive em carregamentos e erros.
- Usar foco visível, labels acessíveis, targets confortáveis e navegação por teclado.
- Não reintroduzir um tema escuro isolado em perfis, formulários ou biblioteca.
- Não oferecer emblemas autoconcedidos nem métricas inventadas.

## Identificação de criadores

Cada pessoa escolhe um @ obrigatório e exclusivo, de 3 a 24 caracteres (letras minúsculas, números e _, começando por letra). Contas sem @ devem escolhê-lo na área interna antes de continuar; nunca gerar identificadores automaticamente. A exclusividade é garantida no banco, compartilhada por contas Firebase e Supabase. O perfil permite alterar o @. Explorar oferece busca de pessoas por nome ou @; links /u/@nome resolvem o perfil, preservando os antigos links por UID. A landing permanece protegida.

A referência Dribbble orienta a navegação horizontal, a busca arredondada e a grade de imagens nas páginas internas. A grade ocupa até 1600 px, com 1–4 colunas. Categorias e modelos continuam disponíveis acima do catálogo; ações privadas da biblioteca são preservadas.

## Busca do header

Campo com sugestões em painel ancorado, espera de 250 ms e cancelamento de consultas antigas. Permite Ctrl/Cmd + K, setas, Enter, Escape e Tab; carregamento, falha parcial e resultado vazio são explícitos. Resultados mostram título/modelo/criador ou nome/@, com links diretos. Enter sem seleção abre `/explore?q=...`; a grade mantém a relevância retornada pelo banco e permite outras ordenações. A landing continua sem o header interno.

## Adaptação para celular

Header de 116 px com marca/conta e busca em largura total; navegação inferior de 64 px mais a área segura. A busca em foco esconde a barra inferior. A raiz reserva espaço para ambas as barras. Em Explorar, abaixo de 768 px, Filtros abre uma gaveta inferior com ordenação, categoria e modelo; as escolhas ficam em rascunho até Aplicar filtros, e fechar descarta as alterações. Campos usam pelo menos 16 px para evitar zoom automático no iPhone. As ações dos cards da biblioteca ficam dentro da capa, com alvos de toque de 44 px, preservando a animação no desktop. A landing fica fora dessas regras.

## Atualização do catálogo a partir do wireframe

Referência de estrutura: Figma `qCkRPKTQMKNyqzBN7EztnX`, nó `192:149`. No perfil, capas em 7:6; em Explorar, proporções naturais limitadas entre 0,8 e 1,85. Ambos mantêm cantos de 18 px; bloco de identificação separado por 10 px, com avatar/nome antes do título e curtidas discretas na mesma linha do criador. Sem copiar ou exibir o corpo do prompt nos cards públicos.

Explorar e perfil usam largura disponível, com 24 px laterais no desktop e 16 px no celular. A biblioteca não recebe essa mudança. Header somente com logo, busca centrada e avatar real com fallback Google/inicial. Campo sem outline externo; sugestões e seleção por teclado continuam visíveis. Somente o envio de uma consulta altera os resultados de Explorar. No desktop, três seletores reúnem ordenação, categoria e modelo; categoria e modelo têm busca e navegação por teclado. No celular, ficam na gaveta de filtros; não há chips de tipo. No perfil, Seguir/Seguindo e contagens reais substituem Compartilhar perfil. Curtidas e seguidores carregam em lote e mostram falhas e estados pendentes; não apresentar contagens simuladas.

## Editor e publicação

Editor em diálogo nativo de tela inteira, sem rolagem externa: cabeçalho e rodapé persistentes, duas áreas com rolagem própria no desktop e abas de conteúdo no celular. Publicação em três etapas com revisão real de texto e imagens e confirmação explícita. Configurações seguem a tipografia, espaçamento e cores semânticas das páginas internas. A comparação antes/depois tem largura máxima de 540 px para evitar ampliação excessiva.

## Comunidade na landing

Alteração diretamente autorizada em 14/10/2026: seção clara (#fafbfc), texto azul escuro (#102a43), título Instrument Serif e capas 4:3 com metadados fora da imagem. Estilos isolados em `.landing-page .landing-community`; não usar os componentes sociais internos nesta seção. A galeria circular continua automática, sem botão de pausa; mantém a suspensão durante o login e o respeito à preferência de movimento reduzido.

## Hierarquia da página do prompt

Resultados e texto completo formam uma área principal em duas colunas no desktop; até 900 px, resultados, texto e comparação ficam em sequência. Autoria no topo usa foto, nome, @ e emblemas compactos reais. Crachá, instruções e metadados ficam abaixo. As recomendações de “Continue explorando” mostram foto e emblemas do perfil administrativo, com links separados para prompt e criador. Referências pesquisadas e decisões estão em `docs/design/prompt-detail.md`.

## Modelos de IA

Seleção pesquisável com 24 IAs e ferramentas e logos locais da biblioteca LobeHub Icons (MIT). Editor de prompt e preferências usam o mesmo seletor; ele aceita nomes personalizados e preserva valores antigos. Nos cards, exibir somente o logo com nome acessível e tooltip. Modelos personalizados sem marca reconhecida usam um ícone neutro de IA, sem inventar logos. Na página do prompt, o nome completo continua disponível junto ao logo.

Ajuste diretamente autorizado da landing: degradê no fim do céu até o fundo da comunidade, sem alterar a galeria ou o texto da abertura.


## Perfil, conexões e segurança

Edição do perfil separa prévia de capa/avatar dos campos públicos e mantém emblemas administrativos somente para leitura. Configurações agrupa contas conectadas, MFA, preferências e dados/sessão, sem controles de foto. Referências e decisões: `docs/design/account-settings.md`.


## Referências para usar o prompt

Na aba Imagens do editor, resultados/comparação e referências opcionais têm áreas de upload distintas. As referências exibem numeração, descrição editável e remoção. Na página do prompt, a seção abaixo dos resultados oferece prévia com proporção preservada, ordem e botão Baixar referência em cada arquivo. Uma coluna no celular, duas no desktop; estados de download e falha são explícitos. A seção não aparece quando o prompt não tem referências.


## Identidade, discussão e formatos de prompt

Nas páginas internas, a identificação de um criador usa foto, nome e emblemas administrativos na mesma linha do nome; o @ fica na linha inferior. Explorar recebe os emblemas em lote, sem confiar nos dados do próprio prompt. A verificação obrigatória do @ ocorre em segundo plano; o diálogo abre somente após confirmar ausência do identificador ou falha de consulta.

Criar/editar oferece Imagem/texto, Site e Vídeo. Descrição breve de até 180 caracteres aparece em até duas linhas nos cards, com fallback para a descrição existente. Sites aceitam capturas e link HTTPS opcional. Vídeos aceitam arquivo MP4/WebM de até 30 MB ou link direto HTTPS; capas reproduzem sem som ao passar o mouse e param ao sair. Cards com vários resultados alternam as imagens ao passar o mouse. Movimento reduzido preserva a capa estática. Abaixo da capa, o bloco de informações usa cinza suave (#f0f0f3). Os controles de filtro não têm borda; a borda da biblioteca permanece.

Comentários ficam antes das recomendações, disponíveis em publicações e na visualização do dono quando o prompt estiver publicado. Visitantes leem; contas autenticadas com @ enviam texto de até 1.500 caracteres. Autor do comentário e criador do prompt podem excluir mediante confirmação. Paginação, carregamento e falhas são explícitos. Não há contagens fictícias.

## Categorias ao fim de Explorar

“Explore por categoria” adapta o FlowingMenu de React Bits à paleta clara existente: fundo transparente, texto `foreground`, divisórias `border-color` e faixa `surface-hover`. As linhas têm 116 px no desktop e 88 px até 639 px; títulos longos são truncados visualmente, preservando o nome completo no link. Hover e foco visível revelam uma faixa de texto e imagens reais de resultados (`gallery` ou `after`), quando disponíveis. Os links mantêm seta e indicação da categoria atual. Em dispositivos sem hover e com movimento reduzido, a navegação permanece estática, com foco visível e resposta ao toque. Não há animação de entrada automática. Os estilos da seção ficam restritos a `.site-app .explore-categories`.


## Refinamentos de Explorar e leitura do prompt

Explorar usa masonry por colunas (1; 2 a partir de 640 px; 3 a partir de 1100 px; 4 a partir de 1600 px), com 28 px entre colunas e 30 px entre cards. A primeira imagem carregada define a proporção da capa, limitada a 0,8–1,85, com fallback 4:3. Identidade, título, resumo, curtida e logo do modelo permanecem fora ou sobre a capa nas posições existentes; o perfil conserva sua grade. Somente em Explorar, a troca de resultados durante hover ou foco usa PixelTransition finito; movimento reduzido mantém a capa estática. Skeletons sinalizam o carregamento da rota, das imagens e da apresentação do criador, sem animação quando há preferência por movimento reduzido.

SearchSelect usa superfície clara, opções de pelo menos 44 px, seleção visível, busca de categoria/modelo, setas e Enter; mostra estado sem opções. A gaveta móvel mantém Limpar filtros no rascunho até Aplicar filtros e respeita a área segura inferior. CreatorPreview abre onde há hover, carrega o perfil público real e reutiliza Seguir/Seguindo e contagens existentes; o nome continua sendo link direto ao perfil, inclusive no toque. “Me surpreenda” abre aleatoriamente um dos prompts atualmente visíveis e só aparece com resultados disponíveis.

Na página do prompt, ScrollShadow envolve apenas o texto completo: sombras nas bordas indicam conteúdo acima ou abaixo somente quando existe rolagem restante. A região tem nome acessível e foco visível, com altura máxima de `min(480px, 50dvh)` no desktop e 400 px no celular. A landing mantém seus estilos e comportamento.

## Modal de login

O login compartilhado usa uma coluna branca de até 432 px, cantos de 20 px, logo e título centralizados, sem arte lateral ou glow. Provedores sociais precedem os campos rotulados de e-mail e senha; GitHub aparece somente quando habilitado. A senha permite mostrar/ocultar; recuperação, mensagens legíveis e criação de conta mantêm os fluxos existentes. Radix Dialog fornece fechamento por X, Escape ou clique externo, contenção de foco e bloqueio da rolagem; ao fechar, o foco volta ao elemento de origem. No celular, há margens de 12 px e campos de 16 px; movimento reduzido desativa as animações. O pedido de login autoriza este modal também sobre a landing, cujo desenho fora do diálogo é preservado. Referências, contrato e limites da revisão: `docs/design/login-modal.md`.

## Cadastro em quatro etapas

`/register` e suas etapas usam um layout próprio, sem o header e os offsets das páginas internas: painel lateral de progresso no desktop, formulário branco de até 460 px e, até 900 px, marca compacta e barra de quatro segmentos. Conta, Perfil, Biblioteca e Pronto substituem a jornada de sete etapas. Campos têm rótulos, autocomplete quando aplicável, foco visível e estados de espera/erro; no celular usam 16 px. O @ obrigatório é escolhido no formulário de perfil, com formato e disponibilidade explícitos, sem abrir o diálogo obrigatório nessa jornada. Biblioteca reúne uso individual/equipe e detalhes opcionais; o estado final resume somente os dados confirmados. Referências, persistência, compatibilidade e limites das prévias: `docs/design/onboarding.md`.

Em Explorar, capa e informações ficam no mesmo componente, mas visualmente separadas por apenas 4 px. A capa tem cantos de 18 px e o bloco de informações recupera o cinza original (#f0f0f3), com cantos de 16 px e as cores de texto do tema claro. O contêiner comum é transparente; hover e foco em qualquer região mantêm a interação conjunta da capa, preservando os links independentes do prompt, do criador e a curtida. O painel flutuante do criador conserva a superfície clara.

Na página do prompt, a barra de rolagem da galeria de resultados fica oculta. O avanço automático, arraste, toque e navegação por teclado continuam disponíveis.

## Navegação e rodapé internos

O header flutua com margem externa e se compacta em largura e altura ao rolar, mantendo a busca centralizada. Dropdowns de Explorar/Biblioteca oferecem atalhos e descrições; no celular, a navegação inferior mantém o indicador de página ativa. O rodapé usa painel claro, chamada tipográfica, ação circular e marca Mind em escala grande, com os destinos reais de descoberta e conta. As categorias preservam o componente completo: durante hover, a faixa preenche a linha inteira, sem reservar áreas fixas para título ou ação. Referências consultadas e decisões: `docs/design/navigation-footer.md`. A landing permanece protegida.

## MFA e celebração de assinatura

MFA usa QRCode do Spell UI em preto sobre branco com margem de segurança e CodeSlots do React Bits para seis dígitos. Checkboxes compartilham o traçado animado do Spell UI, com semântica e validação nativas. No retorno do checkout confirmado pelo servidor, TearTicket aparece sozinho no centro da tela, sem card ao redor, com arte fotográfica existente, logo real do Mind, primeiro nome da conta e plano na ponta destacável; apresenta a assinatura e permite destacar a ponta por arraste ou teclado antes de “Plano ativado!”. Fechar/continuar sem animação permanece disponível. Referências, adaptações e limites: `docs/design/mfa-and-subscription-components.md`.

## Campos de seleção e anexos

`SelectField` padroniza seleções de formulários e filtros com HeroUI Select/Autocomplete, rótulos, validação, teclado, indicadores de seleção e portal dentro de diálogos nativos. As variantes pesquisáveis preservam logos e nomes personalizados de IA; filtros continuam sem borda. Campanhas usam DatePicker com calendário, hora de 24 horas e fuso local. Uploads substituem entrada de URL de imagem/vídeo. Referências, escopo e conferências: `docs/design/form-controls.md`.

### Entrada principal e cupons de campanha

A landing permanece em `/`. A logo do header das páginas internas aponta sempre para `/explore`, inclusive para usuários autenticados. Cupons opcionais das campanhas aparecem abaixo da descrição em um ticket claro, com curvas invertidas nas laterais e botão de copiar. O código mantém a grafia do anunciante; campanhas sem cupom não exibem esse bloco.

## GradientASCII na landing

Alteração diretamente autorizada pelo proprietário: o fundo do hero da rota `/`
usa GradientASCII do React Bits em modo claro, forma horizon e paleta azul do
anexo. Textos, ações, galeria e comunidade mantêm a composição existente.
O efeito carrega no cliente, respeita movimento reduzido e pausa fora da tela,
com a aba oculta e durante o login. Sem WebGL2, permanece o fundo azul claro.
