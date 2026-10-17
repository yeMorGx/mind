# Exemplos de arquivos Markdown e MCPs

Conteúdo de demonstração para as novas áreas do Mind. Não inclui contas, tokens, métricas ou publicações simuladas.

## Arquivos

- `markdown/DESIGN.md`: direção visual para interfaces de produtos de IA.
- `markdown/SKILL.md`: skill de revisão de interfaces.
- `markdown/CLAUDE.md`: instruções de colaboração em um repositório.
- `mcps/github.mcp.json`: configuração de exemplo do GitHub MCP com escrita desabilitada.
- `mcps/supabase.mcp.json`: configuração do Supabase MCP em modo de leitura.
- `catalog.json`: cinco registros com títulos, resumos, categorias e instruções no formato dos documentos do Mind. Os IDs foram gerados uma única vez para identificar estes exemplos; não há autor atribuído nem estado de publicação neste arquivo.

## Publicar os cinco exemplos pela própria conta

Abra https://mind-lemon.vercel.app/home/resources/examples com a sua conta conectada. Confira os conteúdos e clique em **Publicar os 5 exemplos na minha conta**. A página usa a autenticação e as permissões normais do Mind; não exige acesso administrativo ao Supabase e não publica ao abrir o link.

Cada conta recebe identificadores próprios e estáveis para os exemplos. Repetir a importação preserva os itens existentes e permite retomar uma importação incompleta. Rascunhos existentes não são republicados automaticamente. A autoria é sempre a conta conectada.

## Adicionar pelo Mind

1. Abra Arquivos Markdown → Novo arquivo e importe um dos `.md`.
2. Use as informações correspondentes de `catalog.json` para preencher resumo, categoria, instruções, ferramentas e licença.
3. Para os MCPs, abra Divulgar MCP e use os dois registros de tipo `mcp` do mesmo catálogo.
4. Salve como rascunho ou revise e confirme a publicação.

Os JSON de MCP não são um formato de importação automática do Mind: são configurações para copiar no cliente de IA indicado pelas instruções. Adaptar os formatos e configurar autenticação cabe ao usuário. O Mind não executa esses arquivos.

## Fontes dos MCPs

Consultadas em 17/10/2026:

- https://github.com/github/github-mcp-server
- https://github.com/github/github-mcp-server/blob/main/docs/server-configuration.md
- https://github.com/github/github-mcp-server/blob/main/docs/installation-guides/install-claude.md
- https://supabase.com/docs/guides/getting-started/mcp
- https://github.com/supabase-community/supabase-mcp

GitHub MCP usa licença MIT; Supabase MCP usa Apache-2.0. Os nomes e marcas pertencem aos seus respectivos titulares. Os três Markdown e os textos descritivos originais deste pacote são disponibilizados sob MIT, conforme LICENSE. Não é uma publicação oficial do GitHub, Supabase ou Anthropic.
