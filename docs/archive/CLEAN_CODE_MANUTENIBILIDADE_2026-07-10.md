> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Clean Code e manutenibilidade — 10/07/2026

## Escopo

Esta etapa reorganiza responsabilidades sem alterar regras de negócio, estados do diagnóstico, contratos de API, cálculo FAMI, RLS ou migrations.

## Correções aplicadas

### Workbench

- `use-workbench.ts` deixou de concentrar carregamento, evidências, validação, persistência, navegação e envio.
- A validação e a persistência de respostas foram isoladas em `use-workbench-answer-flow.ts`.
- Os tipos compartilhados foram movidos para `workbench-types.ts`, removendo a dependência circular de tipos entre `use-workbench.ts` e `use-workbench-evidence.ts`.
- O payload de arquivo passou a usar narrowing explícito de `storagePath`, sem cast e sem aceitar `null` em contrato opcional.

### Configuração de perguntas

- `form-questions-configurator.tsx` foi reduzido de 653 para aproximadamente 360 linhas.
- O cadastro de pergunta foi isolado em `form-question-create-form.tsx`.
- A configuração de seção, métrica e recomendação-base foi isolada em `use-form-question-configurations.ts`.
- A edição de dispensas por organização foi isolada em `use-question-waiver-editor.ts`.
- O cache de configuração é removido explicitamente quando uma pergunta é excluída.

### Estado e contratos

- A sincronização anual do painel deixou de executar `setState` síncrono em `useEffect`.
- As telas anuais agora são reinicializadas por `key={year}`, mantendo o estado coerente com a URL e com os dados entregues pelo servidor.
- Tons FAMI não utilizados foram removidos em vez de ampliar artificialmente o tipo.

### Código morto e repositório

- Removido `workspace-tab-intro.tsx`, sem importações ou uso no projeto.
- Removidos símbolos de execução sem consumidor, incluindo guard legado de evidência, conversor de status, links antigos, labels órfãos e o detalhamento FAMI substituído pela estrutura agrupada.
- Removidos aliases de tipos sem uso e aliases históricos duplicados.
- Implementações usadas somente dentro do próprio módulo deixaram de ser exportadas publicamente.
- O tipo visual de recomendações foi movido para `recommendations/presentation-types.ts`, eliminando dependência da apresentação administrativa sobre o módulo do respondente.
- Adicionado `npm run check:dead-code`, baseado em Knip, e o gate foi incluído no CI.
- `database.types.ts` é ignorado pelo gate porque é um artefato gerado pelo Supabase; ele não é editado manualmente.
- O binário externo `psql`, exigido pelos scripts de banco, foi declarado como dependência de ambiente do scanner em vez de ser tratado como pacote npm ausente.
- Adicionado `.gitattributes` para padronizar arquivos-texto em LF e impedir diffs artificiais por CRLF.
- O limite impeditivo de arquivos manuais foi reduzido de 900 para 750 linhas.

## Resultado dos gates

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado, sem warnings.
- `npm run check:dead-code`: aprovado, sem arquivos, exports, tipos ou duplicidades pendentes no código manual.
- `npm run check:complexity`: aprovado, sem avisos.
- `npm run test`: 87 arquivos e 424 testes aprovados.
- `npm run test:coverage`: aprovado; 77,51% de linhas e 60,06% de branches no escopo configurado.
- `npm run build`: o build havia sido aprovado antes desta limpeza. Na repetição posterior, o processo da sandbox permaneceu na fase `Creating an optimized production build` até o limite de execução, sem emitir erro de código. Por isso, o build atual não é registrado como reconfirmado nesta etapa.

## Próximas prioridades de manutenção

Os maiores arquivos manuais restantes são:

1. `src/lib/forms/admin-service.ts` — 553 linhas;
2. `src/components/respondente/respondent-question-panel.tsx` — 540 linhas;
3. `src/components/respondente-recomendacoes/respondent-recommendations-shell.tsx` — 481 linhas;
4. `src/lib/forms/answers-export.ts` — 473 linhas;
5. `src/lib/library/repository.ts` — 458 linhas.

A próxima etapa deve decompor apenas os arquivos em que houver responsabilidades independentes. O tamanho isolado não justifica fragmentação artificial.

Também permanecem 38 supressões locais de ESLint. Elas não quebram o pipeline, mas devem ser revisadas por padrão de estado assíncrono, evitando substituir análise por novas supressões genéricas.
