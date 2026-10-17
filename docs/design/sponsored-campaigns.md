# Destaques patrocinados e Campanhas

## Contrato

Extensão aprovada pelo proprietário: cards patrocinados nas grades de prompts, MCPs e Markdown, hero editorial opcional no topo de `/explore` e um painel privado `/home/campaigns` para afiliados e empresas. Herda o tema claro, Geist, superfícies neutras, botões escuros, cantos e header existentes. A landing não é alterada. Sem campanha real ativa, nenhum espaço publicitário vazio ou anúncio inventado aparece.

Hero: modo Persuade dentro do catálogo existente. Identificação explícita de Patrocinado/Link de afiliado, identidade do anunciante, título, descrição curta e CTA de um lado; imagem real/vídeo do outro. Uma campanha e um espaço por catálogo e carregamento, sem carrossel. A administração seleciona os espaços: cards de prompts, MCPs, Markdown e/ou hero. O padrão são as três grades, sem hero. Quando a mesma campanha é elegível para hero e grade de prompts, o servidor sorteia uma das duas posições com probabilidades iguais, sem duplicar no mesmo carregamento; não há sequência garantida entre visitas. A campanha também é sorteada entre as elegíveis retornadas (até 100), sem pesos ou promessa de entrega. Buscas e filtros preservam o foco no conteúdo pesquisado. No celular a composição empilha, com mídia horizontal. No hero, vídeo inicia por ação explícita, sem som. Nos cards, a prévia de vídeo acompanha o comportamento existente: hover/foco, sem som, com capa estática no toque e em movimento reduzido. Fallback de imagem/logo e destinos seguros preservam a navegação.

Admin: modo Operate. Lista de campanhas com estado, período e métricas, seguida de edição em duas colunas (campos e prévia) e revisão do destaque no tamanho público. Celular usa uma coluna. Rascunho, agendada, no ar, pausada, encerrada e arquivada são estados reais derivados de status e período. Cada ativação exige revisar link/conteúdo/período e confirmação explícita. Pausa/arquivo pedem confirmação e preservam métricas. Não há exclusão definitiva, cobrança de anunciante ou promessa de vendas.

Cards preservam a capa 4:3 com cantos de 18 px e o bloco cinza `#f0f0f3` com cantos de 16 px, separado por 4 px, dentro do mesmo componente. A identificação Patrocinado fica sobre a capa; anunciante e logo (ou inicial de fallback) ocupam o bloco inferior, sem emblemas ou curtidas fictícias. Afiliados recebem aviso de comissão. Anúncios não entram nas contagens de conteúdo, buscas, categorias ou Me surpreenda. Prazo final também oculta campanhas em páginas já abertas, com nova verificação ao voltar a uma aba suspensa. Pausa, arquivo e edições no servidor passam a valer nas próximas consultas; não há assinatura em tempo real para retirar uma campanha já carregada antes do prazo final.

## Segurança, verdade e ativação

CRUD e métricas privados passam por sessão verificada e emblema `owner` no servidor; URL e dados recebidos nunca autorizam acesso. Sessão de campanhas independe da ativação do Stripe e respeita MFA nativo. Banco expõe somente campos públicos dentro do período ativo. Eventos são enviados a serviço privado com deduplicação e limite transacional, sem IP bruto nem identificadores de conta. Contagens são estimativas, descritas no painel.

Não foram fornecidos link de afiliado, mídia oficial nem condições do MCPAI. Não se cria anúncio de uma parceria fictícia. A migração remota e as chaves de serviço dependem de acesso administrativo indisponível nesta sessão. O Explorar falha sem anúncio, mantendo o catálogo. Instruções de ativação: `docs/campaigns-setup.md`.

## Evidências

Revisão de acabamento em 17/10/2026: **SHIP no escopo de código e interface preparados**, sem questões materiais abertas nesse escopo. O revisor leu as 14 capturas abaixo, com campanhas explicitamente ilustrativas, sem gravações ou eventos reais. Elas demonstram a composição responsiva; não comprovam campanha ativa em produção, persistência administrativa ou métricas reais.

| Superfície | Desktop | Celular |
| --- | --- | --- |
| Grade de prompts | `.impeccable/review/campaigns-prompts-desktop.png` | `.impeccable/review/campaigns-prompts-mobile.png` |
| Grade de MCPs | `.impeccable/review/campaigns-mcps-desktop.png` | `.impeccable/review/campaigns-mcps-mobile.png` |
| Grade de Markdown | `.impeccable/review/campaigns-markdown-desktop.png` | `.impeccable/review/campaigns-markdown-mobile.png` |
| Hero opcional | `.impeccable/review/campaigns-hero-desktop.png` | `.impeccable/review/campaigns-hero-mobile.png` |
| Editor | `.impeccable/review/campaigns-editor-desktop.png` | `.impeccable/review/campaigns-editor-mobile.png` |
| Revisão e confirmação | `.impeccable/review/campaigns-review-desktop.png` | `.impeccable/review/campaigns-review-mobile.png` |
| Lista administrativa | `.impeccable/review/campaigns-list-desktop.png` | `.impeccable/review/campaigns-list-mobile.png` |

Contrato conferido no código de `components/campaigns`, `lib/campaigns`, `app/api/campaigns/[action]/route.ts`, nos catálogos e nas três rotas `/explore`, e na migração específica. A seleção e projeção pública dependem do filtro de status/período por RLS no banco; `CampaignVisibility` acrescenta a guarda de término no cliente. A rota temporária `/campaign-preview` foi removida antes do build final. Nenhum teste de implementação foi executado, conforme a restrição do proprietário. Compilação e análise estática não substituem validação autenticada de CRUD/MFA, métricas ou aplicação remota da migração.

Esta extensão preserva `DESIGN.md` e `.impeccable/design.json`. Há divergência anterior no sidecar: sua narrativa ainda descreve superfícies internas escuras e comunidade escura na landing, enquanto `DESIGN.md` registra o tema claro atual. Também há descrições históricas de header fixo e separação de 10 px no próprio `DESIGN.md`, seguidas das decisões mais recentes de header flutuante e separação de 4 px. Essas divergências foram registradas, sem reparo fora do escopo.
