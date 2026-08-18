# ORIENTA — Aprimoramento de Clean Code e manutenibilidade

**Data:** 2 de agosto de 2026  
**Origem:** `ORIENTA-seguranca-corrigida-20260802.zip`

## Objetivo

Reduzir o custo de mudança nos fluxos administrativos e do respondente sem
alterar regras de domínio, contratos públicos, FAMI, migrations ou segurança.
A intervenção priorizou unidades que estavam próximas do orçamento máximo de
complexidade.

## Resultado

| Unidade principal | Antes | Depois |
|---|---:|---:|
| `FormManagementShell` | 437 linhas | 51 linhas |
| `useValidationWorkspaceController` | 486 linhas | 235 linhas |
| `FormQuestionsConfigurator` | 446 linhas | 98 linhas |
| `NotApplicableCard` | 426 linhas | 192 linhas |
| `AdminActionPlanSupervisionWorkspace` | 466 linhas | 323 linhas |
| `useWorkbenchAnswerFlow` | 427 linhas | 96 linhas |
| `useWorkbenchEvidence` | 414 linhas | 61 linhas |

A maior função produtiva caiu de **402** para **370 linhas**. A jornada E2E
canônica permanece com 500 linhas por representar um único cenário operacional
completo.

O total de linhas manuais aumentou de 127.222 para 128.245. Esse crescimento é
intencional: responsabilidades antes comprimidas em funções extensas passaram a
ter contratos, nomes e módulos próprios. Não houve duplicação deliberada de
regra de negócio.

## Separações aplicadas

### Gestão de formulário

A shell passou a coordenar somente:

- cabeçalho;
- visão geral;
- organizações;
- ações administrativas;
- histórico.

Campos de reabertura, escopo, prazo e critérios ficaram em componentes
especializados.

### Validação administrativa

O controlador foi dividido em:

- navegação, URL, paginação e filtros;
- estado dos critérios e foco da próxima pendência;
- envio de ajustes e conclusão/FAMI;
- decisões individuais e lote.

### Configuração de perguntas

Foram separados:

- carregamento de catálogo, perguntas, organizações e dispensas;
- mutações de criação, edição, remoção e ordenação;
- renderização da lista;
- configurações e aplicabilidade já existentes.

### “Não se aplica”

O card passou a separar:

- estado e comandos da decisão;
- revisão de classificação administrativa;
- formulário de aceite ou rejeição;
- apresentação do critério e documentos originais.

### Supervisão do plano de ação

Auditoria, timeline e evidências vinculadas foram movidas para um hook de dados.
A tela ficou responsável apenas pela composição e navegação.

### Workbench do respondente

O fluxo de respostas foi dividido em:

- estado de validação local;
- persistência transacional;
- seleção de resposta;
- envio em lote antes da submissão.

O fluxo de evidências foi dividido em:

- rascunhos;
- remoção e descarte de uploads temporários;
- upload e limite de anexos;
- orquestração pública do hook.

## Guardrail atualizado

O `check:complexity` agora bloqueia:

- arquivo manual acima de 600 linhas;
- função produtiva acima de **375 linhas**;
- jornada E2E acima de **500 linhas**;
- mais de 10 `useState` ou 6 `useEffect` por unidade.

Não se deve aumentar esses limites para acomodar crescimento. A correção é
separar responsabilidades.

## Verificações executadas

```text
✓ check:architecture
✓ check:complexity
✓ check:security-sync
✓ db:audit:migrations
✓ 17 domínios sem ciclos
✓ imports entre features somente por APIs públicas
✓ 30 migrations canônicas
✓ 169 funções públicas sem duplicidade
```

## Limitação do ambiente

Não foi possível executar lint, typecheck, Vitest, build, Supabase e Playwright
porque o pacote não contém `node_modules` e o ambiente não dispõe das
dependências completas. Essas etapas continuam obrigatórias antes da produção.
