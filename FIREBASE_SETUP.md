# Configuração do Firebase

O Mind usa Firebase Authentication e Cloud Firestore. O projeto não contém credenciais; cada ambiente deve fornecer a configuração do próprio projeto Firebase.

## Configuração local

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Registre um app Web e copie os valores de configuração para `.env.local`, usando `.env.example` como modelo. `API key`, `Auth domain`, `Project ID` e `App ID` são necessários; `Storage bucket` e `Messaging sender ID` são opcionais para os recursos usados aqui.
3. Em **Authentication → Sign-in method**, habilite **Email/Password** e **Google**.
4. Em **Firestore Database**, crie um banco e publique as regras de `firestore.rules`.
5. Em **Authentication → Settings → Authorized domains**, inclua o domínio local e o domínio de produção.
6. Reinicie o servidor depois de preencher as variáveis.

As configurações `NEXT_PUBLIC_FIREBASE_*` são identificadores públicos do app Web. A autorização dos dados é feita pelas regras do Firestore. Nunca coloque uma chave de conta de serviço ou segredo administrativo em uma variável `NEXT_PUBLIC_*`.

Se usar Firebase CLI, associe este diretório ao projeto com `firebase use --add` e publique as regras com `firebase deploy --only firestore:rules`. Senhas são gerenciadas pelo Firebase Authentication e não são gravadas nos documentos do Firestore.

## Login com Discord

O botão do Discord usa um provedor OpenID Connect do Firebase com o ID `oidc.discord`. Configure esse provedor em **Authentication → Sign-in method → Add new provider → OpenID Connect**, use `oidc.discord` como Provider ID e informe as credenciais OAuth da aplicação Discord. Sem essa configuração, use e-mail/senha ou Google.

## Convites de equipe

Os endereços informados durante o onboarding são salvos no documento do workspace como convites pendentes. O navegador não envia e-mails. Para entregar convites, configure uma função server-side (Cloud Functions ou Cloud Run) com um provedor de e-mail; não use credenciais administrativas no cliente.

## Dados salvos

- `users/{uid}`: perfil, respostas do onboarding e workspace principal.
- `workspaces/{workspaceId}`: nome, ícone, proprietário e convites pendentes.
- `workspaces/{workspaceId}/prompts/{promptId}`: título, conteúdo e estado de favorito dos prompts.

As regras incluídas dão acesso ao perfil ao próprio usuário e ao workspace e aos prompts apenas ao proprietário. Compartilhamento entre membros requer regras e fluxo de convite/aceitação adicionais.
