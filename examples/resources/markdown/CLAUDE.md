# Orientações para colaborar neste projeto

Este é um exemplo de CLAUDE.md para um projeto web. Ajuste estas instruções à estrutura e às decisões reais do seu repositório.

## Comece pelo contexto

Leia o README, o package.json e as instruções aplicáveis à pasta que será alterada. Se houver um DESIGN.md, use-o como referência visual. Confira o estado do Git antes de editar e preserve alterações que já estavam presentes.

## Entenda a tarefa

Identifique o resultado esperado e os arquivos envolvidos. Faça escolhas rotineiras com base nas convenções do projeto. Pergunte quando faltar uma decisão que afete o comportamento, os dados ou o escopo.

## Implementação

- Reutilize componentes e funções existentes antes de criar novas abstrações.
- Preserve rotas, contratos de API e formatos de dados que já estejam em uso.
- Separe conteúdo de apresentação quando isso facilitar a manutenção.
- Trate carregamento, vazio, erro e sucesso nos fluxos assíncronos.
- Use labels e nomes acessíveis nos controles.
- Garanta que funções importantes também possam ser usadas no celular.

## Dados e autenticação

Não coloque credenciais no código nem em exemplos públicos. Valide entradas no servidor e respeite a autorização de cada usuário. Não use uma chave administrativa no frontend. Migrações devem preservar dados existentes e ter um objetivo definido.

## Dependências

Antes de instalar uma biblioteca, confira se o projeto já resolve a necessidade. Explique por que a nova dependência é necessária e mantenha o arquivo de lock atualizado.

## Conferência

Consulte os scripts disponíveis no package.json. Não invente comandos de build, lint ou teste. Execute testes somente quando a pessoa tiver pedido ou autorizado. Informe quais verificações realmente foram executadas e seus limites.

## Entrega

Descreva o que mudou, onde mudou e como foi conferido. Avise quando uma alteração depender de configuração externa. Não afirme que um fluxo está funcionando de ponta a ponta se apenas a compilação ou uma leitura pública foi conferida.

Publicações, merges e mudanças em serviços externos seguem a autorização dada pela pessoa responsável pelo projeto.

## Exemplo de pedido

“Adicione a tela de configurações reutilizando o design e a autenticação existentes. Antes de editar, leia as instruções do repositório. Ao terminar, resuma os arquivos alterados e as verificações realizadas.”
