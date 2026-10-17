# Ativar campanhas no Mind

A interface e as rotas de campanhas são independentes da ativação do Stripe. Nenhuma campanha é criada nem divulgada automaticamente.

1. No projeto Supabase `rwltdjwjxrcmmxksxlxk`, aplicar `supabase/migrations/20261017232712_sponsored_campaigns.sql`. A migração depende apenas das contas e MFA existentes, não da migração de cobrança. Ela cria tabelas, políticas e funções sem alterar publicações, assinaturas ou perfis.
2. Na Vercel, manter `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` existentes. Configurar **somente no servidor** `SUPABASE_SERVICE_ROLE_KEY` (sem `NEXT_PUBLIC_`) e fazer novo deploy. Nunca enviar a chave por chat, nem salvá-la no repositório.
3. Entrar na conta administrativa com emblema `owner` atribuído pelo servidor. O menu da foto oferece **Campanhas** (`/home/campaigns`). A sessão nativa exige MFA quando configurado; contas Firebase não migradas continuam aceitas com JWT verificado pelo servidor.
4. Criar uma campanha em rascunho. Informar nome interno, anunciante, título, descrição, imagem HTTPS horizontal, descrição da imagem, destino HTTPS ou página pública do Mind, botão e início. O fim é opcional; se preenchido, precisa ser posterior ao início e ainda futuro na ativação. Datas são editadas no fuso indicado no formulário e persistidas como instantes UTC. Logo e vídeo MP4/WebM por URL são opcionais. Não há upload de mídia nesta versão.
5. Selecionar onde aparece: cards em Prompts, MCPs e Markdown (padrão), hero do Explorar (opcional), ou combinação. Cada catálogo recebe no máximo uma campanha em um espaço por carregamento. Se marcar hero e cards de prompts, a posição é sorteada com probabilidades iguais; visitas consecutivas podem repetir a posição. Não há duplicação no mesmo carregamento nem garantia de quantidade de exibições.
6. Para o MCPAI, usar o **link de afiliado real** obtido na plataforma, com parâmetros preservados. O código não inventa domínio, vínculo de afiliado, logo, campanha paga ou resultados.
7. Clicar **Revisar divulgação**, conferir a prévia e marcar a confirmação; depois confirmar ativação/agendamento. A revisão pode mostrar card e hero para conferir todos os espaços escolhidos; a página pública exibe somente um. Pausar ou arquivar retira o destaque das próximas consultas; encerrar o período retira automaticamente sem cron, inclusive por temporizador em páginas já abertas e verificação ao retornar à aba. Não há atualização em tempo real para pausa/arquivo em páginas já carregadas. Para reativar, revisar novamente. Salvar alterações de uma campanha ativa sem confirmar nova ativação usa **Salvar e pausar**, com confirmação.

## Proteções e métricas

- Criar/editar/pausar/arquivar/listar/métricas exigem sessão verificada e emblema administrativo no banco. Esconder o link no header não é a autorização.
- Só a projeção pública de campanhas ativas e dentro do período recebe SELECT para anon/authenticated. Rascunhos, nomes internos, IDs de conta e eventos permanecem privados. Não são concedidas escritas ao navegador.
- Eventos são enviados pelo servidor à função de serviço. Meio destaque visível por um segundo registra exposição; clicar também comprova exposição. Não há bloqueio de navegação pelo envio de métricas.
- Contagem deduplicada por sessão do navegador, campanha, tipo e dia UTC; não representa usuários únicos, pagamentos, vendas ou métricas auditadas. Bloqueadores, falhas de conexão e proteção contra abuso podem reduzir contagens.
- Sem IP bruto/UID/e-mail/referrer no banco. Hashes HMAC de sessão e endereço rodam diariamente com segredo exclusivamente de servidor. Eventos têm proteção transacional contra concorrência e limite por hash de endereço/dia.
- Atualizações com `updated_at` impedem sobrescrever alterações feitas em outra janela. Arquivar conserva conteúdo e métricas.
- Sem campanha elegível, ou se o banco não estiver pronto, os catálogos mantêm o conteúdo. Não há anúncio fictício nem quebra do catálogo. Buscas, filtros, falhas e grades vazias não recebem cards patrocinados; o hero também fica fora das buscas e filtros.

## Estado da implantação

Código e SQL preparados; as duas conexões MCP recusaram acesso ao projeto e a CLI estava sem login nesta sessão. Não foi aplicada migração remota nem criada campanha real. A configuração das chaves de servidor não foi confirmada. Ativação operacional depende dos passos acima. Não repetir autorização OAuth como parte da navegação do produto.

A revisão de acabamento recebeu **SHIP apenas para o código e a interface preparados**. As 14 capturas de desktop/celular e seus limites estão em `docs/design/sponsored-campaigns.md`; usam dados ilustrativos. A rota temporária `/campaign-preview` foi removida antes do build final. Não houve teste de implementação, CRUD administrativo autenticado, MFA de campanhas ou registro/leitura real de métricas. Esses fluxos continuam sem validação operacional até a infraestrutura e as credenciais estarem disponíveis. O link de afiliado e a mídia oficial do MCPAI ainda precisam ser fornecidos pelo proprietário antes de preparar uma campanha real.
