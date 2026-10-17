# MFA, checkboxes e ticket de assinatura

Solicitação do proprietário: QRCode e AnimatedCheckbox do Spell UI, CodeSlots e TearTicket do React Bits. Integração conserva o tema claro e não altera a landing.

## Fontes e adaptações

- Spell UI: https://github.com/xxtomm/spell-ui/blob/main/registry/spell-ui/qr-code.tsx e `animated-checkbox.tsx`. Licença em `docs/licenses/spell-ui.txt`.
- React Bits: anexos fornecidos pelo proprietário (variantes JS/CSS), também disponíveis em https://github.com/DavidHDev/react-bits/tree/main/src/content/Micro. Licença em `docs/licenses/react-bits.md`.
- QRCode mantém os pontos e os localizadores arredondados, acrescenta margem de quatro módulos e rótulo acessível que não inclui o segredo. Usa `qrcode` localmente para a URI TOTP real retornada por Supabase `enroll`; não chama serviços externos nem persiste o segredo. Configuração manual permanece disponível. MFA APIs conferidas em https://supabase.com/docs/reference/javascript/auth-mfa-enroll e tipos da versão instalada.
- CodeSlots conserva as animações de preenchimento/rejeição. Reutiliza Framer Motion e Lucide instalados em vez de acrescentar bibliotecas equivalentes. Campo nativo com valor real, required, padrão de seis dígitos, autocomplete de OTP, teclado, colagem, erros e estado desabilitado. Login, ativação e desativação compartilham o componente.
- AnimatedCheckbox conserva o traçado animado, com input nativo para teclado, foco, consentimento obrigatório e FormData. Seleções de configuração não recebem texto riscado de tarefa concluída. Substitui todos os inputs checkbox encontrados: preferências, ferramentas compatíveis, emblemas administrativos, acesso de prompts e consentimento nos contatos.
- TearTicket conserva papel, perfurações e física do gesto. Teclado (Enter/espaço), toque, preferência de movimento reduzido e opção de continuar sem animação. O ticket aparece sozinho no centro da tela, sem card, título ou textos externos antes do gesto, conforme correção do proprietário. Segue a referência visual de ticket fotográfico: arte existente `/modal.png` otimizada pelo Next, logo real do Mind sobre a imagem, plano na ponta destacável, primeiro nome da conta no rodapé e inclinação com movimento sutil ao mouse. O papel escuro é específico deste objeto, preservando o tema claro do site. O diálogo transparente contém foco e fecha por Escape/X; pular animação fica acessível por teclado. Ao rasgar, anuncia “Plano ativado!” e move foco para continuar.

## Confirmação e persistência

Ticket somente no retorno do checkout, após status autenticado habilitado com plano pago, active/trialing, período vigente e identificador de assinatura confirmado pelo servidor. O endpoint busca o identificador exclusivamente para a conta autenticada. Chave de celebração combina assinatura e plano; renovação não muda a chave. LocalStorage guarda somente “visto”, por conta/ativação. Fechar ou rasgar marca como visto. Bloquear/editar o armazenamento nunca altera benefícios. Não há chamada de concessão de acesso pelo gesto, nem confirmação baseada somente na URL.

Stripe, limites e contatos continuam dependentes da ativação administrativa descrita em `docs/billing-setup.md`. A mudança visual não configura preços, chaves, webhook ou migração remota.

## Verificação

ESLint, TypeScript e build de produção; inspeção visual local em desktop/celular com QR e ticket explicitamente ilustrativos. A rota de prévia é removida antes da publicação. Capturas ilustrativas em 1280×900 e 375×812 sem erro de navegador nem overflow horizontal; QR, seis slots, checkbox marcado/desmarcado e ticket revisados. Sem testes automatizados, pagamento real, alteração de MFA ou sessão autenticada usados na revisão.
