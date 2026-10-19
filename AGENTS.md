<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Publicação autorizada pelo proprietário

Preserve o visual e os layouts existentes ao adicionar funcionalidades. O proprietário quer as páginas individuais dos prompts sem uma reformulação da landing, do login ou do painel. Redesigns gerais precisam de uma solicitação explícita.

O login, o onboarding e a biblioteca em produção usam Firebase. Preserve o acesso às contas e aos dados existentes. A migração para Supabase está preparada, mas não deve substituir o backend ativo antes de sua configuração e da validação dos fluxos de autenticação e dados.

Após concluir mudanças neste projeto e passar nas verificações relevantes, faça commit e push para a branch de produção `master`. O proprietário autorizou a publicação contínua na Vercel, sem pedir confirmação novamente.

Confira o resultado do deploy automático da Vercel para o commit enviado. Se houver um bloqueio de credenciais, configuração ou deploy, informe o estado real e o que falta. Não publique arquivos de segredos nem use force push.

A landing (`/`) deve manter sua apresentação original, sem o header ou a sidebar das páginas internas. Não alterar seu layout, cores, textos ou comportamento sem solicitação explícita do proprietário.

A autorização precisa mencionar diretamente a landing. Pedidos gerais para ajustar o site inteiro, temas, header ou sidebar não autorizam mudanças nela, inclusive alterações indiretas por componentes ou estilos compartilhados.

## Checkboxes

Use `components/ui/animated-checkbox.tsx` (AnimatedCheckbox, baseado no Spell UI) para novos checkboxes. Preserve `name`, `required`, estados controlados, validação e comportamento de teclado; não substitua por um elemento clicável sem input nativo.

## Campos de seleção e mídia

Use `components/ui/SelectField.tsx` para novos campos de seleção e filtros. Não adicione `<select>` nativo; preserve rótulo, validação, estados desabilitados e nome do campo de formulário no componente compartilhado.

Para imagem e vídeo, ofereça anexo de arquivo com validação de tipo e tamanho. Não peça URL de mídia em novos campos. URLs de destino de site ou botão continuam permitidas.

## Temas e idiomas da interface

As páginas internas agora oferecem temas claro, escuro e sistema, com inglês
como idioma padrão e seletor para inglês, espanhol, japonês, português e francês.
Use cores semânticas e `useI18n().t()` para textos novos; mantenha as traduções
em `lib/i18n/messages`. Formatação de datas e números usa `intlLocale`.
Preserve as cores próprias de imagens, logos, emblemas e QR Codes. Não traduza
conteúdo, nomes ou títulos publicados pelos criadores. A landing continua
independente, com sua apresentação, idioma e metadados preservados.

Configurações usa rotas `/home/settings/{section}` e monta somente a seção
selecionada. Aparência inclui tema e idioma; edição de perfil fica no perfil.
