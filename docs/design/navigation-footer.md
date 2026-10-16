# Navegação e rodapé internos

Referências consultadas em 16/10/2026:

- [Aceternity Floating Navbar](https://ui.aceternity.com/components/floating-navbar): agrupamento compacto e superfície da navegação. O Mind continua fixo, sem esconder o header durante a rolagem.
- [Navbar Gallery](https://www.navbar.gallery/): referências visuais de navegação horizontal, incluindo a barra compacta de Supaste. Mantida a busca centralizada e os destinos existentes.
- [Magic UI Dock](https://magicui.design/docs/components/dock): feedback de interação. Não foi adotada a ampliação dos itens para evitar deslocamentos de layout.
- [Footer Design](https://www.footer.design/): exemplos tipográficos com chamada, marca e navegação organizada. Aplicação em escala menor, no tema claro do Mind.
- [Mobbin](https://mobbin.com/): estrutura de navegação e rodapé acessível no HTML; os recursos visuais não carregaram nesta sessão. Não usado como evidência visual.

As buscas no Dribbble retornaram conteúdo vazio; Behance e a biblioteca de padrões do Mobbin responderam com bloqueio de acesso. Não foram tratadas como referências inspecionadas.

## Aplicação

Navbar em grupo arredondado com indicador da página ativa que desliza entre os destinos usando Framer Motion já instalado. Links, botões, foco e `aria-current` mantêm a semântica de navegação. O indicador só muda quando a página ou a visualização realmente muda. Movimento reduzido elimina a transição; no celular, a navegação inferior usa o mesmo indicador.

Rodapé claro com marca, convite para compartilhar um prompt e grupos Descobrir/Sua conta. Links apontam para funções existentes e respeitam o login. Sem redes sociais, páginas legais ou métricas inventadas. Voltar ao topo transfere o foco para o conteúdo. O rodapé aparece em Explorar, biblioteca, perfis e páginas de prompt, com espaço para a navegação inferior no celular. Não aparece em configurações, autenticação ou publicação.

Landing preservada: o layout retorna antes de renderizar header e rodapé internos. Os estilos novos ficam restritos a `.site-app`.

## Correções de movimento

A transição de pixels usa passos por segmento dos keyframes; aplicar um único passo ao tempo total saltava os quadros opacos e ocultava o efeito. O wipe permanece finito, pré-carrega a próxima imagem e respeita movimento reduzido.

Nas categorias, título e ação lateral ficam fora da faixa animada. A prévia central mantém o movimento horizontal, sem magnetismo ou esticamento vertical. O cleanup também zera o identificador do frame cancelado para permitir reinício da animação.
