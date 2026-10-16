# Modal de login

Superfície: modal compartilhado de acesso ao Mind, incluindo sua abertura sobre a landing. Modo: Operate. O pedido de redesign abrange o diálogo; o céu, a galeria e a apresentação da landing fora dele são preservados.

## Referências observadas

- [Vercel Login](https://vercel.com/login): coluna central compacta, hierarquia simples, campos e botões sociais neutros. Captura: `.impeccable/review/ref-vercel-login.png`.
- [shadcn/ui Login Blocks](https://ui.shadcn.com/blocks/login): formulário claro com rótulos explícitos e bordas discretas, na parte visível da prévia. Captura: `.impeccable/review/ref-shadcn-login.png`.

A visita ao login do Linear exibiu somente o carregamento com logo; essa captura não sustenta decisões visuais.

## Contrato da interface

- Uma coluna branca de até 432 px, cantos de 20 px, sombra discreta e overlay neutro. Logo, título “Entre no Mind” e descrição centralizados; sem arte lateral ou glow.
- Google em largura total; Discord e GitHub na linha seguinte, com GitHub condicionado ao provedor habilitado. Os botões chamam os handlers existentes; Discord conserva a seleção entre o provedor nativo habilitado e seu fluxo anterior.
- E-mail e senha têm rótulos associados, autocomplete e estados desabilitados durante envio. Mostrar/ocultar senha tem nome acessível e estado pressionado. Recuperação usa o e-mail informado e o handler existente.
- Ação Entrar escura, com estado de espera; erros usam texto vermelho escuro em fundo claro e `alert`, avisos usam verde escuro e `status`. Criar conta fecha o diálogo antes de navegar para `/register`.
- Radix Dialog administra foco contido, bloqueio da rolagem, Escape e clique externo. O X tem alvo de 44 px; fechar devolve o foco ao elemento de origem quando ele continua na página.
- Até 480 px, margens externas de 12 px, cantos de 18 px e campos de 16 px. Altura limitada à viewport com rolagem interna. A preferência por movimento reduzido remove animações e transições.

## Evidências e limites

Código consultado: `components/modal/modalLogin.tsx` e `components/modal/login-modal.css`. Capturas locais revisadas: `.impeccable/review/login-desktop.png`, `login-mobile.png` e `login-landing.png`; nelas, o GitHub não estava habilitado. As capturas mostram o formulário vazio no desktop, no celular e sobre a landing.

A revisão documenta a interface e a preservação dos handlers de autenticação. Nenhuma autenticação real, recuperação de senha ou criação de conta foi exercitada; as capturas não validam esses serviços.
