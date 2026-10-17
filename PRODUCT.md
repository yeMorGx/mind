# Mind

Mind é um lugar gratuito para criadores e influenciadores de IA publicarem prompts e resultados e compartilharem links com seus seguidores.

- Biblioteca privada: contas existentes ainda não migradas usam Firebase Auth e Firestore; contas com backup autorizado podem concluir a migração para sessão e dados Supabase pelo Google. Preservar contas, dados e IDs existentes.
- Perfil sempre público: nome, apresentação, bio, avatar e capa. E-mail e dados da equipe continuam privados.
- Cada prompt começa privado e é publicado separadamente. O perfil público mostra somente os prompts escolhidos.
- Visitantes podem abrir perfis e prompts públicos sem conta.
- Sem venda, pagamento ou números fictícios de seguidores/curtidas.
- Emblemas: fundador, verificado, moderador, criador de conteúdo e parceiro patrocinado. Atribuição administrativa; usuários não se verificam.
- Emblema especial de fundador solicitado para a conta do proprietário; depende de credenciais administrativas para atribuir.
- O proprietário autoriza commit, push para master e publicação na Vercel após as verificações relevantes.
- A configuração administrativa do Firebase não está disponível neste ambiente. Código publicado na Vercel não substitui a ativação das regras do Firestore.

## Superfícies

- Landing: céu claro e galeria circular sem títulos; preservar a direção aceita pelo proprietário.
- Navegação global: header fixo compartilhado entre as páginas internas, sem sidebar; navegação horizontal no desktop e barra inferior no celular.
- Biblioteca: lista sem hero, busca e favoritos integrados à navegação compartilhada.
- Perfil público: capa, avatar sobreposto, identificação e grade visual dos prompts, conforme as referências enviadas pelo proprietário.
- Prompt: resultados e texto principal; informações complementares abaixo. Crachá 3D dentro do card “Conheça o criador”, com acesso ao perfil.

O dono edita o perfil na própria página pública, pelo botão “Editar perfil”; `/home/profile` redireciona para ela. Backup e atualização de acesso ficam em `/home/settings`. Publicações de contas Firebase usam cópias públicas no Supabase, com seleção individual e verificação da propriedade na origem.

## Tema e navegação

O proprietário escolheu somente o tema claro. Todas as páginas internas, incluindo login, cadastro, editores e estados de erro, compartilham cores semânticas e o layout de navegação raiz. Perfis e prompts públicos continuam acessíveis sem login; biblioteca e favoritos solicitam autenticação. A landing conserva sua apresentação e seu comportamento originais, sem header/sidebar globais. Não alterar essa página sem uma solicitação explícita.

A referência de catálogo orienta apenas as páginas internas: header com busca e criação de rascunhos, navegação horizontal e cards com capa. `/explore` lista e filtra os prompts públicos reais sem depender da landing. As ações da biblioteca e a escolha individual de publicação continuam preservadas.

## Identificação de criadores

Cada pessoa escolhe um @ obrigatório e exclusivo, de 3 a 24 caracteres (letras minúsculas, números e _, começando por letra). Contas sem @ devem escolhê-lo na área interna antes de continuar; nunca gerar identificadores automaticamente. A exclusividade é garantida no banco, compartilhada por contas Firebase e Supabase. O perfil permite alterar o @. Explorar oferece busca de pessoas por nome ou @; links /u/@nome resolvem o perfil, preservando os antigos links por UID. A landing permanece protegida.

A busca do header sugere prompts públicos e criadores enquanto a pessoa digita; @ restringe as sugestões a pessoas. Enter abre uma busca compartilhável em `/explore?q=...`, com ordenação por relevância. A pesquisa de prompts reconhece acentos, flexões e prefixos, com índices de texto no Supabase. Prompts privados não participam das sugestões públicas.

## Exploração e interação social

Os cards de Explorar seguem a estrutura do wireframe Figma `qCkRPKTQMKNyqzBN7EztnX`, nó `192:149`: imagem acima e bloco separado com foto/nome do criador e título abaixo. Não mostrar o texto completo nem copiar diretamente do card; a pessoa abre o prompt para ler e copiar. Curtidas são únicas por conta e prompt público; seguir e deixar de seguir ficam no perfil, com contagens reais. As relações usam os IDs públicos preservados na migração Firebase/Supabase. Visitantes precisam entrar para interagir.

O header mostra somente a logo, busca centralizada e avatar do perfil com fallback para a foto do Google. Digitar muda as sugestões; resultados em Explorar só mudam ao enviar a busca. Remover os chips Pessoas/Prompts/Tudo/Com imagens/Texto. Há três filtros: ordenação, categoria e modelo. Perfis e Explorar usam margens menores; o perfil não tem botão de compartilhar. A biblioteca conserva seu conteúdo e suas ações.

## Edição, publicação e configurações

Os editores de criar e editar prompt usam a tela inteira: texto e imagens lado a lado no computador, seções alternáveis no celular e ações sempre visíveis. A biblioteca mantém as ações animadas; os botões separados de copiar prompt e abrir link público foram removidos por solicitação do proprietário.

Cada prompt tem um fluxo em `/home/prompts/[promptId]/publish`: revisar texto, autor e todas as imagens; confirmar a publicação; copiar o link ao concluir. Retirar uma publicação exige confirmação e preserva o rascunho. O conteúdo é relido antes da confirmação para detectar alterações desde a revisão.

`/home/settings` reúne contas vinculadas para login, MFA com aplicativo autenticador, categoria e ferramenta padrão para novos prompts, favoritos primeiro, exportação dos próprios dados e saída deste navegador. Preferências persistem no onboarding privado da conta; a edição de nome, foto, capa e @ continua no perfil público.

Em 14/10/2026, o proprietário autorizou diretamente dois ajustes na landing: remover o botão de pausa da galeria circular e melhorar a seção de prompts da comunidade. A comunidade usa fundo claro, capas dos resultados, título, autor e busca; o céu, a abertura e os fluxos de login permanecem preservados.


O prompt público oferece copiar e usar com ChatGPT/Claude por link com texto, com alternativa de copiar/abrir para textos muito longos. Gemini copia e abre para colar. Imagens precisam ser anexadas pelo usuário. Logos de modelo aparecem sobre a capa em Explorar.

MFA é ativado pelo próprio usuário com QR Code e confirmação TOTP; contas com fator verificado precisam de AAL2 para dados privados e alterações no banco. Vincular GitHub/Discord usa Supabase Auth e depende dos provedores OAuth e da vinculação manual habilitados na administração.


O editor permite anexar imagens de referência opcionais em uma área própria, separada de resultados e comparação. As referências são numeradas na ordem de inclusão, preservadas no prompt e na publicação, e podem ser baixadas individualmente na página do prompt. O download utiliza a imagem salva e a extensão real do arquivo. Continua permitido salvar e publicar sem referências; o limite existente de oito imagens é compartilhado por todas as funções.


## Comentários e formatos

Prompts publicados têm comentários com paginação. Envio requer conta e @; exclusão cabe ao autor ou ao criador do prompt. O banco limita dez envios por minuto por pessoa, preserva os IDs públicos entre os backends e aplica MFA às escritas nativas. Comentários deixam de ser legíveis enquanto o prompt não estiver público.

Imagem/texto, Site e Vídeo são tipos do editor. Sites oferecem capturas e link opcional. Vídeos podem ser enviados em MP4/WebM (30 MB) ou informados por link HTTPS direto. Uploads usam o bucket privado `mind-prompt-videos`: o dono acessa enquanto rascunho, visitantes só quando o caminho está associado a uma publicação. URLs de reprodução assinadas duram cinco minutos e são renovadas; retirar a publicação impede novas assinaturas públicas. Links externos seguem a disponibilidade e as permissões do provedor.

Cards alternam imagens ou reproduzem vídeo sem som durante o hover. A página do prompt volta ao carrossel automático, pausável por hover/foco/interação e respeitando movimento reduzido. O botão Ver prompt foi removido do topo. Descrição breve, emblemas na linha do nome e fundo de metadados mais visível se aplicam às páginas internas. A landing permanece protegida.

Ao fim de Explorar, “Explore por categoria” oferece até seis categorias dos prompts públicos carregados, ordenadas pela quantidade de prompts e, em caso de empate, pelo nome. Cada categoria abre `/explore?category=...`, aplica o filtro e limpa o modelo selecionado. A seção não aparece durante buscas, em falhas de carregamento ou quando o catálogo está vazio.


Explorar organiza os cards em masonry com proporções de imagem naturais limitadas, preservando informações e ações. Categoria e modelo têm busca e navegação por teclado; no celular, a gaveta de filtros só altera o catálogo ao aplicar, e fechar cancela o rascunho. “Me surpreenda” escolhe um prompt entre os resultados visíveis. A prévia do criador usa perfil público real e os controles existentes de seguir, com link direto ao perfil. Skeletons indicam carregamento; movimento reduzido preserva capas estáticas. Na página do prompt, sombras na área do texto indicam conteúdo fora da região visível somente quando há overflow. A landing permanece intacta.

O redesign solicitado do modal de login se aplica às páginas internas e à sua abertura sobre a landing, preservando os métodos de autenticação existentes e a apresentação da landing fora do diálogo.

O cadastro reúne quatro etapas: conta, perfil com nome/@ exclusivo e atividade, biblioteca individual ou equipe, e conclusão. O @ é validado no fluxo existente de perfis e exigido antes de criar a biblioteca; a conclusão consulta o @ e exige cadastro completo. Ícone, origem e e-mails da equipe são opcionais, e nenhum convite é enviado. Dados anteriores e autenticação são preservados; as antigas etapas 3, 5, 6 e 7 redirecionam para a configuração da biblioteca.

Header interno flutuante que se compacta ao rolar, com dropdowns de descoberta e biblioteca e busca centralizada. Rodapé tipográfico nas páginas de descoberta, biblioteca, perfis e prompts reúne marca, navegação e acesso à conta/criação, respeitando a autenticação. Categorias usam a faixa completa do componente original no hover. A landing não recebe esses componentes.

## Arquivos Markdown e diretório de MCPs

Extensão autorizada em 17/10/2026, seguindo o desenho interno atual: `/explore/markdown` reúne arquivos independentes como DESIGN.md, SKILL.md e CLAUDE.md; `/explore/mcps` divulga servidores MCP existentes. `/resources/[id]` apresenta o recurso e `/home/resources` reúne os próprios registros e favoritos. O editor cria rascunhos privados, revisa todos os campos públicos e exige confirmação para publicar; salvar uma publicação como rascunho confirma sua retirada. Markdown aceita importar `.md` UTF-8 de até 100 KB, prévia/código, copiar e baixar. MCPs distinguem desenvolvedor e divulgador, oferecem links oficiais e configuração copiável, sem instalar, executar ou conectar servidores. Busca compartilhada, abas no perfil, emblemas administrativos, likes e comentários integram as novas áreas. Coleções ficam para outra etapa; a landing permanece protegida.

A infraestrutura do catálogo foi ativada em 17/10/2026 no Mind (`rwltdjwjxrcmmxksxlxk`) pela conexão MCP autenticada da CLI: migração `resource_catalog` e Edge Function `resource-actions` v1 ativa. A conexão dos Apps permanece separada; a autenticação da CLI resolveu o bloqueio de implantação. As prévias locais são sintéticas; login e gravações reais de usuários não foram testados. A alteração independente de anexos de prompts no commit pendente `ffdb033` continua fora desta publicação. Escopo, evidências e ativação: `docs/design/resources.md` e `docs/resource-catalog-setup.md`.

## Planos, assinaturas e contatos

Extensão autorizada em 17/10/2026: `/plans` compara Free (2 novos prompts/dia UTC e 5 publicações), Plus (R$ 19,90/mês ou R$ 191,04/ano; 100 novos prompts/mês e 50 publicações), Premium (R$ 39,90/mês ou R$ 383,04/ano; desbloqueios e publicações ilimitados) e Enterprise sob proposta em `/business?subject=enterprise`. `/home/billing` reúne assinatura, saldo e gerenciamento pelo Stripe. Desbloqueios já realizados não gastam novamente; prompts livres pelo criador e conteúdo próprio não consomem créditos. Publicações existentes acima do limite são preservadas. O anual renova créditos mensalmente; saldo não acumula. Esta extensão autoriza assinaturas da plataforma; não introduz venda individual de prompts.

O rodapé interno oferece Planos, Minha assinatura, Trabalhe conosco (`/work-with-us`) e Para empresas (`/business`). Candidaturas e propostas de publicidade, patrocínio, parceria ou Enterprise usam consentimento e persistência privada; `/home/inbox` exige conta com emblema administrativo `owner`. Não há envio de e-mail ou prazo de resposta prometido. As páginas herdam o tema claro e a navegação interna; a apresentação da landing é preservada.

Cobrança, limites e envio de formulários começam desligados. A migração SQL, o script Stripe e o guia existem, mas a migração remota não foi aplicada porque a conexão administrativa Supabase recusou o projeto. O proprietário confirmou conta Stripe existente e que configurará as chaves na Vercel; a conclusão não foi confirmada. ESLint e build de produção passaram; capturas locais mostram estados reais de visitante. Pagamentos, submissões, sessões autenticadas e testes de implementação não foram verificados. Escopo e evidências: `docs/design/billing-and-contact.md`; ativação administrativa: `docs/billing-setup.md`.
