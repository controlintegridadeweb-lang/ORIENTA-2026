> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Correções da auditoria profunda

Data da consolidação: 12 de julho de 2026.

## Escopo

Este documento registra as correções aplicadas após a auditoria de autorização, auditoria de dados, regras de negócio, datas, autenticação, navegação, escalabilidade, validação e manutenibilidade do ORIENTA.

## Correções aplicadas

### 1. Plano de ação restrito ao respondente

- Removida a rota administrativa de gravação de planos de ação.
- Removido o caminho de escrita administrativa do cliente e dos componentes.
- Separados os serviços de consulta, comando do respondente e supervisão administrativa.
- Revogados `INSERT`, `UPDATE` e `DELETE` diretos da tabela `action_plans` para o papel `authenticated`.
- Mantida ao administrador somente a criação de notas na tabela `action_plan_supervision_notes`.
- Criada a RPC transacional `save_respondent_action_plan`, que valida usuário, perfil, organização, recomendação, estado operacional e conteúdo antes da mutação.

### 2. Autoria confiável na auditoria

- A gravação do plano passou a registrar o usuário real dentro da mesma transação da alteração.
- A atualização do cronograma do ciclo passou para a RPC `update_cycle_schedule`.
- As RPCs chamam `set_audit_actor` antes da mutação, na mesma transação.
- Os testes SQL de auditoria foram atualizados para verificar reabertura e alteração do cronograma.

### 3. Datas institucionais sem deslocamento de fuso

- Criada uma camada única de datas de calendário em `src/lib/datetime/business-date.ts`.
- Datas `YYYY-MM-DD` deixaram de ser interpretadas como instantes UTC.
- Formatação, comparação, adição de dias e cálculo de SLA usam o fuso institucional `America/Fortaleza`.
- Corrigido o caso em que, após 21h locais, a aplicação considerava o dia UTC seguinte.
- Nomes de arquivos CSV passaram a usar a data institucional.

### 4. Observações operacionais separadas da supervisão

- A coluna `supervisor_notes` foi substituída por `execution_notes` na estrutura ainda não aplicada.
- Observações do respondente são persistidas em `execution_notes`.
- Comentários administrativos permanecem exclusivamente em `action_plan_supervision_notes`.
- Mapeadores, histórico e interfaces foram alinhados à nova semântica.

### 5. Validação de entrada endurecida

- Textos agora são normalizados com `trim`.
- Ação, responsável e setor possuem limites mínimos e máximos.
- Datas precisam ser datas reais no formato `YYYY-MM-DD`.
- Cancelamento exige justificativa.
- O schema rejeita campos desconhecidos.
- Foram adicionadas constraints equivalentes no PostgreSQL para impedir bypass da API.

### 6. Deep links preservados no login

- O middleware preserva caminho e query string completos.
- O formulário encaminha o destino original para a action de autenticação.
- O servidor valida o redirecionamento e aceita somente rotas internas compatíveis com o perfil.
- URLs externas, caminhos relativos malformados e tentativas de open redirect são rejeitados.

### 7. Login sem seleção pública de organização

- Removido o seletor de organização da tela de login.
- A organização do respondente é obtida do perfil autenticado.
- O administrador permanece global e não precisa selecionar uma organização artificial.
- O catálogo de organizações deixou de ser exposto antes da autenticação.

### 8. Erros de perfil não são mais mascarados como logout

- Ausência de sessão, perfil inexistente e falha de infraestrutura agora são estados distintos.
- Erros de banco ao carregar o perfil não retornam mais silenciosamente como usuário deslogado.
- Rotas de API retornam `503` para falhas de infraestrutura e `403` para perfil inexistente ou inválido.

### 9. Monitoramento administrativo sem teto oculto

- Removido o limite silencioso de 2.000 registros no navegador.
- Criados endpoints específicos de monitoramento para recomendações e planos de ação.
- Filtros, resumos, paginação por registros, paginação por organização e exportação são processados no servidor.
- A interface recebe somente a página solicitada.
- Exportações usam o conjunto integral filtrado, sem depender da página visível.
- Células CSV iniciadas por `=`, `+`, `-` ou `@` são neutralizadas contra formula injection.

### 10. Contagem de múltiplas ações

- A visão administrativa passou a preservar `recommendationActionCount` após a expansão das linhas.
- O indicador de múltiplas ações agora recebe a quantidade real da recomendação.

### 11. Histórico do responsável

- O parser de auditoria passou a comparar `responsible_label`, campo realmente persistido.
- Alterações de responsável agora aparecem com o rótulo específico, em vez de atualização genérica.

### 12. Limpeza arquitetural

- Excluído o antigo `ActionPlansAdminService`, que misturava responsabilidades e perfis.
- Criados `ActionPlansQueryService` e `RespondentActionPlanCommandService`.
- Removidos hook de carregamento integral, rota administrativa obsoleta e utilitários de login sem uso.
- Removidas referências antigas a `supervisor_notes` e caminhos alternativos de escrita.

## Testes de regressão adicionados

Foram adicionados ou ampliados testes para:

- data institucional e virada UTC às 21h em Fortaleza;
- validação de datas e campos vazios;
- redirecionamento seguro após login;
- comando exclusivo do respondente;
- atualização de ciclo por RPC;
- paginação com mais de 2.000 registros;
- paginação por organização;
- exportação integral;
- filtro exato por eixo;
- contagem de múltiplas ações;
- alteração de responsável no histórico;
- separação de observações operacionais;
- proteção de CSV contra formula injection.

## Resultado dos checks executados

| Verificação | Resultado |
|---|---:|
| TypeScript (`npm run typecheck`) | Aprovado |
| ESLint (`npm run lint`) | Aprovado, sem avisos |
| Código morto (`npm run check:dead-code`) | Aprovado |
| Complexidade (`npm run check:complexity`) | Aprovado |
| Testes (`npm run test`) | 114 arquivos e 495 testes aprovados |
| Cobertura — statements | 73,19% |
| Cobertura — branches | 60,72% |
| Cobertura — functions | 81,57% |
| Cobertura — lines | 77,86% |
| Build Next.js de produção | Aprovado; 36 páginas geradas |
| Auditoria de dependências (`npm audit`) | 0 vulnerabilidades conhecidas |

## Validações dependentes de infraestrutura

O ambiente desta execução não possui Docker, PostgreSQL local nem variáveis de conexão com o Supabase. Por isso, não foram executados em runtime:

- `supabase db reset`;
- aplicação real das migrations;
- verificações SQL/RLS contra PostgreSQL;
- geração e comparação dos tipos diretamente do banco;
- Playwright E2E dependente do ambiente Supabase.

Os scripts e verificações SQL correspondentes foram atualizados, mas precisam ser executados no ambiente do projeto antes da implantação.
