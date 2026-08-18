> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Correções dos fluxos entre administrador e respondente

Data: 13 de julho de 2026.

## Escopo

Correção das incoerências confirmadas na navegação e na preservação de contexto entre os perfis de administrador e respondente.

## Correções aplicadas

### 1. Detalhe exato da recomendação

- Criadas rotas de detalhe por `recommendationId` para administrador e respondente.
- A tela deixou de reutilizar listagem paginada seguida de `items[0]`.
- O serviço valida o ID solicitado, o processamento oficial e o escopo da organização antes de retornar a recomendação.
- IDs inexistentes ou pertencentes a outra organização retornam ausência de recurso, sem expor dados.

### 2. Exportação de evidências preserva o contexto da tela

- Listagem, indicadores e exportação passaram a usar um único parser de filtros HTTP.
- A exportação agora preserva `cycleId`, `questionId`, `formId`, organização, status, busca e intervalo de datas.
- Paginação permanece exclusiva da listagem e não limita o arquivo exportado.

### 3. Histórico do respondente

- Diagnósticos em `completed` permanecem visíveis em **Meus diagnósticos**.
- O card concluído mantém acesso ao Resultado FAMI.
- A descrição da tela foi ajustada para representar acompanhamento e histórico, não apenas pendências.

### 4. Prontidão do plano antes do encerramento

- O encerramento exige ao menos uma ação válida para cada recomendação não dispensada.
- A regra é aplicada no serviço de domínio, no endpoint de prontidão e na interface administrativa.
- O botão de encerramento fica indisponível enquanto houver pendências e direciona o administrador ao plano filtrado pelo mesmo ciclo.
- A execução e a atualização das ações continuam permitidas após `completed`; o fechamento não congela o plano.

### 5. Limpeza e testes

- Removida a função administrativa de listagem que ficou sem consumidor após a criação da consulta exata.
- Removida exportação de tipo sem uso.
- Adicionados testes para seleção exata por ID, isolamento entre organizações, filtros de exportação, visibilidade de ciclos concluídos e bloqueio de encerramento sem ação.

## Validação

- `npm run lint`: aprovado, sem avisos;
- `npm run typecheck`: aprovado;
- `npm test`: 120 arquivos e 521 testes aprovados;
- `npm run check:complexity`: aprovado, 747 arquivos analisados;
- `npm run check:dead-code`: aprovado, sem resíduos;
- `npm run build`: compilação de produção, TypeScript, geração das páginas e traces concluídos.

O E2E dependente de Supabase local, contas de teste e Storage não foi executado nesta etapa. As regras novas foram cobertas por testes unitários e de serviço.
