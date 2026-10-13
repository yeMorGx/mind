# Mind

Marketplace gratuito de prompts visuais para criadores de conteúdo com IA. Cada publicação reúne o prompt, referências e imagens de resultado em uma página que o criador pode compartilhar com seus seguidores.

## O que já está implementado

- Galeria pública com busca e filtro por categoria; visitantes não precisam criar conta.
- Cadastro e login por e-mail e senha, Google e Discord via Supabase Auth.
- Onboarding de perfis individuais ou de equipe.
- Painel do criador com rascunhos, favoritos, edição, exclusão e publicação.
- Editor para o prompt, descrição, categoria, ferramenta usada, referência, carrossel de até 8 resultados e par opcional antes/depois.
- Página pública por prompt com metadados para compartilhamento, carrossel, comparador interativo e botão para copiar o texto.
- Imagens no Supabase Storage privado; links de leitura assinados e de duração limitada.
- Row Level Security no Postgres para separar perfis, rascunhos, publicações e arquivos.

## Rodar localmente

1. Instale as dependências com `npm install`.
2. Crie um projeto Supabase e siga [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
3. Inicie `npm run dev` e abra [http://localhost:3000](http://localhost:3000).

Rotas principais: `/` (galeria), `/register` (cadastro), `/home` (painel do criador), `/p/<slug>` (publicação compartilhável).

## Scripts

- `npm run dev` inicia o servidor local.
- `npm run build` gera a versão de produção.
- `npm run lint` executa ESLint.

## Limites desta versão

- Os prompts são gratuitos; não há pagamento nem geração de imagens integrada. O criador envia exemplos que já gerou em outra ferramenta.
- Os e-mails de equipe ficam salvos como convites pendentes; esta versão ainda não envia convites.
- Cada imagem pode ter até 20 MB e o carrossel aceita até 8 resultados.
- O plano grátis do Supabase tem limites de espaço e transferência; páginas públicas com muitas imagens podem consumir a cota de banda.
- O projeto Firebase configurado antes da migração não é alterado por este código. Usuários, prompts e senhas existentes não são transferidos automaticamente; mantenha o projeto Firebase até decidir o que fazer com os dados antigos.

## Licença de componentes

O comparador de imagens foi adaptado do componente Image Compare da Bencho, sob licença MIT. A licença e a atribuição estão em [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
