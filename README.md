# Mind

Biblioteca pessoal de prompts feita com Next.js, React, TypeScript, Tailwind CSS e Firebase.

## O que já funciona

- Cadastro por e-mail e senha com onboarding salvo no Cloud Firestore.
- Login por e-mail/senha e Google, recuperação de senha e provedor Discord OIDC opcional.
- Criação de workspace pessoal ou de equipe.
- Criação, edição, busca, exclusão e favoritar prompts no workspace.
- Regras do Firestore que limitam cada perfil e workspace ao proprietário.

## Rodar localmente

1. Instale as dependências com `npm install`.
2. Configure o Firebase seguindo [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).
3. Inicie o servidor com `npm run dev` e abra [http://localhost:3000](http://localhost:3000).

Rotas principais: `/` (landing/login), `/register` (onboarding) e `/home` (biblioteca de prompts).

## Scripts

- `npm run dev` inicia o servidor local.
- `npm run build` gera a versão de produção.
- `npm run lint` executa ESLint.

## Limites atuais

Convites ficam salvos como pendentes, sem envio de e-mail. O workspace ainda é privado ao proprietário; colaboração exige um fluxo de convite e regras de acesso adicionais. O Discord precisa de configuração OIDC no Firebase Console.
