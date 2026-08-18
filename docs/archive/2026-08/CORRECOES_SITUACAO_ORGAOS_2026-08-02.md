# Correções da situação dos órgãos — 2026-08-02

## Objetivo

Tornar a visão administrativa dos órgãos mais clara sem alterar a máquina de estados dos diagnósticos.

## Alterações aplicadas

### Acompanhamento

O estado técnico `validated` continua sendo exibido como **Diagnóstico concluído**, mas sua macrofase no Kanban passa a ser **Acompanhamento**. O termo **Consolidação** foi removido desse fluxo.

### Situação agregada

A situação geral do formulário não usa mais uma prioridade que escondia fases diferentes.

- Todos em preparação: **Em preparação**.
- Todos em resposta ou correção: **Em aplicação**.
- Todos enviados ou em validação: **Em validação**.
- Todos com diagnóstico concluído: **Em acompanhamento**.
- Todos encerrados: **Encerrado**.
- Toda a coleta pausada: **Suspenso**.
- Fases diferentes ou suspensão parcial: **Situações mistas**.

A suspensão continua sendo uma condição operacional e não altera `cycles.state`.

### Indicadores

O painel diferencia:

- **Órgãos vinculados**: total no formulário e período selecionados, independentemente dos filtros visuais.
- **Órgãos exibidos**: total correspondente aos filtros atuais.
- **Com prazo vencido**: total vencido dentro do conjunto atualmente exibido.

### Filtro de coleta

Foi incluído o filtro:

- Todas;
- Ativa;
- Suspensa.

O filtro é persistido no parâmetro `collection` da URL e pode ser combinado com busca, organização, situação e prazo.

### Período compartilhado (`periodId`)

A identidade do período no quadro `/admin/ciclos` passou a ser `periodId`
(UUID de `form_periods`). O parâmetro `periodLabel` permanece apenas como
compatibilidade de leitura. Com `periodId` definido, a listagem usa todos os
ciclos do período (um por órgão) e não depende de
`selectLatestCyclePerOrganization` para desfazer mistura de rótulos.

## Regras preservadas

- Cada órgão possui um diagnóstico independente.
- Suspender a coleta não altera o estado do diagnóstico.
- Diagnóstico suspenso não é contado como vencido.
- O filtro “Com ação do respondente” considera somente coleta ativa.
- Nenhuma migration foi adicionada ou alterada.
