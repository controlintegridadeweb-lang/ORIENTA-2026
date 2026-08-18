> **Registro histórico:** referências à sequência antiga de migrations refletem o estado da Etapa 3. A baseline executável atual foi consolidada na Etapa 5A.

# Etapa 3 — Clean Code e complexidade

Data: 2026-08-12

## Objetivo

Reduzir concentração de responsabilidades em arquivos, funções, componentes React,
scripts operacionais e testes sem aumentar os limites definidos em
`scripts/quality/check-complexity.mjs` e sem regredir arquitetura, segurança ou
migrations da etapa anterior.

## Resultado dos gates

- `npm run check:complexity`: **APROVADO** — 0 violações.
- `npm run check:architecture`: **APROVADO**.
- `npm run check:security-sync`: **APROVADO**.
- `npm run db:audit:migrations`: **APROVADO** — 53 migrations / 185 funções públicas.
- Parse sintático TS/TSX: **APROVADO** — 1.198 arquivos.
- `node --check` nos scripts `.mjs` alterados: **APROVADO**.
- `typecheck` semântico completo: **não executável neste pacote**, pois `node_modules`
  não está disponível. A tentativa com o `tsc` global falha por módulos e tipos
  externos ausentes (`react`, `next`, `@playwright/test`, `vitest`, `zod`,
  `@supabase/supabase-js`, `@types/node`, etc.). Esse resultado não foi mascarado
  como aprovação.

## Situação inicial

O gate reportava 8 violações:

1. `src/features/evidences/cycle-read-model.ts`: 693 linhas.
2. `src/features/validation/components/EvidenceCard.test.tsx`: 631 linhas.
3. callback principal de `EvidenceCard.test.tsx`: 548 linhas.
4. `EvidenceDocumentDecisionRow`: 458 linhas.
5. `respondent-question-details.tsx`: 616 linhas.
6. `EvidenceDetails`: 376 linhas.
7. `scripts/database/mark-cbmrn-sections-admin-na.mjs`: 710 linhas.
8. callback serial do E2E canônico: 507 linhas.

Nenhum limite do gate foi alterado.

## Refatorações aplicadas

### Evidências — read model

`cycle-read-model.ts` caiu de 693 para 139 linhas e agora coordena o caso de uso,
sem concentrar schema, transformação e acesso ao banco no mesmo módulo.

Responsabilidades extraídas para `src/features/evidences/read-model/`:

- `contracts.ts`: schemas Zod, contratos e tipos de paginação/métricas;
- `mappers.ts`: conversão banco/RPC → modelo de UI e histórico de validação;
- `queries.ts`: consultas Supabase, paginação, filtros hierárquicos e auditoria.

A API pública anterior foi preservada por `cycle-read-model.ts`.

### Validação — documento de evidência

`EvidenceDocumentDecisionRow` caiu de 458 para 352 linhas.

A representação do documento foi extraída para `EvidenceDocumentSummary` (108
linhas), separando:

- identidade visual e metadados da evidência;
- abertura/download de arquivo ou link;
- corpo textual e observação;
- status visual;

do estado e comandos administrativos de validação/autosave.

### Workbench do respondente

`respondent-question-details.tsx` caiu de 616 para 139 linhas e ficou responsável
pela justificativa de “Não se aplica” e pelo ponto de composição público.

O fluxo de evidência foi extraído para `respondent-evidence-details.tsx`.
Dentro dele, `PersistedEvidenceList` separa o histórico/listagem das evidências do
editor. A função `EvidenceDetails` caiu de 376 para 323 linhas.

### Testes do EvidenceCard

O arquivo monolítico de 631 linhas foi removido e separado por comportamento:

- `components/tests/EvidenceCard.evidence-documents.test.tsx`: comportamento dos
  documentos e apresentação;
- `components/tests/EvidenceCard.administrative-decisions.test.tsx`: decisões
  administrativas e N/A;
- `components/tests/EvidenceCard.test-support.ts`: factories compartilhadas.

Os testes foram colocados na pasta `tests`, conforme a regra arquitetural do
próprio repositório (não em `__tests__`).

### Script administrativo CBM/RN

`mark-cbmrn-sections-admin-na.mjs` caiu de 710 para 516 linhas.

Foram extraídos:

- `cbmrn-admin-na/config.mjs`: IDs oficiais, justificativa, batch size e abort;
- `cbmrn-admin-na/query.mjs`: paginação reutilizável;
- `cbmrn-admin-na/assert-identity.mjs`: validação defensiva de órgão, formulário,
  versão, período, seções, ciclo e critérios.

A rotina destrutiva continua com dry-run por padrão e `--execute` explícito.

### E2E canônico

A checagem de isolamento RLS do usuário externo foi extraída para
`assertOutsiderCannotAccessCycle`, removendo responsabilidade operacional do
callback serial. O callback passou de 507 para 498 linhas e o gate ficou dentro
do limite sem alteração de configuração.

## Panorama final do gate

Maiores arquivos manuais agora estão abaixo de 600 linhas:

- `scripts/imports/diagnostic-responses.mjs`: 584;
- `respondent-recommendations-shell.tsx`: 559;
- `admin-action-plan-institutional-feed.tsx`: 558;
- `application/automation/import-service.ts`: 556;
- `cycles/cycle-state-service.ts`: 555.

Maiores funções permanecem dentro de seus limites:

- callback serial E2E: 498 / limite E2E 500;
- `ReadonlyCriterionCard`: 365 / limite 375;
- `RecommendationMonitoringPanel`: 361 / limite 375;
- `EvidenceDocumentDecisionRow`: 352 / limite 375;
- `RespondentRecommendationsShell`: 345 / limite 375.

## Avisos estruturais não bloqueantes

O gate ainda informa concentração de arquivos diretos em três features:

- `src/features/evidences`: 39 arquivos;
- `src/features/improvement-management/action-plans`: 39 arquivos;
- `src/features/validation`: 42 arquivos.

Esses itens são `notes`, não violações. Não foi feita uma movimentação massiva só
para reduzir contagem, pois isso teria alto risco de regressão e não reduziria
complexidade comportamental. Recomenda-se reorganizá-los quando houver uma
fronteira de subdomínio clara, não por meta numérica.

## Conclusão

A Etapa 3 atingiu o objetivo definido: `check:complexity` passou com os limites
originais e os gates de arquitetura, segurança/sincronização e migrations
continuam verdes. A próxima validação obrigatória em CI/ambiente de desenvolvimento
com dependências instaladas é `npm run typecheck` e a suíte de testes afetada.
