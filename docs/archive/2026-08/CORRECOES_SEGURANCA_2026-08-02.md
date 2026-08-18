# Correções de segurança — 2 de agosto de 2026

## Escopo

Esta revisão corrige os riscos identificados em autenticação, MFA, CSRF,
auditoria, uso de credenciais privilegiadas, rate limiting, CSP e automações.
A baseline permanece em `0001`–`0030`; nenhuma migration foi aplicada em
ambiente compartilhado.

## Correções aplicadas

- removida a rota de reset autônomo do MFA acessível por sessão `aal1`;
- criado procedimento operacional de recuperação do MFA com simulação por
  padrão, confirmação independente, motivo, referência, operador e eventos de
  início, falha e conclusão em auditoria append-only;
- adicionada proteção CSRF explícita para mutações autenticadas por cookie,
  validando `Origin` e Fetch Metadata;
- login transferido para rota server-side com rate limit persistente por
  conta+rede e por rede, respostas sem cache e mensagens sem detalhes internos;
- recuperação de senha protegida por limites persistentes e resposta que não
  confirma a existência da conta;
- leitura de papel e organização na autorização feita com a própria sessão do
  usuário e RLS, sem `service_role`;
- auditorias `audit_logs` e `library_audit_events` tornadas append-only também
  para `service_role`, com triggers e grants mínimos;
- privilégios `INSERT`, `UPDATE`, `DELETE` e `TRUNCATE` revogados de
  `authenticated` por padrão;
- comparação de `CRON_SECRET` endurecida com SHA-256 e `timingSafeEqual`;
- CSP de estilos separada entre elementos com nonce e atributos inline
  necessários;
- rota de reconciliação FAMI alinhada ao wrapper comum de MFA, CSRF, rate limit
  e tratamento de erros;
- guardrails e verificações SQL ampliados para bloquear regressões.

## Estado estrutural validado

- 30 migrations contínuas (`0001`–`0030`);
- 169 funções públicas sem redefinição;
- 46 tabelas públicas com RLS no contrato do projeto;
- 43 páginas, 95 rotas de API e 222 arquivos Vitest;
- grafo de 17 domínios sem ciclos proibidos;
- sintaxe TypeScript/TSX, JavaScript/MJS, JSON e YAML aprovada;
- verificadores de segurança, arquitetura, complexidade e migrations aprovados.

## Validação pendente de ambiente

A aprovação para produção ainda exige execução em ambiente com dependências,
Supabase e PostgreSQL disponíveis:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build

supabase db reset --local
npm run db:greenfield
npm run db:verify
npm run check:generated-types
npm run test:e2e
```

Também devem ser testados em homologação: Auth real, AAL2, recuperação operacional
do MFA, RLS multi-tenant, Storage privado, validação estrutural de uploads, CSRF, rate limits e bloqueio de
alteração/exclusão das trilhas de auditoria.
