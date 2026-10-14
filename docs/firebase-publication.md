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
- **Salvar perfil** grava o rascunho privado, mesmo quando há uma versão pública. **Publicar perfil** ou **Publicar alterações** atualiza a página pública. Se a etapa pública for recusada, o rascunho fica salvo e o estado de publicação anterior é preservado.
- Tornar um perfil privado oculta todos os seus links públicos. Publicar o perfil novamente restaura os prompts que continuavam publicados.
- Tornar um prompt privado remove sua cópia pública.
- Editar um prompt publicado atualiza a cópia pública na mesma operação. Excluir remove ambas as cópias.
- Os visitantes não precisam de conta para ler publicações.

## Verificação após ativar

Use uma conta do projeto para publicar um perfil e apenas um prompt. Abra os links numa janela anônima. Confirme que os outros prompts não aparecem. Retire o prompt e depois o perfil do ar e confirme que os links deixam de mostrar as publicações.

O ambiente de desenvolvimento desta alteração não tinha credenciais administrativas do Firebase. O deploy na Vercel publica o código, mas não publica automaticamente as regras do Firestore. A ativação e a verificação com conta real precisam ser feitas após publicar as regras.

## Capa, foto e emblemas

O perfil permite adicionar foto, capa e uma apresentação curta em **Meu perfil de criador**. Os arquivos JPEG, PNG e WebP são otimizados antes de salvar. Para aceitar os novos campos e habilitar os emblemas, publique a versão atualizada de `firestore.rules`.

Os emblemas são mantidos em `accountBadges/{uid}`, fora do perfil editável. O cliente não pode atribuir a coroa de fundador. Os demais emblemas exigem a claim administrativa `badgeAdmin`, definida por servidor confiável.

Com credenciais administrativas do projeto configuradas em uma máquina confiável:

```sh
node scripts/assign-badges.mjs --email EMAIL_DA_CONTA --badges owner,verified --grant-admin
```

Use o e-mail da conta do proprietário solicitado nesta conversa. O script confirma a identidade no Firebase Auth antes de gravar. Não publique arquivos de credenciais e não use a chave Web do Firebase como credencial administrativa. Depois da atribuição, entre novamente na conta para renovar as permissões.

Para outros integrantes, use `--uid UID --badges verified,creator`, por exemplo. `--grant-admin` deve ser reservado às contas que administrarão os emblemas. A administração autenticada fica em `/home/badges`, acessível pelo link **Gerenciar emblemas da comunidade** no editor de perfil.

Categorias: fundador (coroa dourada), conta verificada (medalhão azul), moderador (escudo verde), criador (câmera violeta) e parceiro patrocinado (aperto de mãos cobre). Nenhum selo é concedido automaticamente com base em popularidade estimada.

A atribuição de fundador foi tentada durante esta implementação e falhou com `app/invalid-credential`. Nenhum emblema administrativo foi aplicado ao proprietário neste ambiente.

Se preferir atribuir apenas a coroa e a verificação pelo Firebase Console: encontre a conta do proprietário em **Authentication → Users**, copie o UID e crie `accountBadges/{UID}` no Firestore com o campo `badges` do tipo array contendo `owner` e `verified`. Isso deve ser feito pela conta administrativa no Console, nunca pelo formulário de perfil. A permissão para gerenciar outros emblemas pela aplicação continua exigindo a claim `badgeAdmin` criada pelo script administrativo.

## Origem dos componentes visuais

Crachá: componente Lanyard fornecido pelo proprietário, de React Bits, adaptado para a foto do criador e navegação ao perfil. Símbolos: Google Material Symbols Rounded, Apache-2.0, arquivos e licença em `public/badges`.
