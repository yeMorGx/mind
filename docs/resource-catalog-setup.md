# Ativar arquivos Markdown e o diretório de MCPs

Projeto de destino: `rwltdjwjxrcmmxksxlxk` (Mind).

## Pré-requisitos existentes

O projeto já deve ter as migrações de contas nativas, perfis públicos, @, MFA, relações sociais e comentários de 14–15/10/2026. Esta alteração não migra contas nem modifica prompts existentes.

## Banco

Aplicar **somente** `supabase/migrations/20261017034641_resource_catalog.sql` pela conexão administradora do projeto ou pelo SQL Editor do Supabase. Não executar migrações de outros projetos ou reaplicar toda a pasta. A migração cria recursos/favoritos com RLS e amplia as validações sociais para os IDs `resource_<uuid>`.

A migração pendente `20261015145914_prompt_resources.sql` serve para anexos em prompts e não é pré-requisito para este catálogo.

## Contas Firebase

Publicar a Edge Function `resource-actions`, cujo código está em `supabase/functions/resource-actions/index.ts`, com a checagem JWT do gateway desativada: a função valida diretamente os tokens Firebase (RS256, issuer, audience e validade). Essa configuração segue a ponte existente `social-actions`. Nunca desativar a validação interna da função.

Na CLI autenticada no projeto correto:

```sh
supabase functions deploy resource-actions --project-ref rwltdjwjxrcmmxksxlxk --no-verify-jwt
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são variáveis de ambiente do runtime Supabase. A chave privilegiada nunca deve ser colocada na Vercel como `NEXT_PUBLIC_*`.

## Frontend

Reutiliza apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` já presentes na Vercel. Nenhuma nova variável de ambiente de frontend é necessária.

## Conferência após ativar

Com contas autorizadas, conferir rascunho privado, publicação e retirada, abertura anônima, busca, perfil, comentários, likes e favoritos. Conferir também que outra conta não consegue editar nem ler rascunhos, e que MFA continua exigido para escritas quando ativo. Nenhum desses fluxos de escrita foi executado nesta sessão, devido à falta de acesso administrativo ao Mind.
