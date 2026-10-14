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
  sidebar:
    width: "80px"
    backgroundColor: "{colors.surface}"
  header:
    height: "64px"
    backgroundColor: "{colors.surface}"
  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
---

# Mind — layout e tema compartilhados

## Direção

Por solicitação do proprietário, todas as páginas usam somente o tema claro. A biblioteca, os prompts, os perfis, o cadastro, o login e os estados de erro compartilham a mesma paleta. O céu e a galeria da landing são conteúdo visual; os emblemas mantêm as cores que indicam sua identidade.

O conteúdo conduz a página: imagens e texto do prompt primeiro; identidade, detalhes e instruções depois. Evitar estatísticas fictícias e reformulações de conteúdo sem necessidade.

## Navegação persistente

`components/layout/SiteLayout.tsx`, aplicado no layout raiz, é o único responsável por montar `Header` e `Sidebar`. As páginas não repetem esses componentes nem reservam offsets próprios para eles.

- Header fixo de 64 px, fundo branco e borda inferior. Título contextual, busca na biblioteca e acesso ao perfil ou login.
- Sidebar fixa de 80 px a partir de 768 px, somente com o logo e ícones: explorar, biblioteca, favoritos e perfil. O estado ativo e o foco são visíveis.
- Em telas menores, o mesmo menu abre em um dialog nativo com backdrop, foco contido, Escape e botão de fechar. A página continua com largura total quando o menu está fechado.
- A raiz reserva 64 px no topo e, no desktop, 80 px à esquerda. Os containers principais têm até 1152 px, com gutters de 20 px no celular e 32 px a partir do breakpoint pequeno.
- Links de retorno e ações específicas ficam no conteúdo; não criam outro header. O acesso autenticado não impede explorar a landing.

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
- Manter um único header e uma única sidebar por página, inclusive em carregamentos e erros.
- Usar foco visível, labels acessíveis, targets confortáveis e navegação por teclado.
- Não reintroduzir um tema escuro isolado em perfis, formulários ou biblioteca.
- Não oferecer emblemas autoconcedidos nem métricas inventadas.
