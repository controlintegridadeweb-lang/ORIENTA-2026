# Correções do fluxo de validação dos formulários — 02/08/2026

## Escopo

Foram corrigidos os dois atritos residuais da gestão administrativa:

1. a operação em lote diferenciava apenas pelo estado `in_validation`, sem informar quais diagnósticos estavam efetivamente prontos;
2. o nome da programação sugeria uma conclusão automática irrestrita.

## Fonte única de prontidão

A migration `0027_validacao_insuficiente_fila.sql` agora define:

- `get_validation_finalization_readiness(uuid)`;
- `list_validation_finalization_readiness(uuid[])`.

A mesma função de prontidão é consumida pela fila, pelo painel em lote e pela RPC transacional `finalize_validation_cycle`. Ela verifica:

- evidências pendentes ou aguardando ajuste;
- respostas “Não se aplica” pendentes;
- respostas “Sim” sem comprovação e sem decisão administrativa;
- respostas obrigatórias ausentes;
- recomendações-base ausentes;
- processamento de trabalho inexistente;
- estado atual do diagnóstico.

## Interface

O painel apresenta separadamente:

- **Em validação**;
- **Prontos para concluir**.

O botão passou a se chamar **Concluir validações prontas** e envia ao lote somente os diagnósticos aptos.

A programação passou a usar o texto **Conclusão automática, se a validação estiver pronta**, com descrição explícita de que o sistema não toma decisões sobre evidências ou N/A.

## Contratos

Foram adicionados testes para:

- contadores e bloqueio do botão em lote;
- consulta única da prontidão em lote;
- compartilhamento da fonte de verdade entre painel, fila e finalização;
- presença de todos os bloqueadores relevantes.

## Estado estrutural

- 30 migrations canônicas;
- 171 funções públicas sem duplicidade;
- 226 arquivos Vitest em `src`;
- arquitetura, complexidade e segurança aprovadas estaticamente.
