# Conexões de login e MFA

## GitHub e Discord

1. Criar um OAuth App no GitHub e um aplicativo OAuth2 no Discord.
2. Em ambos, registrar o callback `https://rwltdjwjxrcmmxksxlxk.supabase.co/auth/v1/callback`.
3. No Supabase, Authentication → Sign In / Providers, habilitar cada provedor com seu Client ID e Client Secret. Manter segredos apenas no painel do Supabase.
4. Habilitar a vinculação manual de identidades (Allow manual linking) na configuração de Auth.
5. Manter Site URL `https://mind-lemon.vercel.app` e Redirect URL `https://mind-lemon.vercel.app/auth/callback`.
6. Entrar com a conta original e usar Configurações → Conexões → Conectar. Depois, conferir o login com o provedor vinculado. A aplicação não solicita acesso a repositórios ou servidores.

O botão GitHub no login aparece quando o provedor estiver habilitado. Discord mantém compatibilidade com contas anteriores. Não criar uma conta paralela para contornar conflito de identidade.

## Autenticador

Configurações → Segurança → Configurar MFA → escanear QR → confirmar código. Guardar a chave manual em local seguro. Ela não é persistida pela aplicação. Desativação exige código atual. Não há promessa de códigos de recuperação: essa função não foi implementada.

Após ativar, novos acessos exigem AAL2. A migração `20261015004640_native_account_mfa.sql` restringe leituras privadas, escritas e bootstrap; leitura pública de perfil e prompt continua disponível. A configuração não ativa fatores automaticamente no proprietário. Contas Firebase ainda não migradas precisam concluir a atualização de acesso antes de usar MFA nativo.
