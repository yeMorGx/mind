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
