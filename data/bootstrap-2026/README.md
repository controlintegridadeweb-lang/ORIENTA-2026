# Bootstrap canônico — Diagnóstico de Integridade 2026

Esta pasta contém a **carga inicial real** do ORIENTA 2026. Ela não é um backup do banco antigo e não preserva a trajetória técnica do Supabase anterior.

## Fonte de verdade

- `supabase/migrations/`: define **como o banco é hoje**.
- `data/bootstrap-2026/private/`: define **quais dados reais de 2026 devem existir na implantação inicial**.

## O que é preservado

- 42 órgãos;
- 43 usuários/perfis atuais (1 administrador + respondentes);
- dados funcionais de 22 respondentes históricos quando disponíveis;
- 3 eixos, 22 seções e 126 perguntas;
- formulário publicado, rascunho atual, atribuições e período;
- somente ciclos que possuem respostas importadas;
- 2.898 respostas;
- 509 evidências/comprovações;
- estado atual das decisões administrativas armazenadas em `responses` e `evidences`.

## O que deliberadamente não é preservado

Não entram no bootstrap: `audit_logs`, snapshots, notificações, eventos de reabertura, eventos de submissão, processamentos antigos, Storage vazio, relatórios emitidos, recomendações materializadas, planos de ação antigos e séries históricas de FAMI.

Esses dados descrevem **como o sistema antigo chegou ao estado atual**. A partir da nova implantação, o ORIENTA passa a produzir seu próprio histórico normalmente.

## Segurança

`private/` contém dados institucionais e dados pessoais. A pasta está ignorada pelo Git, mas é mantida no pacote local entregue para a implantação. Não publique seu conteúdo em repositório público.

## Importação

1. Configure `.env.local` para o **novo** Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ACCESS_TOKEN=sbp_...
```

2. Confira a carga local:

```bash
npm run bootstrap:2026:verify
```

3. Em projeto Supabase novo, aplique o schema por HTTPS:

```bash
npm run db:push:api
```

4. Faça um dry-run dos dados:

```bash
npm run bootstrap:2026:dry-run
```

5. Importe:

```bash
npm run bootstrap:2026
```

O importador usa HTTPS. Ele **não depende de saída TCP 5432/6543**.

### Usuários Auth

O importador reconcilia usuários por e-mail. Usuários que já existirem são reutilizados. Para contas novas, é gerada uma senha temporária forte e o arquivo local abaixo é criado:

```text
var/bootstrap/bootstrap-2026-users.credentials.csv
```

Esse arquivo é ignorado pelo Git e deve ser tratado como credencial sensível. Os hashes de senha do projeto antigo não fazem parte da carga canônica.

### Triggers durante a carga

Cada lote de importação desabilita apenas `TRIGGER USER` da tabela dentro da mesma transação SQL. Assim, a carga inicial não gera logs/auditorias artificiais, mas as constraints e relações do banco continuam sendo verificadas. Os triggers são reativados antes do `COMMIT`.
