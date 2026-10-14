# Configurar o Supabase

Status: este guia registra a preparação antiga do marketplace. A migração ativa por conta, com preservação de IDs e vínculo autenticado, está em `docs/migration-supabase.md` e `supabase/migrations`. Contas não migradas continuam no Firebase; não execute o SQL antigo sobre a migração atual.

O Mind usa Supabase Auth, Postgres com Row Level Security e Storage privado. O esquema do marketplace está em `SUPABASE_SETUP.sql`.

## 1. Conectar o app ao projeto

No painel Supabase, abra o projeto e copie **Project URL** e **Publishable key** em **Connect** ou **Settings → API Keys**. Use a chave `sb_publishable_...`; ela foi feita para ficar no navegador e nunca deve ser confundida com a `service_role`/secret key.

Crie `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
```

No Vercel, cadastre os mesmos nomes em **Project → Settings → Environment Variables** para Production, Preview e Development e faça um novo deploy. Variáveis `NEXT_PUBLIC_*` entram no bundle durante o build.

## 2. Criar tabelas, políticas e armazenamento

No Supabase, abra **SQL Editor → New query**, cole o conteúdo de `SUPABASE_SETUP.sql` e execute. O script cria:

- perfis privados com dados de onboarding;
- prompts em rascunho ou publicados;
- imagens ordenadas para referência, carrossel e comparação antes/depois;
- favoritos privados;
- políticas RLS e o bucket privado `prompt-images`, com limite de 20 MB e tipos de imagem permitidos.

Não habilite leitura pública das tabelas. A galeria só lê linhas com `status = 'published'`; usuários autenticados só escrevem nos próprios registros. O bucket é privado e as páginas recebem links temporários assinados.

## 3. Configurar autenticação e redirecionamentos

Em **Authentication → URL Configuration**:

- defina `https://mind-lemon.vercel.app` como Site URL;
- adicione `http://localhost:3000/auth/callback` e `https://mind-lemon.vercel.app/auth/callback` em Redirect URLs.

O cadastro por e-mail usa confirmação de endereço por padrão. Para entregabilidade em produção, configure um provedor SMTP próprio em **Authentication → SMTP Settings**.

Google e Discord são opcionais. Ative cada provedor em **Authentication → Sign In / Providers** e cole o Client ID e Secret do respectivo console. Use o callback `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback` como URI de redirecionamento no Google ou Discord.

## 4. Publicar

Reinicie o servidor local depois de preencher `.env.local`. No Vercel, salvar as variáveis não atualiza um deploy que já foi criado; gere um novo deploy depois da configuração.

Nenhuma chave administrativa é necessária no app. Nunca use `service_role` ou uma secret key em variável `NEXT_PUBLIC_*`, no navegador ou em um arquivo commitado.

## Dados antigos do Firebase

O Firebase criado anteriormente permanece intacto. Esta versão não lê nem apaga esse projeto. Contas e documentos do Firestore não são importados automaticamente; senhas não podem ser exportadas para outro provedor. Os usuários precisarão criar conta no Supabase, e dados que devam ser preservados precisam de uma exportação/importação separada.
