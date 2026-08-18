> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Correções de integridade — 16/07/2026

## Escopo

Esta revisão eliminou os bloqueios encontrados na auditoria do fluxo de “Não se
aplica”, no pipeline de qualidade e na estratégia de migrations canônicas.

## Correções aplicadas

- contratos TypeScript de resposta N/A alinhados entre coleta, workbench e
  componentes;
- persistência da justificativa N/A corrigida no upsert canônico, inclusive em
  edições posteriores;
- alteração da justificativa aprovada reinicia o veredito para `pending` e limpa
  os dados da validação anterior;
- aprovação administrativa mantém a resposta como N/A;
- rejeição administrativa converte a resposta para “Não”, preserva o conteúdo
  original nas observações e permite a geração de recomendação;
- consolidação bloqueada enquanto existir evidência ou resposta N/A pendente;
- snapshots de encerramento passam a registrar a justificativa N/A;
- regra declarada diretamente nas migrations canônicas responsáveis (`0001`, `0006`, `0010` e `0014`);
- código morto removido e painel do respondente separado em componentes menores;
- inventário técnico e documentação de migrations atualizados;
- cenário E2E ampliado para aprovação e rejeição de N/A;
- verificador SQL `supabase/verify/not_applicable_validation.sql` adicionado.

## Validação executada

| Verificação | Resultado |
|---|---:|
| ESLint | aprovado, sem warnings |
| TypeScript | aprovado |
| Testes Vitest | 141 arquivos e 644 testes aprovados |
| Cobertura | 75,33% statements; 62,41% branches; 84,65% funções; 79,58% linhas |
| Código morto | aprovado |
| Complexidade | aprovado, sem alertas |
| Build Next.js | aprovado |
| Descoberta Playwright | 6 cenários reconhecidos |
| Auditoria de dependências de produção | 0 vulnerabilidades |

## Limite da validação local

O ambiente desta revisão não contém Docker, Supabase CLI nem `psql`. Por isso,
o reset real do banco, os verificadores SQL e a execução integral do Playwright
contra Supabase local não foram simulados nem declarados como executados. Os
artefatos foram adicionados e validados estaticamente; a comprovação de banco e
E2E deve ocorrer no ambiente oficial com os comandos documentados em
`docs/MIGRATIONS_CANONICAS.md`.
