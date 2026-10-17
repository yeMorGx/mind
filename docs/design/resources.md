# Arquivos Markdown e diretório de MCPs

## Brief e direção

Autorizado pelo proprietário em 17/10/2026: criar áreas de DESIGN.md, SKILL.md, CLAUDE.md e outros arquivos Markdown, e divulgar servidores MCP externos. Seguir o design atual. Coleções ficam para uma etapa futura.

Extensão do sistema existente, sem redesign: Geist, tokens claros, mesmo header expansível, margens de catálogo, capa 4:3 e bloco cinza de autoria separado por 4 px; nome/foto/emblemas reais via CreatorIdentity. Nenhuma alteração da landing. Catálogo em modo Experience; editor Operate; detalhe Read.

Primeiro viewport: abas de tipos, título/descrição, ação de criar e grade no padrão de Explorar. Sem dados fictícios publicados. Markdown sem capa mostra trecho real do arquivo, MCP sem capa mostra seu nome/desenvolvedor. A marca aparece nas mesmas proporções do header existente.

## Fluxos implementados

- `/explore/markdown`, `/explore/mcps`: catálogo público com categoria, compatibilidade e ordenação.
- `/resources/[id]`: página pública; Markdown com prévia segura/código, copiar, download; MCP com desenvolvedor distinto do divulgador, links HTTPS e configuração JSON copiável. Não executa comandos nem conecta servidores.
- `/home/resources`: próprios recursos e salvos; editar, tornar privado e excluir com confirmação.
- `/home/resources/new?kind=markdown|mcp` e `/home/resources/[id]/edit`: edição ampla em duas colunas, revisão e confirmação separadas. Upload `.md` UTF-8 até 100 KB (100.000 bytes), conteúdo até 100 mil caracteres; capa otimizada com o fluxo já existente. Importar um arquivo pede confirmação antes de substituir conteúdo existente.
- Perfil público: abas Prompts, Arquivos Markdown e MCPs.
- Busca: sugestões e resultados de recursos públicos, sem incluir rascunhos. Enviar consulta continua necessário para atualizar o catálogo.
- Likes/comentários reutilizam infraestrutura existente, com identificadores `resource_<uuid>` para não misturar com prompts. Favoritos são privados.

### Revisão e decisões de publicação

Salvar cria um rascunho privado; publicar passa por revisão e pelo botão “Confirmar publicação”. A revisão exibe título, resumo, categoria, autor, capa quando houver, descrição, arquivo/conteúdo ou configuração, instruções, ferramentas compatíveis, licença e créditos. Para MCPs, também mostra desenvolvedor, links oficiais, conexão, URL ou comando/argumentos, autenticação, permissões e custo. Não reduzir essa etapa a uma prévia do conteúdo principal: a pessoa deve conferir todos os campos públicos.

No editor de uma publicação existente, salvar como rascunho exige confirmação explícita de que a página sairá do ar; o conteúdo é preservado. A biblioteca também pede confirmação para tornar privado ou excluir. Alterações publicadas seguem a mesma revisão antes da confirmação. O detalhe público oferece copiar o link; o fim da publicação oferece abrir ou copiar o endereço.

### Comparação com o desenho existente

O código reutiliza `catalog-page`, `catalog-grid`, `wireframe-prompt-card`, `prompt-card-details`, `SearchSelect` e `CreatorIdentity`, sem criar outro sistema visual. As capturas do catálogo confirmam superfície clara, tipografia Geist, ações escuras, capa 4:3 com cantos arredondados e identificação em bloco cinza separado por 4 px, coerentes com Explorar. A ausência de capa usa conteúdo do arquivo ou identidade do servidor, sem fotografia inventada. Emblemas vêm do perfil administrativo, sem autoconcessão.

O detalhe prioriza leitura e ações de copiar/baixar ou visitar o servidor; no celular o painel de ações fica antes do conteúdo. O editor e a revisão preservam ações de rodapé visíveis, com conteúdo empilhado no celular. A revisão mantém a capa e os metadados completos ao lado do aviso de publicação no desktop. Os estilos ficam em `.site-app`; o header e a navegação móvel pertencem ao layout compartilhado. Nenhuma dessas superfícies altera a landing.

## Dados e permissões

`mind_resources` guarda documentos tipados e estado draft/published. RLS permite leitura pública apenas de publicados; escrita exige public_id da sessão, @ escolhido e MFA quando ativo. IDs, criador, tipo e data de criação são imutáveis. Atualizações verificam updated_at para evitar sobrescrever outra aba. Nenhum segredo de servidor no frontend.

Contas Firebase usam `resource-actions`, que valida assinatura/issuer/audience/expiração do JWT e obtém o public_id dele. Contas migradas são recusadas nessa ponte; usam RLS nativo. O JSON e os links são validados também por CHECK no banco. A prévia Markdown não executa HTML nem carrega imagens remotas automaticamente.

## Estado de ativação

A migração `20261017034641_resource_catalog.sql` foi aplicada como `resource_catalog` no Mind em 17/10/2026. A Edge Function `resource-actions` v1 foi publicada e confirmada ACTIVE, com validação interna dos tokens Firebase e `verify_jwt=false` no gateway. As duas conexões dos Apps não tinham acesso; a autenticação OAuth do MCP da CLI permitiu a implantação no projeto correto.

A conferência administrativa confirmou a função de busca e os metadados das tabelas/políticas. O advisor de segurança não apontou achados novos no catálogo; manteve os avisos de tabelas internas de migração sem políticas e de proteção de senhas vazadas desativada. Nenhuma configuração Auth foi alterada por esta entrega.
A migração anterior `20261015145914_prompt_resources.sql`, do commit pendente ffdb033, refere-se a anexos em prompts e é independente deste catálogo; não é pré-requisito e não deve ser publicada implicitamente.

A entrega parte de `origin/master`, excluindo o commit pendente `ffdb033`. O PR foi preparado como rascunho durante o bloqueio e segue para master/Vercel após a ativação da infraestrutura, conforme autorização contínua do proprietário.

## Evidência e limites

Há 18 capturas em `.impeccable/review`: `resources-{catalog-markdown,catalog-mcp,detail-markdown,detail-mcp,editor-markdown,editor-mcp,review-markdown,review-mcp}-{desktop,mobile}.png` e `resources-unavailable-{desktop,mobile}.png`. As prévias usam componentes reais com conteúdo sintético rotulado, sem criar contas ou fazer escritas. A comparação documental inspecionou catálogo Markdown desktop, detalhe MCP mobile e revisão MCP desktop, além dos componentes e estilos. O revisor aprovou a entrega no escopo das duas correções exigidas: confirmação antes de tornar uma publicação privada e revisão de todos os campos públicos. O estado indisponível informa que a área está sendo preparada e permite tentar novamente, sem simular um catálogo ativo.

As rotas de prévia e a exportação temporária do contexto foram removidas. Após todas as correções, o ESLint dos arquivos alterados terminou sem erros ou avisos, e o build de produção Next.js, incluindo TypeScript, passou. A infraestrutura foi implantada e conferida por metadados e leituras públicas; não há comprovação de login real, escrita de usuário, publicação autenticada, isolamento entre duas contas ou ponte Firebase com sessão real. A confirmação de retirada e a revisão completa foram verificadas no código e em prévias, sem acionar uma publicação real.


## Prévia de Markdown e identidade das ferramentas — 17/10/2026

Refinamento solicitado pelo proprietário, preservando capa e bloco separado do criador. Referências consultadas: [Terminal do Magic UI](https://magicui.design/docs/components/terminal) e seu código público em `apps/www/registry/magicui/terminal.tsx`; [Code Block da Aceternity](https://ui.aceternity.com/components/code-block). Implementação própria, sem copiar dependências: barra com nome do arquivo, indicação Markdown e linhas numeradas sobre a superfície clara existente. A prévia usa texto real escapado pelo React; não executa comandos ou Markdown.

O hover do componente completo e o foco por teclado iniciam a descida da prévia após 450 ms, a 30 px/s. A saída cancela e retorna ao início; documentos curtos ficam parados. A prévia é limitada a 80 linhas / 6.000 caracteres para manter o catálogo leve; o detalhe e o download continuam completos. Capas enviadas são preservadas no repouso e revelam o arquivo durante a interação. Movimento reduzido, aba oculta ou componente fora da tela suspendem o avanço; toque abre a publicação sem exigir hover.

Logos locais das ferramentas aparecem na compatibilidade do editor, revisão, detalhe, exemplos, catálogo, biblioteca e filtros. Claude Code usa sua própria marca, distinta de Claude. Marcas sem correspondência mantêm o nome e um ícone neutro. Não são declaradas compatibilidades novas: são exibidas apenas as selecionadas pelo autor. LobeHub Icons e Devicon fornecem os SVGs com atribuição e licenças em `public/ai-models`.
