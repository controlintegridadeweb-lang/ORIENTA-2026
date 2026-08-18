# Etapa 5B — baseline validada em PostgreSQL real

Data da validação: 12/08/2026.
Projeto Supabase utilizado: `ORIENTA` (`zdbzfapcvenwpdsgsmjc`, `sa-east-1`).

## Objetivo

Preservar o Auth existente, reconstruir do zero o domínio aplicativo da Plataforma ORIENTA e provar que a baseline greenfield consolidada é executável em PostgreSQL real, sem carregar patches ou backfills da história de desenvolvimento.

A Etapa 5B valida **schema e infraestrutura de banco**. Ela não importa os dados históricos reais e não autoriza, por si só, o go-live da aplicação.

## Baseline canônica comprovada

A fonte executável contém exatamente dez migrations, em ordem de dependências:

1. `20260812000100_extensions_types.sql`
2. `20260812000200_schema.sql`
3. `20260812000300_relations.sql`
4. `20260812000400_read_models.sql`
5. `20260812000500_functions.sql`
6. `20260812000600_triggers.sql`
7. `20260812000700_storage.sql`
8. `20260812000800_security_rls.sql`
9. `20260812000900_comments.sql`
10. `20260812001000_contract_checks.sql`

O histórico remoto em `supabase_migrations.schema_migrations` foi normalizado para esses mesmos dez timestamps. Os blocos temporários usados apenas para transportar SQL pelo conector não permanecem no histórico canônico.

## Resultado no PostgreSQL real

O contrato final executado no banco real aprovou:

- 56 tabelas em `public`;
- 185 funções de aplicação: 177 em `public` e 8 helpers de autorização em `app_private`;
- 6 views/read models públicos;
- 89 triggers da aplicação, incluindo a proteção de relatório oficial em `storage.objects`;
- 71 policies RLS públicas;
- zero tabela pública sem RLS;
- 3 buckets privados canônicos (`evidencias`, `planos-acao`, `relatorios`);
- zero objeto no Storage durante a prova greenfield;
- zero dado aplicativo semeado pela baseline;
- FAMI oficial e FAMI preliminar em estruturas conceitualmente separadas;
- todas as funções da aplicação com `search_path` explícito;
- todas as views públicas com `security_invoker = true`.

A migration `20260812001000_contract_checks.sql` foi executada contra o PostgreSQL real e terminou sem exceção.

## Correções descobertas pela prova real

A execução em PostgreSQL encontrou problemas que a consolidação puramente estática não deveria mascarar. Todos foram corrigidos na baseline canônica, sem criar migrations de remendo posteriores:

1. O bootstrap de dados `bootstrap_diagnostico_integridade_2026()` estava indevidamente dentro da migration estrutural. Foi removido da produção e preservado apenas como fixture de teste.
2. `reports.cycle_id` possuía duas FKs conflitantes; ficou apenas a regra final com `ON DELETE RESTRICT`.
3. `response_admin_proof_events.decision` continha um CHECK antigo além do contrato final; ficou apenas o CHECK vigente, que inclui `considered_insufficient`.
4. O índice `action_plan_progress_updates_plan_idx` estava duplicado; a baseline passou a ter uma única definição.
5. `pg_trgm` foi retirado de `public` e as extensões ficam no schema `extensions`.
6. RPCs de evidências dependiam de uma view criada depois das funções. A DAG foi corrigida para `read_models` antes de `functions`.
7. O comentário de catálogo de `save_respondent_action_plan` ainda apontava para a assinatura anterior, sem `start_date`; a referência obsoleta foi removida.
8. O contract check antigo misturava estrutura com dados históricos específicos. A 010 agora valida somente contratos estruturais e aceita catálogo de eixos vazio antes da importação ou completo com os três eixos oficiais depois dela.
9. O contract check ainda usava um nome legado para o trigger de proteção de Storage. A validação agora usa o nome canônico real `official_report_storage_object_immutable`.

## Hardening de funções e RLS

O Security Advisor identificou funções `SECURITY DEFINER` herdando `EXECUTE` para `PUBLIC`. A baseline foi alterada para default-deny:

- `PUBLIC`, `anon` e `authenticated` não recebem execução genérica de funções públicas;
- `service_role` mantém acesso backend;
- oito helpers privilegiados de autorização saíram do schema exposto `public` e vivem em `app_private`;
- policies chamam os helpers por schema explícito;
- os helpers privados continuam `SECURITY DEFINER` porque precisam consultar dados de autorização sem recursão de RLS;
- nenhuma função privilegiada interna fica exposta como RPC apenas por herança de privilégio.

Os oito helpers privados são:

- `current_organization_id()`;
- `is_admin()`;
- `is_respondent()`;
- `is_current_official_recommendation(uuid)`;
- `is_cycle_respondent_editable(uuid)`;
- `is_response_respondent_editable(uuid)`;
- `is_cycle_question_version_allowed(uuid, uuid)`;
- `is_cycle_question_collection_editable(uuid, uuid)`.

O Performance Advisor também identificou policies permissivas redundantes e chamadas de `auth.uid()` recalculadas por linha. As policies foram consolidadas e os writes administrativos foram separados por comando (`INSERT`, `UPDATE`, `DELETE`). Após a correção, os WARNs de RLS/performance desapareceram.

Os avisos de índices “unused” não foram usados como justificativa para remover índices, porque o banco está vazio e ainda não possui workload representativo. Os avisos informativos de FKs sem índice ficam para análise após a carga e medição reais.

## Auth preservado

O schema `auth` não foi apagado. O fingerprint final é idêntico ao registrado antes da reconstrução:

- 43 usuários;
- 43 identidades;
- 1 fator MFA TOTP verificado;
- 7 sessões;
- 21 refresh tokens.

Fingerprints SHA-256 de controle:

- usuários: `d79d3f85f2823a27b9c8e499aabced0915faa529bb9770de2cea72bab034559d`;
- identidades: `b24f419fe5236c905b1ca27ae669b632a85e84e2bfc257c754f197b9e0dc8bd7`;
- segredo do TOTP: `5487e6d0ec08b8ad2e3e1a7bc1214c99b29eeb9d8e65922dc9bc8eec96561715`.

O fator MFA preservado mantém o ID `9cf90cb7-9f11-4388-8156-2667e42e2026` e status `verified`.

## Storage e Realtime

Estado comprovado:

- `evidencias`: privado, limite 20 MiB;
- `planos-acao`: privado, limite 20 MiB;
- `relatorios`: privado;
- `storage.objects`: 0 durante a prova greenfield.

Realtime está configurado para `responses`, `action_plans` e `action_plan_documents`.

## FAMI e migração de dados

Foi corrigido o validador do pipeline histórico para usar as colunas reais do contrato atual:

- `points_obtained`;
- `points_possible`;
- `percentage`.

A validação percentual usa:

```sql
(points_possible = 0 and percentage <> 0)
or
(points_possible <> 0 and abs(percentage - ((points_obtained / points_possible) * 100)) > 0.01)
```

A fotografia privada preparada na Etapa 1 foi exercitada somente em dry-run:

- export: 43 tabelas, 34.028 registros, 43 usuários Auth — aprovado;
- transformação: 34.028 registros — aprovada;
- import dry-run: 43 tabelas inseríveis, 4 estruturas preliminares opcionais, 34.028 registros, 0 escritas — aprovado.

Nenhum dado histórico real foi importado nesta etapa. A cópia temporária usada no dry-run foi removida antes do empacotamento.

## Tipos TypeScript

O Supabase gerou o contrato TypeScript diretamente do banco real. O arquivo do projeto foi sincronizado contra esse typegen e contra o inventário remoto:

- 124 funções não-trigger expostas em `public`;
- helpers `app_private` não fazem parte do contrato público do PostgREST;
- `start_date`, FAMI preliminar e read models estão refletidos no contrato atual.

## Advisors

### Segurança

Depois do hardening das funções, não restam warnings de `SECURITY DEFINER` exposta.

Persistem apenas:

- INFOs de RLS habilitado sem policy em filas internas deliberadamente default-deny;
- um WARN externo ao schema: **Leaked Password Protection** do Supabase Auth está desabilitada.

Essa proteção é configuração do Auth hospedado e não é uma migration SQL. O conector disponível nesta execução não expõe a alteração dessa configuração, portanto ela permanece pendente e não foi falsamente marcada como resolvida.

### Performance

Após a consolidação das policies, não restam WARNs de RLS/performance. Restam somente recomendações informativas de índices/FKs que devem ser reavaliadas depois da importação e de workload representativo.

## Gates locais finais

Aprovados:

- `npm run db:audit:migrations`;
- `npm run check:architecture`;
- `npm run check:security-sync`;
- `npm run check:sensitive-artifacts`;
- `npm run check:complexity`;
- `npm run check:production-readiness`;
- `npm run check:go-live -- --schema-only`.

O gate de complexidade analisou 1.286 arquivos / 152.215 linhas e permaneceu dentro dos limites sem aumentar os thresholds.

## Limitações que permanecem

Este workspace não contém `node_modules`; portanto esta etapa não declara aprovados `npm run typecheck`, suíte completa de testes, cobertura, lint completo ou `npm run build` por execução local neste ambiente.

A Etapa 5B também não executou a importação real dos 34.028 registros. Ela provou a baseline e o pipeline em dry-run. A importação real, paridade pós-importação, E2E/smoke, build/deploy, backup/restore e homologação pertencem aos gates seguintes de cutover/go-live.

## Veredito

**Etapa 5B aprovada para o escopo de banco greenfield:** Auth preservado, domínio aplicativo reconstruído em PostgreSQL real, baseline canônica comprovada, segurança endurecida e histórico remoto normalizado para dez migrations.

**Go-live geral ainda não autorizado.**
