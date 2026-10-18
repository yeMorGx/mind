# Seleção, agendamento e anexos

Modo Operate. A solicitação aplica o visual HeroUI aos dropdowns de entrada, incluindo novos campos, usa DatePicker para campanhas e troca entrada de URL de imagem/vídeo por anexos. Mantém o tema claro e a hierarquia atual. O Dropdown enviado serve como referência visual; Select e Autocomplete da mesma biblioteca são os controles adequados de formulário, com seleção, validação e integração nativa de valores.

## Componentes compartilhados

`components/ui/SelectField.tsx` usa HeroUI 3.2.6, com opções normais ou pesquisáveis, estado controlado, `name`, `required`, opções desabilitadas, ícones e erros. O portal entra no diálogo nativo ou no contêiner com role dialog quando necessário para continuar interativo, inclusive nas gavetas Radix. `SearchSelect` preserva a API dos filtros usando esse componente; `AIModelPicker` preserva logos, aliases pesquisáveis e nomes personalizados. Filtros continuam sem borda. A regra para novos campos está em AGENTS.md.

```tsx
<SelectField label="Tipo" value={type} onValueChange={setType}
  options={[{ value: "image", label: "Imagem" }, { value: "video", label: "Vídeo" }]} />
```

Campanhas usam `CampaignDateTimeField`, com português, dia/mês/ano, horário de 24 horas e minutos. A data acompanha o fuso do navegador e é persistida como instante UTC. A leitura do fuso é estável durante hidratação. O encerramento opcional pode ser limpo pelo botão Remover data final.

As importações CSS são limitadas a tema, utilitários e componentes usados, sem importar o reset global da HeroUI. As novas regras visuais estão em classes próprias; os estilos existentes da landing foram preservados.

## Mídia

Campanhas oferecem arquivo para logo, capa e vídeo, com prévia, substituição, remoção e estado de envio. Logo não é recortado; capa e vídeo têm prévia horizontal. Uploads exigem sessão administrativa e emblema de dono, usam token assinado para caminho aleatório e chegam ao bucket público `mind-campaign-assets`. Imagens: JPG/PNG/WebP/AVIF até 8 MB na interface/API de preparação; vídeos MP4/WebM até 30 MB. O bucket aceita esses tipos e tem limite global de 30 MB por arquivo.

Prompts removem a alternativa de colar link de vídeo. Fotos/capas de perfil, capas de recursos e imagens de prompts já usam arquivos. URLs salvas anteriormente continuam legíveis, sem perder mídia existente. URLs de destinos de botão, sites e servidores MCP continuam sendo links.

## Conferência

TypeScript, ESLint e build de produção, mais inspeção local em 1440×1000 e 390×844. A prévia de componentes não representa sessão administrativa e foi removida antes da publicação. Foram conferidos seleção/form-data, opção vazia, filtro pesquisável, logos, modelo personalizado, opções dentro de diálogo nativo e data/hora no fuso America/Sao_Paulo. Selecionar dia 21 manteve 12:30 local; aumentar a hora produziu 13:30 local / 16:30 UTC. Sem erro de hidratação e sem overflow horizontal no fixture final (390 px de conteúdo para viewport de 390 px). A gaveta real de filtros de `/explore` também foi exercitada no celular: ordenação, busca de categoria e Aplicar filtros funcionaram sem erros, com conteúdo de 390 px.

Capturas locais ignoradas pelo Git em `.impeccable/review/`: `form-controls-{calendar,dropdown}-{desktop,mobile}.png` e `campaign-attachments-{desktop,mobile}.png`. Popovers foram capturados depois da transição. Não houve criação de campanha real, teste de pagamento ou upload autenticado na conta do proprietário.

A migração `campaign_asset_storage` foi aplicada ao Mind pelo MCP autenticado. Tipo/tamanho do bucket e política somente de leitura pública foram relidos; nenhum acesso público de escrita foi adicionado. O advisor não trouxe avisos novos para esta alteração. A rota pública de métricas respondeu 200 para ID inexistente, sem gravar evento, confirmando o serviço da Vercel; a preparação de upload rejeitou chamada sem sessão com 401.

Referências: [Dropdown](https://heroui.com/en/docs/react/components/dropdown), [Select](https://heroui.com/en/docs/react/components/select), [Autocomplete](https://heroui.com/en/docs/react/components/autocomplete) e [DatePicker / Format Options](https://heroui.com/en/docs/react/components/date-picker#format-options). HeroUI é MIT; versões e lockfile estão registrados no projeto.
