# Navegação e rodapé internos

Referências consultadas em 16/10/2026:

- [Aceternity Resizable Navbar](https://ui.aceternity.com/components/resizable-navbar): header flutuante que reduz largura e altura ao rolar, sem desaparecer.
- [Aceternity Navbar Menu](https://ui.aceternity.com/components/navbar-menu): menus abertos por hover/clique, com atalhos, descrições e área de destaque.
- [Navbar Gallery](https://www.navbar.gallery/): referências visuais de navegação horizontal, incluindo a barra compacta de Supaste. Mantida a busca centralizada e os destinos existentes.
- [Magic UI Dock](https://magicui.design/docs/components/dock): feedback de interação. Não foi adotada a ampliação dos itens para evitar deslocamentos de layout.
- [Aperios Design no Footer Design](https://www.footer.design/sites/aperios-design): marca em escala grande e composição tipográfica. Adaptação ao tema claro, à identidade e aos destinos reais do Mind.
- [Mobbin](https://mobbin.com/): estrutura de navegação e rodapé acessível no HTML; os recursos visuais não carregaram nesta sessão. Não usado como evidência visual.

As buscas no Dribbble retornaram conteúdo vazio; Behance e a biblioteca de padrões do Mobbin responderam com bloqueio de acesso. Não foram tratadas como referências inspecionadas.

## Aplicação

Header flutuante com margem externa, superfície branca e sombra suave. A partir de 100 px de rolagem, reduz a largura máxima de 1520 para 1200 px e a altura de 80 para 64 px no desktop; volta à versão ampla abaixo de 40 px, evitando oscilações no limite. A busca continua centralizada e acessível nos dois estados. No celular, conserva a busca e reduz levemente as dimensões, com navegação inferior independente.

Dropdowns de Explorar e Biblioteca usam NavigationMenu do Radix já instalado: hover com intenção, clique, setas, Escape e foco. Explorar apresenta comunidade, Imagem e Retrato; Biblioteca oferece Meus prompts, Favoritos e Novo prompt com a autenticação existente. O menu móvel mantém o indicador de página ativa. Movimento reduzido remove transições e entradas.

Rodapé em painel claro com chamada tipográfica, ação circular para compartilhar, marca Mind em escala grande, símbolo e grupos Descobrir/Sua conta. Links apontam para funções existentes e respeitam o login. Sem redes sociais, páginas legais ou métricas inventadas. Voltar ao topo transfere o foco para o conteúdo. O rodapé aparece em Explorar, biblioteca, perfis e páginas de prompt, com espaço para a navegação inferior no celular. Não aparece em configurações, autenticação ou publicação.

Landing preservada: o layout retorna antes de renderizar header e rodapé internos. Os estilos novos ficam restritos a `.site-app`.

## Correções de movimento

A transição de pixels usa passos por segmento dos keyframes; aplicar um único passo ao tempo total saltava os quadros opacos e ocultava o efeito. O wipe permanece finito, pré-carrega a próxima imagem e respeita movimento reduzido.

Nas categorias, o proprietário pediu o comportamento completo do componente enviado: a faixa animada cobre a linha inteira durante hover, incluindo título e ação lateral, sem áreas reservadas ou recortes centrais. O movimento horizontal, esticamento e magnetismo foram restaurados. O cleanup zera o identificador do frame cancelado para permitir reinício da animação. A base não é escondida antes da chegada da faixa, evitando o desaparecimento antecipado do texto.
