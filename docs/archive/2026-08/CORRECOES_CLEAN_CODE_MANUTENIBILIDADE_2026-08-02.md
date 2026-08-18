# ORIENTA — Correções de Clean Code e manutenibilidade

**Data da revisão:** 2 de agosto de 2026  
**Pacote de origem:** `ORIENTA-arquitetura-clean-code-corrigida-20260801.zip`  
**Escopo:** arquitetura interna, coesão, acoplamento, complexidade, estado React, contratos HTTP, scripts operacionais, testes e manutenção da baseline SQL.

## 1. Resultado executivo

A revisão anterior identificou que os guardrails verdes ainda permitiam funções extensas, imports profundos entre domínios, um ciclo interno de módulos, respostas HTTP confiadas por casting e uma migration administrativa de 10.506 linhas.

As correções foram aplicadas no código real. O estado final possui:

- grafo acíclico de **17 domínios e 33 dependências**;
- **zero imports profundos** entre features;
- **zero ciclos** entre módulos TypeScript;
- **zero usos produtivos** de `as unknown as`;
- **zero respostas HTTP** convertidas por casting;
- **93 leituras HTTP** protegidas por schemas executáveis;
- redução de `useState` produtivo de **205 para 134**;
- redução das desativações de `react-hooks/set-state-in-effect` de **48 para 32**;
- nenhum arquivo manual acima de **600 linhas**;
- nenhuma função produtiva acima de **375 linhas**;
- auditoria de complexidade abrangendo `src`, `scripts` e `e2e`;
- baseline SQL dividida em **30 migrations coesas**, sem alterar a ordem lógica dos comandos;
- maior migration reduzida de **10.506 para 1.785 linhas**;
- **222 arquivos Vitest** em `src`.

## 2. Fronteiras entre domínios

### Problema anterior

Havia 94 imports profundos entre features. Um domínio importava diretamente serviços, tipos, componentes e hooks internos de outro domínio. Isso tornava reorganizações locais perigosas e invalidava a ideia de API pública.

### Correção

Foram criadas ou consolidadas APIs públicas `index.ts` para os domínios que fornecem contratos a outras features. Todos os imports cruzados agora apontam apenas para essas entradas públicas.

O `check:architecture` passou a bloquear:

- imports profundos de outra feature;
- dependências invertidas entre camadas;
- ciclos entre features;
- ciclos entre arquivos TypeScript;
- imports locais sem destino;
- recriação de camadas obsoletas;
- coerções duplas no código produtivo;
- respostas HTTP confiadas por generic ou casting.

## 3. Ciclo interno de `respondent-progress`

O ciclo formado pelo barrel público e módulos internos foi eliminado. Módulos da própria feature usam contratos locais diretos; consumidores externos usam somente a API pública. O grafo completo de módulos TypeScript está acíclico.

## 4. Componentes e hooks monolíticos

Foram decompostos os principais pontos identificados na auditoria:

- `CreateCycleForm` caiu de aproximadamente 572 para 82 linhas;
- `ReportsShell` caiu de aproximadamente 593 para 34 linhas;
- `useWorkbench` foi dividido em recursos, submissão, ações de seção, Realtime e navegação;
- evidências do respondente foram separadas em ação e histórico;
- ações de ciclo passaram a usar controlador próprio;
- histórico da gestão de formulários foi extraído;
- ações em lote do dashboard foram extraídas;
- importação histórica separou persistência/verificação da orquestração.

O guardrail usa a AST do TypeScript e mede arquivo, função, `useState` e `useEffect`, em vez de depender somente de contagem textual.

Limites atuais:

- arquivo manual em `src`: 600 linhas;
- script operacional: 600 linhas;
- função produtiva: 375 linhas;
- jornada E2E: 500 linhas;
- até 10 `useState` e 6 `useEffect` por unidade auditada.

## 5. Estado React

Seis módulos que ultrapassavam o limite de estado local foram corrigidos com modelos coesos e atualização parcial tipada por `usePatchState`.

O objetivo não foi esconder o número de hooks em um wrapper genérico. Cada estado consolidado representa um contexto único da tela, com contrato explícito e atualizações agrupadas.

Resultado:

| Métrica | Antes | Depois |
|---|---:|---:|
| `useState` produtivo | 205 | 134 |
| `useEffect` produtivo | 114 | 115 |
| Desativações de `set-state-in-effect` | 48 | 32 |

O número de efeitos permaneceu praticamente estável porque sincronização de visibilidade, URL, Realtime e cancelamento de requisições continua sendo comportamento real. Não foram removidos efeitos necessários apenas para melhorar uma métrica.

## 6. Contratos HTTP em runtime

### Problema anterior

Existiam 83 usos de `parseJson<T>()`, além de respostas convertidas com `response.json() as Tipo`. O TypeScript aceitava qualquer JSON como se fosse um DTO válido.

### Correção

`parseJson` agora exige um `ZodType` e rejeita:

- corpo vazio;
- JSON malformado;
- contrato incompatível.

Foram adicionados contratos para ciclos, dashboard, automações, evidências, formulários, aplicabilidade, FAMI, relatórios, progresso do respondente, gestão da melhoria, perfil, MFA, notificações e workbench.

Também foram eliminadas coerções residuais em:

- edição de perfil;
- recadastro MFA;
- sino de notificações;
- aplicabilidade por organização;
- inicialização de upload assinado;
- carregamento e submissão do workbench.

Testes novos cobrem:

- resposta válida;
- corpo vazio;
- JSON malformado;
- payload incompatível;
- campos obrigatórios e opcionais dos contratos;
- contratos de mutação, lote e upload do workbench.

## 7. Coerções de banco e nulabilidade

Quatro coerções duplas produtivas foram removidas.

- Parâmetros `timestamptz` da RPC de programação de ciclos foram alinhados à nulabilidade real do PostgreSQL.
- Linhas de supervisão são validadas com Zod antes do mapeamento.
- Snapshots do relatório são validados antes de reconstruir o diagnóstico.
- O escopo operacional do ciclo é validado antes de compor autorização e formulário.

A autenticação também passou a retornar uma união discriminada. Depois de verificar o erro, o contexto autenticado deixa de precisar de `context!`.

## 8. Baseline SQL

O artefato monolítico anterior, já removido da baseline oficial, possuía 10.506 linhas e concentrava 92 funções, views, grants e comentários.

Ela foi dividida, preservando a ordem SQL, nas migrations canônicas `0016` a `0028`. As verificações passaram para `0029` e `0030`.

Resultado:

- 30 migrations contínuas, de `0001` a `0030`;
- 169 funções públicas sem redefinição;
- nenhum arquivo acima de 2.500 linhas;
- maior migration com 1.785 linhas;
- documentação, testes contratuais, auditoria e status greenfield atualizados.

**Decisão confirmada:** nenhuma migration foi aplicada em ambiente compartilhado. A baseline `0001`–`0030` substitui integralmente a sequência anterior antes da primeira implantação. Depois da primeira aplicação, esses arquivos tornam-se imutáveis e a evolução começa em `0031`.

## 9. Scripts operacionais

A importação histórica de respostas foi decomposta. A consulta de respostas, evidências e verificação pós-importação fica em `scripts/imports/lib/diagnostic-response-storage.mjs`.

O verificador de segurança foi atualizado para conferir a responsabilidade em ambos os módulos:

- carregamento da revisão persistida;
- envio de `p_expected_revision` para a RPC.

Assim, a decomposição não enfraqueceu a idempotência nem a concorrência otimista.

## 10. Cobertura e testes

O escopo obrigatório de cobertura foi ampliado de 30 para 68 entradas explícitas/globs, incluindo:

- contratos HTTP;
- infraestrutura de API;
- utilitários compartilhados;
- progresso do respondente;
- FAMI;
- evidências;
- gestão da melhoria;
- políticas de validação;
- workbench determinístico.

O projeto possui atualmente 222 arquivos Vitest em `src`, cinco testes Node.js de scripts e uma jornada Playwright canônica.

## 11. Guardrails executados com sucesso

```text
✓ Complexidade em 1.120 arquivos de src, scripts e e2e
✓ Nenhum arquivo manual acima do limite
✓ Nenhuma função acima do limite configurado
✓ Camadas arquiteturais válidas
✓ Imports locais resolvidos
✓ 17 features em grafo acíclico
✓ Módulos TypeScript em grafo acíclico
✓ Zero imports profundos entre features
✓ Zero coerções duplas produtivas
✓ Contratos HTTP validados em runtime
✓ Segurança e sincronização aprovadas
✓ 30 migrations canônicas
✓ 169 funções públicas sem duplicidade
✓ Sintaxe TypeScript/JavaScript válida em 1.120 arquivos
✓ JSON e YAML válidos
```

## 12. Validações bloqueadas pelo ambiente

Não foi possível executar a suíte dependente de instalação porque o pacote recebido não contém `node_modules` e o registry disponível não forneceu todas as dependências.

O `tsc` disponível interrompe antes de analisar o código por ausência dos type packages de Node, React, React DOM e bibliotecas auxiliares. Pelo mesmo motivo não foram executados:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:greenfield
npm run db:verify
npm run test:e2e
```

Essas etapas permanecem obrigatórias no CI com `npm ci` funcional, PostgreSQL/Supabase descartável e variáveis de ambiente de teste.

## 13. Veredito

As pendências concretas da segunda auditoria de Clean Code e manutenibilidade foram corrigidas no repositório. A aprovação obtida neste ambiente é estrutural e estática. Produção continua condicionada à execução limpa do CI completo e da baseline em banco vazio.

## 11. Aprimoramento adicional de coesão

Uma revisão posterior sobre o pacote de segurança reduziu três unidades que ainda concentravam responsabilidades:

- `FormManagementShell`: de **402** para **51 linhas**, com visão geral, organizações e ações administrativas separadas;
- `useValidationWorkspaceController`: de **398** para **235 linhas**, com navegação, estado dos critérios e encerramento/FAMI isolados;
- `FormQuestionsConfigurator`: de **396** para **98 linhas**, com carregamento, mutações e lista de perguntas separados.

- `NotApplicableCard`: de **392** para **192 linhas**, com controlador e painel de decisão separados;
- `AdminActionPlanSupervisionWorkspace`: de **394** para apresentação desacoplada do carregamento de auditoria, timeline e evidências;
- `useWorkbenchAnswerFlow`: de **389** para **95 linhas**, separando validação, persistência e seleção;
- `useWorkbenchEvidence`: de **384** para **60 linhas**, separando rascunhos, remoção e upload.

Os limites de função foram endurecidos de 420 para **375 linhas** e a jornada E2E de 520 para **500 linhas**. Os limites não devem ser aumentados para acomodar crescimento; a unidade deve ser decomposta por responsabilidade.
