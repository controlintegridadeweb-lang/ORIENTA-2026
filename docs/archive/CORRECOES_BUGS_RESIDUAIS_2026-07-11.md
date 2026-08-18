> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Correções de bugs residuais — 11/07/2026

## Escopo

Esta etapa corrigiu falhas de concorrência, paginação, cache, histórico e exposição de erros identificadas após a homologação dos estados da interface.

## Correções aplicadas

1. **Leituras assíncronas fora de ordem**
   - Criado `useLatestRequestGuard` para aceitar somente a resposta da leitura atual.
   - Aplicado às listas de evidências, indicadores, respondentes, históricos, relatórios e snapshots FAMI.
   - O `loading` de uma requisição antiga não encerra mais o carregamento atual.

2. **Cache do portfólio limitado a 200 itens**
   - O cache percorre todas as páginas retornadas pela API até alcançar o total informado.

3. **Restauração de cache obsoleto**
   - Toda leitura recebe uma versão.
   - Promessas invalidadas podem concluir para o chamador original, mas não voltam a gravar o cache compartilhado.

4. **Snapshot FAMI de outro diagnóstico**
   - Resultados anteriores são invalidados na troca de organização, diagnóstico ou ano.
   - Somente o request mais recente pode atualizar o snapshot e os indicadores relacionados.

5. **Preview de PDF incorreto**
   - Cada abertura recebe um identificador de request.
   - PDFs antigos são descartados e suas URLs `blob:` são revogadas.
   - Fechamento e desmontagem também invalidam leituras pendentes.

6. **Truncagem pelo limite do PostgREST**
   - Criado coletor de páginas com ordenação estável e leitura até página vazia.
   - Evidências, recomendações, planos de ação, processamentos oficiais, dispensas, vínculos e snapshots auxiliares são paginados.
   - Filtros `IN` são divididos em blocos para evitar URLs excessivas e limites do gateway.

7. **Histórico de relatórios apagado após falha**
   - Falhas de atualização preservam o conteúdo válido já carregado e exibem o erro separadamente.

8. **Histórico incompleto de evidências**
   - A trilha é reconstruída a partir de `audit_logs`, preservando os vereditos anteriores.
   - O estado embutido continua sendo usado como fallback quando ainda não existe auditoria.

9. **Exposição de erros internos**
   - Erros HTTP 500 retornam mensagem pública estável e `errorId`.
   - Detalhes completos permanecem apenas no log do servidor.
   - Mensagens, hints e constraints do PostgreSQL/Supabase não são devolvidos ao navegador.

## Testes de regressão

Foram adicionados ou ampliados testes para:

- respostas assíncronas fora de ordem;
- cache acima de 200 itens;
- invalidação de cache com promessa pendente;
- troca rápida de diagnóstico FAMI;
- preview concorrente de relatórios;
- paginação acima de 1.000 evidências, recomendações e planos;
- paginação quando o servidor devolve páginas menores que o intervalo solicitado;
- preservação do histórico após falha de atualização;
- reconstrução do histórico de validações;
- sanitização de erros internos.

## Limite de validação

Os testes automatizados usam clientes simulados e validam os contratos de paginação, ordenação e mapeamento. A confirmação final das policies, índices, planos de consulta e histórico real depende da execução de `npm run db:verify` contra PostgreSQL/Supabase.
