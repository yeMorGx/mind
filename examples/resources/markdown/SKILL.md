---
name: revisar-interface
description: Revise a clareza, a acessibilidade e o comportamento responsivo de uma interface existente, preservando sua identidade visual.
---

# Revisar uma interface antes de publicar

Exemplo de skill para projetos web. Adapte o fluxo ao seu ambiente e às ferramentas disponíveis.

## Quando usar

Use quando a pessoa pedir uma revisão de uma tela, de um formulário ou de um fluxo já implementado. O objetivo é encontrar problemas concretos e propor mudanças pequenas e justificadas.

## Contexto necessário

Antes da revisão, identifique:

1. Qual tarefa a pessoa quer concluir.
2. Quem usa a tela e em quais dispositivos.
3. Qual arquivo ou rota representa a implementação atual.
4. Quais decisões visuais precisam ser preservadas.

Se essas informações estiverem no projeto, leia-as antes de perguntar.

## Procedimento

### 1. Observe a tela real

Quando houver acesso à aplicação, observe uma largura de computador e uma de celular. Aguarde o conteúdo carregar. Se não houver acesso, diferencie observações de código de observações visuais.

### 2. Confira a hierarquia

Localize título, conteúdo principal e ação principal. Verifique se a pessoa consegue entender a tarefa sem ler toda a tela e se informações relacionadas aparecem juntas.

### 3. Confira interação e acessibilidade

- Campos têm labels visíveis?
- Controles recebem foco por teclado?
- Um botão com apenas ícone tem nome acessível?
- Erros apontam o campo e uma forma de recuperação?
- Existe feedback durante o envio?
- A função continua disponível sem hover?
- Conteúdo importante é cortado no celular?

### 4. Organize os achados

Para cada problema, registre o local, o comportamento observado, o impacto e uma correção proposta. Diferencie falhas que impedem uma tarefa de preferências estéticas.

### 5. Corrija dentro do escopo

Quando a implementação estiver autorizada, preserve componentes, dados e convenções existentes. Não transforme uma revisão pontual em um redesign geral. Execute testes somente quando isso tiver sido solicitado ou autorizado.

## Formato de entrega

```markdown
## Resumo

Tarefa revisada e evidência disponível.

## Problemas

- Local: componente ou trecho da tela.
- Observado: o que aconteceu.
- Impacto: por que isso atrapalha a tarefa.
- Correção: mudança concreta sugerida ou aplicada.

## Limites

O que não foi possível conferir e qual evidência ainda falta.
```

Não invente capturas, métricas, resultados de testes ou validações que não foram realizadas.
