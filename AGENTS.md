<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Regras do projeto

## 1. Prioridades (em caso de conflito, siga esta ordem)

1. Não quebrar produção: contas, dados e fluxos de autenticação existentes.
2. Respeitar a landing (`/`), que é protegida (seção 6).
3. Seguir o sistema de design (seção 3).
4. Entregar a funcionalidade pedida.

## 2. Backend e dados

- Login, onboarding e biblioteca em produção usam **Firebase**. Preserve o acesso às contas e aos dados existentes.
- A migração para **Supabase** está preparada, mas NÃO deve substituir o backend ativo antes da configuração e da validação dos fluxos de autenticação e dados.
- Nunca commite arquivos de segredos, `.env` ou chaves.

## 3. Sistema de design (obrigatório em toda tela interna)

O objetivo é um visual consistente, limpo e profissional. Nenhuma tela pode parecer feita à parte das outras.

### 3.1 Tokens
- Cores, raios, sombras, espaçamentos e tamanhos vêm SOMENTE de tokens semânticos (CSS variables + Tailwind), definidos em um único lugar.
- PROIBIDO: hex solto, `text-[11px]`, `p-[13px]`, `rounded-[7px]` e qualquer valor arbitrário. Se faltar um token, crie o token e documente.
- Todo token precisa funcionar nos temas claro e escuro.
- Preserve as cores próprias de imagens, logos, emblemas e QR Codes.

### 3.2 Tipografia
- Escala única: título de página 32/700, título de seção 18/600, corpo 14/400, texto auxiliar 13/400.
- Nada abaixo de 12px, em nenhum caso.
- Texto auxiliar usa o token `muted`, com contraste mínimo AA nos dois temas.
- Um único peso de destaque por bloco. Não misture muitos pesos e tamanhos na mesma área.

### 3.3 Espaçamento e layout
- Grade de 4/8px. Padding interno de card: 24px. Gap entre cards: 16px.
- Listas de mensagens e texto de leitura com largura máxima de ~720px; em telas largas, nunca deixe o conteúdo esticado e colado à esquerda.
- Itens de uma mesma lista (sidebar, menus, tabelas) compartilham o mesmo eixo de alinhamento à esquerda.
- Mobile primeiro: nenhuma tela pode ter rolagem horizontal inesperada.

### 3.4 Componentes
- Reutilize `components/ui/*`. NÃO crie variações novas de Button, Card, Input, Avatar, Badge, IconButton ou Tabs: estenda o componente existente.
- Se o componente base ainda não existir, crie-o em `components/ui/` antes de usá-lo em páginas.
- Ícones: um único set, 18px, stroke consistente, cor com contraste suficiente, área de clique mínima de 36px.
- Ações secundárias repetidas (responder, reagir, copiar) aparecem só no hover/focus; o restante vai no menu "⋯", sempre presente de forma consistente.
- Mensagens seguidas do mesmo autor são agrupadas; datas aparecem em separadores de dia, não em cada item.
- Campos de entrada têm placeholder contextual ("Mensagem para David…", não genérico).
- Para imagens anexadas, mostre miniatura em vez de ícone genérico de arquivo.
- Não duplique informação na mesma tela (ex.: o mesmo selo/rótulo no topo e no rodapé).

### 3.5 Estados obrigatórios
Toda tela e componente novo precisa tratar: vazio, carregando (skeleton), erro, hover, focus visível, ativo e desabilitado. Botões de ação principal nunca podem parecer desabilitados quando estão ativos.

### 3.6 Qualidade visual (anti "cara de IA")
- Uma cor de destaque + neutros. Cor de status somente para status.
- Sem gradientes genéricos, sem emoji como ícone, sem blocos idênticos repetidos sem hierarquia.
- Sombras leves e raros; prefira separação por espaçamento e superfícies.
- Antes de concluir qualquer mudança visual: abra a tela no navegador, tire screenshots nos temas claro e escuro e confira contra esta seção. Liste o que ficou fora do padrão.

## 4. Componentes específicos (já existentes)

### Checkboxes
Use `components/ui/animated-checkbox.tsx` (AnimatedCheckbox, baseado no Spell UI) para novos checkboxes. Preserve `name`, `required`, estados controlados, validação e comportamento de teclado; não substitua por um elemento clicável sem input nativo.

### Campos de seleção
Use `components/ui/SelectField.tsx` para novos campos de seleção e filtros. Não adicione `<select>` nativo; preserve rótulo, validação, estados desabilitados e nome do campo de formulário no componente compartilhado.

### Mídia
Para imagem e vídeo, ofereça anexo de arquivo com validação de tipo e tamanho. Não peça URL de mídia em novos campos. URLs de destino de site ou botão continuam permitidas.

## 5. Temas, idiomas e configurações

- As páginas internas oferecem temas claro, escuro e sistema, com inglês como idioma padrão e seletor para inglês, espanhol, japonês, português e francês.
- Use cores semânticas e `useI18n().t()` para todo texto novo; mantenha as traduções em `lib/i18n/messages`. Datas e números usam `intlLocale`.
- Não traduza conteúdo, nomes ou títulos publicados pelos criadores.
- Configurações usa rotas `/home/settings/{section}` e monta somente a seção selecionada. Aparência inclui tema e idioma; edição de perfil fica no perfil.

## 6. Landing (`/`) protegida

- A landing mantém sua apresentação original, sem o header ou a sidebar das páginas internas, com idioma e metadados independentes.
- NÃO altere seu layout, cores, textos ou comportamento sem solicitação explícita do proprietário.
- A autorização precisa mencionar diretamente a landing. Pedidos gerais ("ajustar o site inteiro", temas, header, sidebar, refatorar design) NÃO autorizam mudanças nela, inclusive alterações indiretas por componentes, tokens ou estilos compartilhados. Ao mexer em tokens ou componentes compartilhados, confirme que a landing continua idêntica.

## 7. Como trabalhar

### 7.1 Funcionalidades novas
- Siga o sistema de design da seção 3. Preserve estrutura, rotas, dados e comportamento existentes.
- Não faça reformulações da landing, do login ou do painel que não foram pedidas.

### 7.2 Refatoração visual (só quando o pedido disser "refatorar design")
- Trabalhe em UMA rota ou módulo por vez, em branch própria `design/<rota>`.
- Primeiro, se ainda não existir: inventário de valores soltos (grep por hex, `text-[`, `p-[`, `rounded-[`), proposta enxuta de tokens e criação dos componentes base. Não altere páginas nessa etapa.
- Depois, refatore a rota usando só tokens e `components/ui`, e rode lint e build.
- NÃO faça push em `master` nem deploy: entregue o link de preview da Vercel, screenshots (claro e escuro) e a lista de mudanças para aprovação.

## 8. Publicação

- Para mudanças funcionais e pequenas que passaram nas verificações relevantes (lint, build, testes aplicáveis): faça commit e push para a branch de produção `master`. O proprietário autorizou a publicação contínua na Vercel, sem confirmação adicional.
- Refatorações visuais seguem a seção 7.2 (branch e preview, sem push em `master`).
- Confira o resultado do deploy automático da Vercel para o commit enviado. Se houver bloqueio de credenciais, configuração ou deploy, informe o estado real e o que falta.
- Não publique arquivos de segredos. Nunca use force push.

## 9. Animação e movimento

### 9.1 Tokens de movimento
- Durações, easings e distâncias vêm SOMENTE de tokens (CSS variables +
  `lib/motion.ts`), definidos em um único lugar. PROIBIDO: `duration-[437ms]`,
  `delay-[120ms]`, cubic-bezier solto e `y: 37` direto no componente.
- Tokens mínimos: `fast` (150ms), `base` (250ms), `slow` (600ms), um easing
  de saída e uma mola padrão. Se faltar um token, crie e documente.

### 9.2 Onde cada efeito pode existir
- Telas internas (chat, kanban, dashboards, configurações): APENAS
  microinterações e transições curtas (<250ms), com feedback de hover,
  active, foco, sucesso e erro. NÃO usar parallax, pinning, scroll-jacking,
  smooth scroll global, cursor customizado, tilt ou text reveal.
- Efeitos de scroll e de mouse (reveal, parallax, pinning, tilt, spotlight,
  magnético, smooth scroll) só em páginas públicas de marketing.
- A landing (`/`) só recebe qualquer animação com autorização explícita
  (seção 6). Provider de smooth scroll e estilos globais de movimento NÃO
  podem ser montados no layout raiz de forma que alcancem a landing.

### 9.3 Bibliotecas
- Microinterações, layout animations e transições: Framer Motion (Motion).
- GSAP + ScrollTrigger e Lenis: somente nas páginas públicas autorizadas.
- Antes de usar APIs de roteamento/transição do Next, ler o guia em
  `node_modules/next/dist/docs/`. Não adicionar dependência sem listá-la
  no plano e justificar.

### 9.4 Regras técnicas
- Animar somente `transform` e `opacity`; nunca width, height, top, left.
- Respeitar `prefers-reduced-motion`: sem parallax, pinning, tilt, cursor
  customizado nem smooth scroll; manter só fades simples.
- Efeitos de mouse desativados em touch. Meta de 60fps; sem re-render de
  React durante animação (usar refs, memo, callbacks estáveis).
- Limpar timelines e ScrollTriggers no unmount. Sem layout shift e sem
  esconder conteúdo se o JS falhar.
- Texto animado usa `t()` e funciona em todos os idiomas suportados
  (inclusive japonês: não dividir por espaços; dividir por linha).

### 9.5 Propósito
- Cada animação precisa comunicar algo (feedback, hierarquia, continuidade
  ou atenção). Se não comunica, remover.
- No máximo um momento de destaque por página; o resto fica quieto.
- Variar timing e easing conforme o peso do elemento; nada de fade-up igual
  em tudo.

### 9.6 Verificação
- Testar nos temas claro e escuro e com reduced-motion ativado; anexar
  screenshots/gravação curta e listar o que ficou fora do padrão.
- Mudanças de movimento em várias telas contam como refatoração visual e
  seguem a seção 7.2 (branch `design/<rota>`, preview da Vercel, sem push
  em `master`).

