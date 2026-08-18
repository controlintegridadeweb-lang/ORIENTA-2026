> **Registro histórico:** referências à sequência antiga de migrations refletem o estado da Etapa 2. A baseline executável atual foi consolidada na Etapa 5A.

# Etapa 2 — Arquitetura e Segurança

Data da revisão: 2026-08-12

## Escopo

Esta etapa corrige os bloqueios encontrados nos gates `check:architecture` e
`check:security-sync` sem alterar as regras funcionais consolidadas do ORIENTA.
A sequência greenfield de banco preparada na Etapa 1 foi preservada.

## Resultado executivo

- `npm run check:architecture`: **APROVADO**.
- `npm run check:security-sync`: **APROVADO**.
- `npm run db:audit:migrations`: **APROVADO** — 53 migrations / 185 funções públicas.
- Parse/transpilação sintática TypeScript/TSX: **APROVADO em 1.188 arquivos**.
- `npm run typecheck`: **NÃO EXECUTADO INTEGRALMENTE** porque o ambiente de
  execução não conseguiu reconstruir `node_modules` com `npm ci`; o ZIP não
  inclui dependências instaladas. Este item não é considerado aprovado e deve
  ser executado no ambiente de desenvolvimento/CI com acesso às dependências.

## Correções de arquitetura

### 1. Dependências entre features

Foram removidos imports internos entre domínios. Quando uma feature precisa
fornecer capacidade server-side a outra camada, ela agora a expõe por uma API
pública `server.ts`; contratos de UI continuam saindo pelas superfícies
públicas existentes.

Foram criadas/ajustadas as superfícies públicas de:

- `features/admin/server.ts`;
- `features/evidences/server.ts`;
- `features/improvement-management/server.ts`;
- `features/improvement-management/index.ts`.

### 2. Dependência estrutural dos eixos

A ordem e normalização dos eixos deixaram de pertencer a FAMI ou plano de ação
e passaram para `shared/domain/axis.ts`. Isso remove a dependência circular
entre `cycles`, `fami` e `improvement-management` e mantém o conceito no nível
correto do domínio compartilhado.

### 3. Ciclos de módulos

Foram eliminados os ciclos:

- `CycleDashboard.tsx` ↔ `cycle-dashboard-filters.tsx`, com contratos próprios
  em `cycle-dashboard-contracts.ts`;
- `respondent-proof-requests.ts` ↔ `respondent-service.ts`, com contratos em
  `respondent-contracts.ts`.

O gate agora confirma grafo de módulos TypeScript acíclico.

### 4. Contratos HTTP

As rotas de documentos do plano de ação deixaram de confiar em casts do JSON
da requisição. Os payloads são validados em runtime por schemas Zod definidos
em `document-http-contracts.ts`.

### 5. Exportação XLSX

Foram removidas coerções duplas usadas na integração com `write-excel-file`.
A construção de planilhas e features usa os genéricos públicos da biblioteca,
sem `as unknown as`/`as never` para contornar o compilador.

## Correções de segurança

### 1. Download autenticado de arquivos privados

Foram implementadas as rotas que a interface já utilizava, mas que estavam
ausentes:

- `/api/evidences/[evidenceId]/file`;
- `/api/action-plan-documents/[documentId]/file`.

Ambas exigem autenticação backend, UUID válido, escopo da organização,
comprovação ativa, arquivo com validação estrutural `valid`, bucket privado e
URL assinada com TTL de 60 segundos. A resposta é um redirect 307 com
`Cache-Control: private, no-store`, `Referrer-Policy: no-referrer` e
`X-Content-Type-Options: nosniff`.

A rota de comprovantes do plano usa o bucket privado `planos-acao`; a rota de
evidências usa `evidencias`.

### 2. Proteção contra sobrescrita por Realtime

`recommendation-actions-workspace.tsx` agora usa um único handler de mudança
remota para `action_plans` e `action_plan_documents`. Se houver um editor aberto
(criação, edição, progresso ou evidência), a tela não executa `refetch` que
possa substituir o estado local; informa que houve alteração em outra aba e
exige recarga antes do salvamento.

Mutações originadas na própria tela continuam sendo ignoradas temporariamente
pelo `localMutationRef`.

### 3. Concorrência otimista da importação histórica

A importação já carregava a coluna `revision` da resposta e já enviava
`p_expected_revision: existing?.revision` para `apply_workbench_response`.
A reprovação anterior era um falso positivo causado por regex que aceitava
somente uma lista exata de cinco colunas. O gate foi corrigido para validar a
presença do contrato obrigatório mesmo quando a consulta possui campos
adicionais, sem remover a exigência de revisão esperada.

### 4. Regressão protegida pelos gates

O contrato de rotas críticas agora inclui também o download de comprovantes do
plano. O `check:security-sync` exige explicitamente, tanto para evidências como
para comprovantes:

1. `ensureOrganizationAccess`;
2. `file_validation_status === "valid"`;
3. `createSignedUrl`.

Assim, remover qualquer uma dessas proteções faz o gate voltar a reprovar.

## Banco e migração

Nenhuma migration foi adicionada ou alterada nesta etapa. A auditoria da
sequência greenfield continua aprovada:

- 53 migrations;
- 30 migrations de fundação;
- 23 evoluções pré-cutover;
- 185 funções públicas auditadas.

Os dados reais da fotografia privada da Etapa 1 não foram incluídos neste
pacote de código.

## Próxima etapa

A Etapa 3 deve tratar exclusivamente Clean Code e complexidade, em especial os
arquivos e funções que ultrapassam os limites definidos pelo próprio projeto.
A refatoração deve preservar os gates verdes obtidos nesta etapa.
