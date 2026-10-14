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
- Biblioteca: barra lateral compacta com ícones, header fixo, lista sem hero.
- Perfil público: capa, avatar sobreposto, identificação e grade visual dos prompts, conforme as referências enviadas pelo proprietário.
- Prompt: resultados e texto principal; informações complementares abaixo. Crachá 3D dentro do card “Conheça o criador”, com acesso ao perfil.
