> **Registro histórico:** a Etapa 5 precedeu a consolidação das migrations. A sequência `0001–0054` mencionada abaixo foi aposentada pela Etapa 5A e não deve ser aplicada.

# Etapa 5 — Validação integral e prontidão para produção

Data: 2026-08-12

## Status executivo

A parte **local/estática** da Etapa 5 está concluída. O projeto possui gates explícitos para separar `prontidão estrutural` de `go-live autorizado`.

O **go-live ainda não está autorizado**. Isso é intencional: faltam evidências executadas contra um projeto Supabase greenfield de destino e um deployment real do mesmo commit.

## Correções desta etapa

### 1. Gate de artefatos sensíveis

Foram removidos do pacote os utilitários `var/probe-mfa.mjs` e `var/probe-mfa-race.mjs`, que continham uma credencial de diagnóstico hardcoded.

Foi adicionado:

```bash
npm run check:sensitive-artifacts
```

O gate procura credenciais MFA conhecidas, chaves secretas Supabase e material de chave privada em caminhos operacionais.

### 2. Checklist de go-live auditável

Foi criado:

```text
var/greenfield/production-go-live-checklist.json
```

Todos os gates começam em `pending`. O checklist não pode aprovar produção por existir no repositório.

Validação estrutural:

```bash
npm run check:go-live -- --schema-only
```

Autorização real:

```bash
npm run check:go-live
```

O segundo comando exige commit, deployment, URL HTTPS, aprovador, data e evidência para cada gate.

### 3. Prontidão estrutural endurecida

`check:production-readiness` agora exige também:

- gate de artefatos sensíveis;
- gate de go-live;
- contrato do checklist;
- variáveis administrativas documentadas;
- scripts de backup/restore/smoke;
- readiness autenticada;
- documentação operacional.

### 4. Documentação do schema

A documentação de produção/banco foi sincronizada para a sequência vigente:

```text
0001–0054
54 migrations
186 funções públicas auditadas
```

### 5. Dados reais

A fotografia privada da Etapa 1 foi usada apenas temporariamente e removida antes do empacotamento.

Validação executada:

```text
43 tabelas
34.028 registros
43 usuários Auth
validate-export: aprovado
Auth dry-run: aprovado
transform: aprovado
import dry-run: aprovado
4 tabelas preliminares opcionais ignoradas na origem antiga
0 escritas
```

O ZIP da Etapa 5 não contém essa fotografia nem PII.

## Gates aprovados localmente

```text
db:audit:migrations       APROVADO
check:architecture        APROVADO
check:security-sync       APROVADO
check:sensitive-artifacts APROVADO
check:complexity          APROVADO
check:production-readiness APROVADO
check:go-live --schema-only APROVADO
check:respondent-seed     APROVADO
check:diagnostic-import   APROVADO
```

## Gates que continuam pendentes

Não são tratados como aprovados sem execução real:

- `npm ci` completo;
- `npm run typecheck`;
- `npm run test:coverage`;
- `npm run lint`;
- `npm run check:dead-code`;
- `npm run build`;
- aplicação real das migrations `0001–0054` em banco greenfield vazio;
- geração dos tipos TypeScript a partir desse banco;
- `db:verify` e verificações RLS/Storage no PostgreSQL real;
- E2E completo;
- smoke do deployment;
- backup criptografado;
- restore drill;
- fotografia final no momento do cutover;
- importação real no destino;
- paridade pós-importação;
- homologação e aprovação do go-live.

## Supabase conectado

Foi detectado um único projeto conectado:

```text
Nome: ORIENTA
Projeto: zdbzfapcvenwpdsgsmjc
Região: sa-east-1
Status observado: INACTIVE
Criado em: 2026-07-28
```

Nenhuma alteração foi feita nele. Como não há um segundo projeto identificado como destino greenfield, aplicar `0001–0054` nesse projeto seria inseguro: ele pode ser a origem dos dados reais.

## Critério para avançar

A próxima subetapa da Etapa 5 é validar um **projeto Supabase greenfield de destino**, vazio e distinto da origem. Somente nesse projeto devem ser aplicadas as migrations, regenerados os tipos e executados advisors, RLS/verify e importação de ensaio.

O banco de origem deve permanecer somente leitura durante essa validação.
