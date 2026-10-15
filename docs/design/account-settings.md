# Perfil e configurações — 15/10/2026

## Referências pesquisadas e inspecionadas

- [Edit Profile & User Settings](https://dribbble.com/shots/27254059-Edit-Profile-User-Settings-UI-Dashboard-Design): campos agrupados, identificação visual e ações de formulário.
- [SaaS Dashboard Account Settings](https://dribbble.com/shots/26522122-SaaS-Dashboard-UI-Account-Settings-Page): hierarquia entre imagem e informações pessoais, aplicada somente à edição de perfil.
- [Propwise Account Settings](https://dribbble.com/shots/22737318-Propwise-Account-Settings-Page-Property-Management-Web-App): grupos de configurações com contexto à esquerda e controles à direita.

## Aplicação

Editar perfil continua na página pública do próprio usuário, com duas colunas no desktop e sequência única no celular. Capa e avatar têm prévia e controles próprios; nome, @ exclusivo, headline e bio ficam juntos. Não há alteração de emblemas pelo formulário.

Configurações contém conexões para login, segurança, preferências e dados/sessão. Não contém troca de foto. Estados de conexão e MFA vêm do Auth; falha de consulta não aparece como proteção desativada. MFA exige confirmação TOTP antes de ativar e novo código antes de remover.

A restauração da sessão consulta a sessão Supabase existente e valida a correspondência do ID público no servidor. O marcador local não é mais a única condição para selecionar o backend nativo. Conta migrada não deve voltar à biblioteca Firebase editável.

## Limites e operação

GitHub e Discord estavam desativados no provedor em 15/10. Botões permanecem indisponíveis até a configuração OAuth; não simulam uma conexão. Consulte `docs/supabase-account-security.md`.

ChatGPT aceita `?q=` (observado com texto inofensivo); Claude utiliza `/new?q=`. Para URLs acima do limite prático ou Claude acima de 14 mil caracteres, copiar e abrir. Gemini não oferece preenchimento web confirmado: copiar e abrir é explícito. Nenhum prompt do usuário foi enviado a provedores na inspeção.

Build/TypeScript e inspeção visual em 1440, 1024, 390 e 320 px; confirmação final em 1440/390. Sem overflow horizontal, três logos ChatGPT carregados e cópia funcional. Prévia local de MFA usou dados explícitos de demonstração, sem criar fatores na conta real. Fluxo OAuth e alteração real de perfil exigem a sessão do usuário e não foram exercitados pela inspeção pública. A landing foi preservada.
