# Correções de Arquitetura e Clean Code — 01/08/2026

## Objetivo

Eliminar o fluxo legado de validação, reduzir componentes e serviços monolíticos,
restaurar as fronteiras entre camadas, remover ciclos entre domínios e transformar
os guardrails arquiteturais em verificações executáveis do repositório real.

## Resultado estrutural

- Arquitetura organizada em `app`, `application`, `features`, `infrastructure` e `shared`.
- Grafo de features acíclico: **17 domínios e 33 dependências**.
- Remoção das camadas genéricas `src/components` e `src/presentation`.
- Remoção dos contextos antigos `action-plans`, `recommendations`, `monitoring` e
  `validation-queue` como pacotes independentes e mutuamente acoplados.
- Consolidação de recomendações, planos de ação e supervisão em
  `features/improvement-management`.
- Consolidação da validação em `features/validation`.
- Criação de `features/respondent-progress` para a leitura agregada da jornada do
  respondente.
- Orquestrações entre domínios movidas para `src/application`.
- UI genérica movida para `src/shared/ui`; UI específica permanece na feature
  proprietária.
- Dependências entre features passam pelas APIs públicas `index.ts` dos domínios.

## Código legado removido

O fluxo antigo de fila de validação não era mais alcançado pelas páginas produtivas.
Foram removidos componentes, consultas e testes desse fluxo, preservando os cenários
relevantes na implementação atual.

Principais remoções:

- `ValidationQueue.tsx`;
- `ValidationQueueShell.tsx`;
- `ValidationQueueBatchActions.tsx`;
- consultas antigas de `validation-form-data.ts` e `validation-queue-data.ts` em
  `features/cycles`;
- testes exclusivos da interface desativada.

A base manual de TypeScript, JavaScript e SQL passou de **142.769 para 137.904
linhas**, redução líquida de **4.865 linhas**, mesmo com a criação de novos módulos,
guardrails e testes.

## Decomposição dos monólitos

### Validação

A implementação atual foi dividida em:

- contratos e tipos;
- parsing de filtros;
- schemas das RPCs;
- repositório de leitura;
- mapeamento da página;
- classificação de critérios;
- política de decisão;
- política de status de evidência;
- navegação por eixo e seção;
- controlador do workspace;
- componentes específicos para documentos, ausência de comprovação e N/A
  administrativo.

### Gestão de formulários

O estado e os comandos de `form-management-shell.tsx` foram extraídos para
`useFormManagementController.ts`.

### Workbench

A persistência individual foi separada da sincronização em lote por meio de
`workbench-batch-submission.ts`.

### Evidências

`EvidenceCard.tsx` deixou de concentrar todas as decisões e passou a compor:

- `EvidenceDocumentDecisionRow`;
- `AdminNotApplicableDecision`;
- `AbsentProofDecisionPanel`;
- configuração tipada das decisões.

Nenhum arquivo manual de produção ultrapassa **600 linhas**. O maior possui 593
linhas; `database.types.ts` permanece maior por ser gerado automaticamente.

## Rotas HTTP

Casos de uso extensos foram retirados de `route.ts` e movidos para adaptadores ou
serviços próprios:

- upload e verificação de evidências;
- criação de diagnósticos em lote;
- validação em lote;
- histórico e emissão de relatórios;
- download de relatórios;
- exceções de critérios.

A maior rota de API atual possui **97 linhas**.

## Tratamento de erros

Foi criado `infrastructure/supabase/database-error.ts` para centralizar:

- extração de mensagem;
- leitura do SQLSTATE;
- reconhecimento de códigos de domínio como tokens completos;
- violações de unicidade e chave estrangeira.

As comparações dispersas por `message.includes("codigo_interno")` foram eliminadas.
A única comparação textual restante identifica a mensagem externa do PostgREST para
RPC ausente no cache de schema, situação em que nem todas as versões fornecem um
código estável.

O lote de relatórios agora usa erros permanentes tipados. Falhas transitórias de
Storage ou infraestrutura permanecem elegíveis para nova tentativa.

## Guardrails

`check:architecture` agora valida:

- camadas permitidas;
- imports locais resolvidos;
- dependências invertidas;
- ciclos entre features e entre módulos TypeScript;
- qualquer import profundo de outro domínio;
- respostas HTTP convertidas por casting ou `parseJson<T>` sem schema;
- coerções duplas `as unknown as` no código produtivo;
- presença das decisões arquiteturais obrigatórias;
- inexistência das camadas removidas.

Também foram mantidos e aprovados:

- auditoria das 30 migrations canônicas;
- complexidade;
- segurança e sincronização;
- validação de sintaxe dos scripts, JSON e workflows YAML.

Os guardrails são executados no CI.

## Inventário atual

- **43 páginas** Next.js;
- **95 rotas de API**;
- **222 arquivos Vitest** em `src`;
- **5 testes Node.js** para scripts;
- **1 jornada Playwright canônica**.

## Validações executadas neste ambiente

Aprovadas:

```bash
node scripts/quality/check-architecture.mjs
node scripts/quality/check-complexity.mjs --report
node scripts/database/audit-migrations.mjs
node scripts/quality/check-security-sync.mjs
node --check scripts/**/*.mjs
git diff --check
```

Também foram verificados:

- imports locais e exports;
- ausência de erros de parser TypeScript;
- sintaxe de JSON e YAML;
- ausência de referências aos caminhos antigos;
- integridade do pacote ZIP após nova extração.

## Limites da validação

Não foi possível executar `npm ci`, Vitest, ESLint, `next typegen`, build completo,
Supabase local ou PostgreSQL neste ambiente. O registry configurado não forneceu as
dependências necessárias e não há runtime Supabase/PostgreSQL disponível.

Por isso, a aprovação desta entrega é **estrutural e estática**. Antes da produção,
o CI com dependências e banco deve executar:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
supabase db reset --local
npm run db:greenfield
npm run db:verify
npm run test:e2e
```
