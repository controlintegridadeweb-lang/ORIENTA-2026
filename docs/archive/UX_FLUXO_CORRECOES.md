> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Correções de navegabilidade, usabilidade e coerência de fluxo

## Objetivo

Consolidar a experiência da plataforma em torno do ciclo como execução concreta. Quando a pessoa visualiza, responde, valida ou acompanha um diagnóstico específico, todas as telas relacionadas devem manter o mesmo `cycleId`.

## Correções aplicadas

### Contexto do ciclo em recomendações, evidências e FAMI

- Após o envio, o workbench informa que o diagnóstico segue para validação; recomendações oficiais só ficam disponíveis depois da consolidação.
- A lista de recomendações aceita e aplica `cycleId` e `axisId` como filtros reais.
- Cards e exportações de recomendações exibem o período do ciclo.
- Os atalhos por eixo na tela FAMI encaminham `axisId` e, quando aplicável, `cycleId`.
- Evidências e estatísticas de evidências respeitam o `cycleId` quando abertas a partir de um diagnóstico concreto.
- A tela FAMI apresenta somente o resultado de um diagnóstico concreto, com recomendações, evidências e estatísticas do mesmo ciclo.
- Links da tela FAMI para recomendações e evidências preservam o contexto do ciclo selecionado.

### Criação e publicação de ciclos

- A etapa final do assistente de formulário foi renomeada para **Próximos passos**.
- O assistente não informa mais que cria o ciclo durante a publicação.
- Após publicar um formulário, o administrador é levado para a criação de ciclo com o formulário publicado pré-selecionado.
- A criação de ciclo não seleciona arbitrariamente o primeiro formulário ou a primeira organização.
- A tela mostra apenas formulários publicados e apenas organizações efetivamente atribuídas ao formulário escolhido.
- A submissão é bloqueada enquanto a combinação formulário + organização não for válida.

### Finalização do workbench

- As ações foram renomeadas para deixar a diferença entre revisar e enviar mais clara.
- Ao tentar enviar com pendências, o workbench direciona para o primeiro critério inválido.
- O envio exige confirmação explícita de que o diagnóstico seguirá para validação.
- O UUID técnico do ciclo foi removido da experiência normal do respondente.

### Navegação, tratamento de erro e painel de ciclos

- O menu do respondente passou a conter acesso direto ao **Plano de ação**.
- Foram criadas telas de `not-found`, erro de segmento e erro global.
- O painel administrativo de ciclos recebeu busca e filtros por formulário, organização, estado e prazo vencido, além de estado vazio contextualizado.

## Estado de validação desta entrega

- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado;
- `npm test`: verificação histórica; consulte o relatório técnico mais recente para a execução atual.
- `npm run check:complexity`: aprovado;
- `npm run build`: depende da execução integral em ambiente com Supabase configurado.

A homologação de migrations, RLS, Storage e RPCs continua exigindo uma stack
Supabase/PostgreSQL real. O comando e os verificadores estão descritos em
[`docs/VERIFICACAO_BANCO_E_STORAGE.md`](VERIFICACAO_BANCO_E_STORAGE.md).
