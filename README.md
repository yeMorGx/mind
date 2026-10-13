# Mind

Biblioteca de prompts com Next.js, React, TypeScript, Tailwind CSS e Firebase. O login, o onboarding e o acesso aos workspaces em produção usam a integração Firebase existente.

## Integração ativa

- Login por Google e e-mail/senha; recuperação de senha e Discord OIDC opcional.
- Onboarding e contas existentes no Firebase Auth e no Firestore.
- Criação, edição, busca, exclusão e favoritos na biblioteca privada do proprietário.
- Modal de login compacto com o visual original e imagem lateral.

Para rodar localmente, instale as dependências com `npm install`, configure as variáveis Firebase seguindo [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) e execute `npm run dev`.

## Marketplace e migração em preparação

A página individual `/p/<slug>` e os componentes de galeria, referência, antes/depois, criador e prompts relacionados estão implementados. Atualmente, essas páginas consultam apenas publicações explícitas do Supabase; elas não tornam os prompts privados do Firebase públicos.

O editor de publicações está preservado em `components/prompts/MarketplacePromptDialog.tsx`. O esquema e as instruções de preparação estão em [SUPABASE_SETUP.md](./SUPABASE_SETUP.md). A configuração do Supabase e a migração das contas e dos dados existentes precisam ser concluídas e verificadas antes de substituir o backend ativo. As senhas dos usuários não são transferidas automaticamente entre os provedores.

## Scripts

- `npm run dev`: servidor local.
- `npm run build`: build de produção e verificação TypeScript.
- `npm run lint`: ESLint.

O proprietário autorizou commit, push e publicação automática na Vercel após as verificações. Preserve o visual existente ao adicionar funcionalidades.

O comparador de imagens foi adaptado do Image Compare da Bencho, sob licença MIT. A licença e a atribuição estão em [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
