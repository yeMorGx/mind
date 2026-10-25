# 18 princípios de UX do Mind

Este guia transforma as 18 leis da referência enviada pelo proprietário em critérios obrigatórios de revisão para as interfaces do Mind. O nome "lei" é uma convenção: algumas são modelos experimentais, outras são princípios perceptivos ou heurísticas. Nenhuma garante, sozinha, que uma interface funcionará.

## Como aplicar

Antes de implementar ou alterar uma tela, componente ou fluxo:

1. Considere os 18 princípios e relacione os que afetam a tarefa, o conteúdo e o contexto de uso.
2. Para cada princípio relevante, descreva a decisão concreta de interface. Marque os demais como não aplicáveis e explique brevemente por quê.
3. Identifique conflitos. Priorize o objetivo real da pessoa, acessibilidade, segurança, privacidade, clareza e evidências do produto; não force uma lei para cumprir uma lista.
4. Revise o fluxo completo, incluindo espera, confirmação, falha e recuperação. Confira teclado, toque, leitor de tela, contraste, telas estreitas e movimento reduzido quando aplicável.
5. Na entrega, resuma os princípios usados, os trade-offs e como a solução foi conferida. Para fluxos de alto impacto, prefira observação ou teste com usuários a suposições.

Uma revisão é obrigatória; fazer cada princípio aparecer visualmente em todo componente não é. Nenhum deles autoriza padrões manipulativos, esconder custos ou dificultar cancelamento, recusa ou saída.

## Princípios e aplicação no Mind

1. **Lei de Hick** — O tempo de decisão tende a crescer conforme aumentam as opções e sua complexidade. Agrupe filtros e ações, dê nomes claros e mostre primeiro as escolhas necessárias para a tarefa. Não esconda opções importantes apenas para reduzir a contagem.

2. **Lei de Fitts** — O tempo para alcançar um alvo depende do tamanho do alvo e da distância. Dê área clicável adequada a ações frequentes, aproxime controles relacionados e considere a posição dos alvos em telas de toque. Preserve os mínimos de acessibilidade; não aumente alvos às custas de sobreposição.

3. **Lei de Jakob** — As pessoas trazem expectativas aprendidas em outros produtos. Use convenções reconhecíveis para busca, navegação, filtros, perfil, salvar, publicar e voltar. Preserve a identidade do Mind e só desvie de uma convenção quando isso melhorar uma tarefa conhecida e o novo comportamento estiver claro.

4. **Lei da proximidade** — Elementos próximos tendem a ser percebidos como relacionados. Agrupe rótulos com campos, autoria com publicação e metadados com seu conteúdo; mantenha distância entre grupos diferentes. Espaçamento também comunica hierarquia, então não o use como decoração aleatória.

5. **Lei de Miller** — A capacidade da memória de trabalho é limitada, mas "7 ± 2" não é uma regra universal para limitar menus ou cards a sete itens. Divida tarefas e textos longos em grupos com significado, mantenha o contexto necessário e use busca quando listas forem extensas.

6. **Limiar de Doherty** — Respostas rápidas ajudam a manter a continuidade da interação. Dê feedback imediato a ações, mostre carregamento quando houver espera e use atualização otimista apenas quando for segura e reversível. Os 400 ms são uma referência histórica, não um SLA universal; mantenha a informação correta quando a operação depender de rede ou processamento longo.

7. **Efeito Von Restorff** — Um item distinto entre itens semelhantes pode chamar mais atenção e ser mais lembrado. Reserve destaque visual para uma ação ou informação realmente prioritária, como publicar ou um aviso importante. Se tudo se destaca, nada se destaca; não use cor de destaque para mascarar anúncios, riscos ou ações secundárias.

8. **Efeito de posição serial** — Em listas lembradas, posições iniciais e finais tendem a receber mais atenção ou lembrança. Coloque itens prioritários em posições previsíveis e use ordenação, busca e filtros para listas longas. Não esconda itens intermediários nem confie apenas na posição para comunicar importância.

9. **Regra do pico-fim** — A avaliação de uma experiência é influenciada por momentos marcantes e pelo encerramento. Cuide especialmente de publicar, concluir cadastro, copiar, assinar, falhar e recuperar uma ação. Sucesso deve ser verdadeiro e erros devem oferecer saída; animação não pode substituir feedback claro.

10. **Efeito Zeigarnik** — Tarefas percebidas como inacabadas podem permanecer na memória. Mostre progresso somente quando a tarefa tiver etapas reais e permita retomada com contexto. Não crie pendências artificiais, notificações insistentes ou pressão para induzir conclusão.

11. **Lei de Prägnanz** — Percebemos formas ambíguas como estruturas simples e organizadas. Prefira hierarquia, agrupamento e sinais visuais claros; simplifique a leitura sem apagar distinções importantes entre estados, conteúdo e ações.

12. **Lei da semelhança** — Elementos com aparência semelhante tendem a ser percebidos como pertencentes à mesma categoria. Mantenha consistentes aparência e comportamento de controles equivalentes. Elementos visualmente parecidos não devem executar ações diferentes sem rótulos ou contexto que deixem isso evidente.

13. **Conectividade uniforme** — Elementos ligados por uma forma, linha ou superfície comum tendem a ser percebidos como relacionados. Use contêineres, indicadores ou estados compartilhados para mostrar relações reais, como resultados e autoria. Não conecte visualmente elementos independentes nem dependa apenas da cor para indicar a relação.

14. **Lei de Tesler** — A complexidade inerente a uma tarefa não desaparece; o produto pode reduzi-la ou transferi-la para a pessoa. Automatize trabalho repetitivo, ofereça bons padrões e revele controles avançados quando necessários. Mantenha explícitos os passos de alto impacto e permita corrigir decisões.

15. **Lei de Postel** — A robustez favorece aceitar variações legítimas na entrada e manter saídas consistentes. Normalize espaços e capitalização quando isso for esperado, valide claramente e preserve a forma canônica dos dados. Nunca interprete esta lei como aceitar conteúdo inseguro, contornar autorização ou enfraquecer validações de segurança.

16. **Lei de Parkinson** — Trabalho pode crescer para ocupar o tempo ou os passos disponíveis. Mantenha publicação, criação e configuração focadas, removendo perguntas redundantes e etapas sem valor. Não imponha contadores regressivos ou limites arbitrários para acelerar a pessoa.

17. **Navalha de Occam** — Prefira a solução mais simples que resolva o problema real. Reduza ações duplicadas, explicações repetidas e complexidade visual desnecessária, sem sacrificar acessibilidade, transparência, controle ou cobertura de casos importantes.

18. **Princípio de Pareto** — Uma parcela menor de causas pode responder por uma parcela maior dos resultados; a proporção 80/20 não é garantida. Use pesquisa, suporte e dados reais para priorizar as tarefas mais frequentes ou valiosas do Mind. Não ignore necessidades minoritárias, acessibilidade ou funções essenciais por serem menos usadas.

## Referências

- [Laws of UX — coleção e definições](https://lawsofux.com/laws/)
- [Paul M. Fitts, *The Information Capacity of the Human Motor System* (1954)](https://doi.org/10.1037/h0055392)
- [George A. Miller, *The Magical Number Seven, Plus or Minus Two* (1956)](https://doi.org/10.1037/h0043158)
- [Nielsen Norman Group — Jakob's Law](https://www.nngroup.com/videos/jakobs-law-internet-ux/)
- [Nielsen Norman Group — Fitts's Law in UX](https://www.nngroup.com/articles/fitts-law/)
- [W3C — WCAG 2.2, Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [A. J. Thadhani, *The Economic Value of Rapid Response Time* (IBM, 1982)](https://www.ibm.com/support/pages/system/files/inline-files/EconomicValueofResponseTime.pdf)

As referências embasam os conceitos, mas a escolha de interface deve continuar sendo validada no contexto real do Mind. Em particular, Miller não define um limite geral de sete opções; o limiar de Doherty não é um limite rígido para todas as operações; e Postel, Parkinson, Occam e Pareto são heurísticas, não leis psicológicas universais.
