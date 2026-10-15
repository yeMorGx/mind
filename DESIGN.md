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

O catálogo usa colunas responsivas, capas reais em proporção 4:3, sem borda externa nos cards públicos, e metadados abaixo das imagens com título, autor ou status, modelo quando informado e ação de copiar. A biblioteca conserva as ações animadas de editar, copiar, favoritar e duplicar, além de publicar/tornar privado e excluir. Não há contadores de visualizações ou curtidas inventados. Os estados vazios e falhas de carregamento permanecem explícitos.

## Cores e componentes

`app/globals.css` define os tokens semânticos e os registra no Tailwind. Usar `background`, `surface`, `foreground`, `muted`, `subtle`, `border`, `primary` e `primary-foreground` em vez de escolher cores claras ou escuras em cada página.

Textos secundários usam cores opacas legíveis, não branco translúcido. Campos são claros, com bordas discretas e foco escuro. Ações principais são escuras com texto branco; ações secundárias são neutras. Erros usam vermelho escuro sobre fundos claros. Branco sobre preto continua permitido em etiquetas de fotografia, marcas e backdrops de imagens.

Action nodes, upload dropzones, editores e lightbox usam os mesmos tokens. Geist é a fonte da interface. Instrument Serif permanece nos títulos da landing. O código do prompt mantém a fonte monospace.

## Perfis e prompts

O perfil mantém a capa, o avatar sobreposto e a grade de publicações. O dono abre uma seção de edição pelo botão “Editar perfil” na própria página. Administração de emblemas permanece nessa seção; backup e atualização de acesso ficam em Configurações. `/home/profile` redireciona para o perfil canônico.

O crachá 3D fica dentro do card “Conheça o criador”, com uma cena de até 300 × 310 px. O nome aparece apenas na arte do crachá; os emblemas e o link ficam abaixo. A foto ou inicial serve de fallback sem WebGL.

Resultados de prompts usam uma galeria horizontal manual, sem avanço automático nem imagens duplicadas. É possível arrastar com mouse, deslizar no celular ou usar setas quando a galeria está em foco. Clicar sem arrastar abre a imagem completa. A comparação antes/depois preserva as cores necessárias sobre as fotografias.

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

Header de 116 px com marca/conta e busca em largura total; navegação inferior de 64 px mais a área segura. A busca em foco esconde a barra inferior. A raiz reserva espaço para ambas as barras. Filtros abrem em um painel ancorado; a ordenação usa um controle compacto. Campos usam pelo menos 16 px para evitar zoom automático no iPhone. As ações dos cards da biblioteca ficam dentro da capa, com alvos de toque de 44 px, preservando a animação no desktop. A landing fica fora dessas regras.

## Atualização do catálogo a partir do wireframe

Referência de estrutura: Figma `qCkRPKTQMKNyqzBN7EztnX`, nó `192:149`. Capas em 7:6, cantos de 18 px; bloco de identificação separado por 10 px, com avatar/nome antes do título e curtidas discretas na mesma linha do criador. Sem copiar ou exibir o corpo do prompt nos cards públicos.

Explorar e perfil usam largura disponível, com 24 px laterais no desktop e 16 px no celular. A biblioteca não recebe essa mudança. Header somente com logo, busca centrada e avatar real com fallback Google/inicial. Campo sem outline externo; sugestões e seleção por teclado continuam visíveis. Somente o envio de uma consulta altera os resultados de Explorar. Três dropdowns estilizados reúnem ordenação, categoria e modelo; não há chips de tipo. No perfil, Seguir/Seguindo e contagens reais substituem Compartilhar perfil. Curtidas e seguidores carregam em lote e mostram falhas e estados pendentes; não apresentar contagens simuladas.

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
