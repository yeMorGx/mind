# Interface clara para produtos de IA

Este é um exemplo de direção visual. Adapte os valores à identidade do seu produto antes de usar.

## Objetivo

Ajude a pessoa a descobrir conteúdo, entender o que ele faz e escolher uma ação. A interface deve deixar o resultado em evidência e manter a navegação previsível.

## Cores

Use tokens semânticos para evitar cores diferentes em cada tela:

```css
:root {
  --background: #fafafa;
  --surface: #ffffff;
  --foreground: #17181a;
  --muted: #565660;
  --border: #dedee5;
  --primary: #17181a;
  --primary-foreground: #ffffff;
}
```

Reserve cores de destaque para estados e conteúdo. Não dependa apenas de cor para comunicar erro, seleção ou sucesso.

## Tipografia e hierarquia

- Use uma família sem serifa na interface.
- Títulos devem ser curtos e explicar o conteúdo da seção.
- Texto de leitura deve ter aproximadamente 65 a 75 caracteres por linha.
- Use fonte monoespaçada somente em código, comandos e configurações.
- Nome, foto e emblemas pertencem ao mesmo grupo de autoria; o @ aparece em uma segunda linha.

## Espaçamento e componentes

- Trabalhe com uma escala de 4, 8, 12, 16, 24, 32 e 48 pixels.
- Elementos do mesmo grupo ficam próximos; seções diferentes recebem mais espaço.
- Cards usam cantos de 16 pixels, imagem acima e informações abaixo.
- Cada área tem uma ação principal. Ações secundárias não devem competir com ela.
- Formulários têm labels visíveis e instruções específicas junto ao campo.

## Responsividade

No celular, empilhe conteúdo em uma coluna. Não reduza o texto inteiro para caber. Garanta que menus, filtros e ações possam ser usados por toque, sem depender de hover.

## Estados obrigatórios

Para cada componente, considere carregamento, vazio, erro, sucesso, foco e ação em andamento. Um erro deve explicar como continuar; uma ação em andamento deve impedir envios repetidos.

## Acessibilidade

- Mantenha contraste de pelo menos 4,5:1 no texto comum.
- Preserve foco visível e ordem de navegação coerente.
- Dê nome acessível aos botões que mostram apenas ícone.
- Respeite a preferência por movimento reduzido.
- Permita ler e operar a página sem animação.

## Como pedir uma implementação

“Leia DESIGN.md, identifique os componentes que já existem e implemente a tela seguindo esta direção. Explique quais decisões você reaproveitou e quais estados foram considerados.”
