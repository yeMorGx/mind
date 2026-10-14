# Ativar perfis e prompts públicos

A aplicação continua usando Firebase. A biblioteca e os documentos `users` permanecem privados. A publicação grava somente nome e bio em `creatorProfiles`, e os prompts escolhidos em `publicPrompts`. E-mail, convites e informações da equipe não são publicados.

## Ativação no projeto `mind-a9499`

1. Abra o Firebase Console, Firestore Database, aba **Regras**.
2. Substitua o conteúdo pelo arquivo `firestore.rules` deste repositório e clique em **Publicar**. O arquivo preserva as permissões existentes da biblioteca.
3. Em **Meu perfil de criador**, salve nome e bio e clique em **Publicar perfil**.
4. Na biblioteca, clique em **Publicar** somente nos prompts que deseja divulgar.

Alternativa, em um terminal local com acesso administrativo ao projeto:

```sh
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project mind-a9499
```

## Links e comportamento

- Perfil: `/u/{uid}`.
- Prompt: `/share/{uid}/{promptId}`.
- Perfil e prompts começam privados. Publicar um perfil não publica a biblioteca.
- Tornar um perfil privado oculta todos os seus links públicos. Publicar o perfil novamente restaura os prompts que continuavam publicados.
- Tornar um prompt privado remove sua cópia pública.
- Editar um prompt publicado atualiza a cópia pública na mesma operação. Excluir remove ambas as cópias.
- Os visitantes não precisam de conta para ler publicações.

## Verificação após ativar

Use uma conta do projeto para publicar um perfil e apenas um prompt. Abra os links numa janela anônima. Confirme que os outros prompts não aparecem. Retire o prompt e depois o perfil do ar e confirme que os links deixam de mostrar as publicações.

O ambiente de desenvolvimento desta alteração não tinha credenciais administrativas do Firebase. O deploy na Vercel publica o código, mas não publica automaticamente as regras do Firestore. A ativação e a verificação com conta real precisam ser feitas após publicar as regras.
