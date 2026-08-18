# Navegação do ciclo de validação

Estado consolidado em 2 de agosto de 2026.

## Entrada e retorno

- Ao iniciar a validação de um diagnóstico enviado, o administrador é levado
  diretamente para `/admin/ciclos/[cycleId]/validacao`.
- Ao reabrir uma validação concluída, a justificativa é registrada e a navegação
  segue diretamente para a mesma fila.
- A fila possui a ação visível **Voltar ao diagnóstico**, preservando `returnTo`
  quando a origem precisa ser mantida.

## Fila e formulário completo

- A fila reúne somente critérios que podem exigir decisão administrativa.
- O formulário completo é uma visualização de consulta de todas as respostas.
- O retorno do formulário completo preserva situação, seção, busca, página e
  quantidade por página da fila.

## Navegação por eixo e seção

- No desktop, os eixos e suas seções são exibidos em grupos com contadores de
  pendências e indicação de conclusão.
- No mobile, a mesma hierarquia é mantida em um seletor agrupado por eixo.
- Os estados vazios diferenciam fila concluída, ausência de itens operacionais e
  filtros sem resultado.

## Acesso direto por evidência

Links com `?evidenceId=<uuid>` usam a RPC
`find_validation_queue_page_for_evidence` para localizar a resposta. A fila:

1. seleciona a seção correta;
2. usa a visão que inclui o item mesmo quando já analisado;
3. calcula a página da fila unificada;
4. rola até o documento;
5. aplica foco e destaque visual.

Um identificador inválido é ignorado sem quebrar a página.

## Continuidade da análise

- O resumo superior informa itens concluídos, pendências e ajustes preparados.
- **Ir para a próxima pendência** foca o próximo critério da página ou retorna
  para a primeira página da visão pendente quando necessário.
- Após uma decisão individual ou em lote, a fila é atualizada e tenta focar a
  próxima pendência.

## Decisões em lote

A seleção em lote só apresenta operações compatíveis com todos os critérios
selecionados:

- aprovar evidências;
- considerar evidências insuficientes;
- solicitar ajustes;
- aceitar ou rejeitar “Não se aplica”;
- classificar administrativamente como “Não se aplica”.

Justificativas obrigatórias são validadas antes do envio. A execução usa os
endpoints concorrentes existentes, exibe falhas parciais e não declara sucesso
integral quando algum item falha.

## Encerramento

- Solicitações de ajuste só podem ser enviadas quando toda a análise pendente foi
  concluída.
- `proof_requested` entra no total de ajustes preparados.
- `not_presented` continua sendo pendência até decisão administrativa.
- A conclusão da validação só é liberada quando a fila está resolvida e então
  calcula o Resultado FAMI oficial.
