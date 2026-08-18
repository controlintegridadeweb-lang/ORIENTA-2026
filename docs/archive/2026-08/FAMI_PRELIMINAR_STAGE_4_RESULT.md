> **Registro histórico:** referências à migration `0054` refletem a introdução original do FAMI preliminar. Na baseline greenfield atual, esse domínio já nasce no estado final consolidado.

# Etapa 4 — FAMI preliminar quadrimestral

Data: 2026-08-12

## Objetivo

Implementar acompanhamento FAMI por quadrimestre sem transformar progresso do
plano de ação em um novo Resultado FAMI oficial. O resultado oficial continua
imutável em `cycle_processings` + `fami_results`; o acompanhamento usa domínio,
histórico, cálculo e exportação próprios.

## Decisão de domínio

A metodologia implementada é `prelim_v1`:

1. a base é o processamento FAMI oficial concluído do mesmo diagnóstico que já
   existia na data de corte;
2. por critério, `gap recuperável = pontos possíveis - pontos oficiais`;
3. somente critério com recomendação do processamento oficial pode recuperar o
   gap;
4. `recuperação = gap × média do progresso das ações ativas na data de corte`;
5. ações canceladas ficam no snapshot histórico, mas não entram na média;
6. sem ação ativa, a recuperação é zero;
7. exceção institucional aprovada até a data de corte gera recuperação zero;
8. aceite/supervisão é governança e não cria pontos automaticamente;
9. a pontuação preliminar nunca pode ultrapassar o máximo oficial do critério;
10. o FAMI oficial não é atualizado, apagado ou substituído.

Quadrimestres civis:

- 1º: 01/01 a 30/04;
- 2º: 01/05 a 31/08;
- 3º: 01/09 a 31/12.

A materialização só é permitida a partir do dia seguinte ao fechamento, usando
`America/Fortaleza` no banco. Em 2026, por exemplo, o 2º quadrimestre só pode ser
congelado a partir de 01/09/2026.

## Persistência separada

A migration `0054_fami_preliminar_quadrimestral.sql` cria quatro tabelas próprias:

- `fami_preliminary_processings`: identidade do checkpoint, quadrimestre,
  versão, metodologia e FAMI oficial de origem;
- `fami_preliminary_action_snapshots`: estado histórico de progresso/status das
  ações no corte;
- `fami_preliminary_criterion_results`: memória de cálculo por critério;
- `fami_preliminary_results`: agregados por seção, eixo e global.

Nenhuma coluna foi adicionada a `fami_results` para distinguir “oficial” de
“preliminar”. Essa escolha é intencional: impede que consumidores antigos tratem
um checkpoint gerencial como Resultado FAMI oficial por engano.

## Imutabilidade e versões

Cada chave `(cycle_id, reference_year, quadrimester)` pode possuir várias
`calculation_version`. Reprocessar cria a versão seguinte. As quatro tabelas
preliminares usam trigger de bloqueio de `UPDATE`/`DELETE`.

A fonte oficial registra ainda:

- `source_cycle_processing_id`;
- `source_processing_version`;
- `source_policy_version`.

Isso permite explicar exatamente qual Resultado FAMI serviu de baseline para
cada checkpoint.

## Reconstrução point-in-time

O cálculo não usa `action_plans.progress_percentage` vivo para um quadrimestre
passado. Para cada ação criada até a data de corte, seleciona a última entrada de
`action_plan_progress_updates` anterior ao corte e congela:

- status;
- percentual;
- instante efetivo.

Não é gravado um falso “action revision no corte”, porque o histórico atual não
permite reconstruir todas as revisões de conteúdo da ação com precisão. Esse dado
foi deliberadamente omitido do snapshot preliminar.

## Proteção contra deriva da política oficial

Antes de agregar o preliminar, o banco soma `official_points` e
`points_possible` reconstruídos por critério e compara com o `fami_results`
global oficial congelado.

Se a diferença for maior que 0,01 ponto, a RPC aborta com
`preliminary_official_reconstruction_mismatch` e toda a transação é revertida.
Isso impede publicar um preliminar usando uma interpretação histórica diferente
daquela que produziu o Resultado FAMI oficial.

## API e autorização

Endpoint: `GET|POST /api/fami/preliminary`.

Leitura:

- administrador e respondente;
- escopo de organização/atribuição validado;
- `Cache-Control: private, no-store`.

Materialização:

- somente administrador;
- payload validado com Zod;
- RPC executada pelo backend com `auth.userId` como ator auditável;
- fechamento do quadrimestre e existência de FAMI oficial são revalidados no
  banco — o bloqueio visual não é a autoridade de segurança.

A RPC `materialize_fami_preliminary` só possui `EXECUTE` para `service_role`.
Usuários autenticados possuem apenas leitura RLS das tabelas do próprio escopo.

## Interface e relatório/exportação

O acompanhamento foi integrado às visões FAMI de administrador e respondente.
A UI mostra, por quadrimestre:

- FAMI oficial usado como base;
- FAMI preliminar;
- delta em pontos percentuais;
- versão do checkpoint;
- versão/política do processamento oficial.

O administrador pode materializar um quadrimestre fechado. O respondente é
somente leitura.

A exportação CSV é separada e identifica explicitamente:

- `tipo_resultado = FAMI_PRELIMINAR_QUADRIMESTRAL`;
- `carater = NAO_OFICIAL`;
- `methodologyVersion = prelim_v1`.

O pipeline de PDF oficial (`features/reports/.../official`) não consulta tabelas
`fami_preliminary_*` e não inclui `prelim_v1`. Há teste de contrato para impedir
mistura futura.

## Migração greenfield e snapshot real

O catálogo de migração foi estendido com as quatro tabelas preliminares. Elas são
marcadas `optionalInSource`, pois uma fotografia tirada antes da migration 0054
não deve ser rejeitada.

Foi repetido o pipeline com o snapshot privado real da Etapa 1:

- `data:migration:validate-export`: **APROVADO** — 43 tabelas, 34.028 registros,
  43 usuários Auth;
- `data:migration:transform`: **APROVADO** — 34.028 registros;
- `data:migration:import:dry-run`: **APROVADO** — 43 tabelas inseríveis, quatro
  tabelas preliminares ignoradas porque não existiam na origem, nenhuma escrita.

Se a origem já possuir a migration 0054 no momento de uma nova fotografia, os
checkpoints são exportados/importados com IDs e versões preservados. O campo
`calculated_by` participa do remapeamento Auth.

O importador também ganhou gates semânticos para:

- processamento preliminar apontando para ciclo errado;
- ação snapshot apontando para recomendação diferente da ação;
- resultado preliminar com ciclo divergente;
- aritmética por critério inválida;
- baseline reconstruída diferente do FAMI oficial.

## Gates desta etapa

- `check:complexity`: **APROVADO**;
- `check:architecture`: **APROVADO**;
- `check:security-sync`: **APROVADO**;
- `db:audit:migrations`: **APROVADO** — 54 migrations / 186 funções públicas;
- parse sintático TS/TSX com TypeScript: **APROVADO** — 1.205 arquivos;
- `node --check` nos scripts de migração alterados: **APROVADO**;
- pipeline de migração com snapshot real: **APROVADO em dry-run**.

## Validações que ainda exigem ambiente completo

O pacote não contém `node_modules` e o ambiente atual não possui `next`, portanto
`npm run typecheck` não pode completar (`next: not found`). O `tsc` global também
não é prova semântica válida porque perde os tipos de React, Next, Supabase, Zod,
Vitest e demais dependências.

Também não há PostgreSQL/Supabase CLI local disponível neste ambiente. A migration
0054 foi auditada estaticamente, mas ainda precisa ser **aplicada em banco novo de
teste** e validada com `supabase/verify/fami_preliminary_integrity.sql` antes do
cutover.

Esses itens não são considerados aprovados nesta etapa.

## Critério de aceite antes de produção

Em ambiente com dependências e Supabase de teste:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run db:audit:migrations
```

Depois de aplicar as migrations `0001–0054`, executar também os SQLs de `supabase/verify/`,
incluindo `fami_preliminary_integrity.sql`, e materializar checkpoints de teste
para cenários com ação 0%, 50%, 100%, cancelada, exceção aprovada e política FAMI
histórica.
