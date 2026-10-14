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
- Navegação global: header fixo e sidebar compacta compartilhados entre as páginas internas; menu móvel acessível.
- Biblioteca: lista sem hero, busca e favoritos integrados à navegação compartilhada.
- Perfil público: capa, avatar sobreposto, identificação e grade visual dos prompts, conforme as referências enviadas pelo proprietário.
- Prompt: resultados e texto principal; informações complementares abaixo. Crachá 3D dentro do card “Conheça o criador”, com acesso ao perfil.

O dono edita o perfil na própria página pública, pelo botão “Editar perfil”; a antiga rota de configurações redireciona para ela. Backup e migração continuam na seção de edição. Publicações de contas Firebase usam cópias públicas no Supabase, com seleção individual e verificação da propriedade na origem.

## Tema e navegação

O proprietário escolheu somente o tema claro. Todas as páginas internas, incluindo login, cadastro, editores e estados de erro, compartilham cores semânticas e o layout de navegação raiz. Perfis e prompts públicos continuam acessíveis sem login; biblioteca e favoritos solicitam autenticação. A landing conserva sua apresentação e seu comportamento originais, sem header/sidebar globais. Não alterar essa página sem uma solicitação explícita.
