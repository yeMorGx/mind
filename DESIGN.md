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
- Sem sidebar, por solicitação do proprietário. Explorar, Biblioteca e Favoritos ficam no header. Perfil e saída ficam no menu da conta, com fechamento por Escape e clique fora.
- Os menus levam a Meus prompts, Explorar, Favoritos e Meu perfil. Categorias e modelos ficam acima da grade, derivam dos registros reais e filtram o catálogo atual; não há links de recursos indisponíveis, métricas fictícias ou ordenação “em alta” sem dados.
- A raiz reserva somente o topo: 72 px no desktop e 128 px no celular, onde a busca ocupa uma segunda linha. A busca funciona na biblioteca e no catálogo; ao enviar de outra página, abre o catálogo público.
- `/explore` é o catálogo público interno, independente da landing protegida. Usuários sem conta podem abrir e copiar prompts publicados. O acesso a funções privadas pede login.
- A landing mantém seus arquivos, seu comportamento e seus estilos anteriores. As novas regras de CSS são restritas a `.site-app`.

### Catálogo inspirado na referência

O catálogo usa colunas responsivas, capas reais em proporção 4:3, sem borda externa nos cards públicos, e metadados abaixo das imagens com título, autor ou status, modelo quando informado e ação de copiar. A biblioteca conserva as ações animadas de editar, copiar, favoritar e duplicar, além de publicar/tornar privado e excluir. Não há contadores de visualizações ou curtidas inventados. Os estados vazios e falhas de carregamento permanecem explícitos.

## Cores e componentes

`app/globals.css` define os tokens semânticos e os registra no Tailwind. Usar `background`, `surface`, `foreground`, `muted`, `subtle`, `border`, `primary` e `primary-foreground` em vez de escolher cores claras ou escuras em cada página.

Textos secundários usam cores opacas legíveis, não branco translúcido. Campos são claros, com bordas discretas e foco escuro. Ações principais são escuras com texto branco; ações secundárias são neutras. Erros usam vermelho escuro sobre fundos claros. Branco sobre preto continua permitido em etiquetas de fotografia, marcas e backdrops de imagens.

Action nodes, upload dropzones, editores e lightbox usam os mesmos tokens. Geist é a fonte da interface. Instrument Serif permanece nos títulos da landing. O código do prompt mantém a fonte monospace.

## Perfis e prompts

O perfil mantém a capa, o avatar sobreposto e a grade de publicações. O dono abre uma seção de edição pelo botão “Editar perfil” na própria página. Backup, administração e migração permanecem nessa seção. `/home/profile` redireciona para o perfil canônico.

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
