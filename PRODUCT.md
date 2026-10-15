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
