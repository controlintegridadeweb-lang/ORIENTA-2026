> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Auditoria profunda dos fluxos entre perfis — 16/07/2026

## Objetivo

Revisar novamente, a partir do código real, a coerência da navegação e do fluxo operacional entre **administrador** e **respondente**, incluindo páginas, menus, estados do diagnóstico, permissões, deep links, contratos de API, preservação de contexto e integridade no banco.

A análise não tratou a existência de uma rota como prova suficiente de coerência. Cada transição foi confrontada com a regra de domínio, a autorização do servidor e o comportamento apresentado na interface.

## Resultado executivo

Esta versão revalida o inventário e as garantias do projeto após as correções de coesão textual, configuração de autenticação e relatório oficial realizadas em 16/07/2026.

Após as correções consolidadas nesta versão, não permaneceram incoerências estáticas ou contratuais conhecidas entre os perfis no escopo verificável por TypeScript, lint, testes, build, análise de rotas, complexidade e código morto.

O fluxo consolidado ficou assim:

1. o administrador estrutura, atribui e publica o formulário;
2. o administrador cria e abre o diagnóstico;
3. apenas o respondente preenche, envia e reenvia respostas e evidências;
4. apenas a fila administrativa decide evidências, solicita ajustes e conclui a validação;
5. a conclusão da validação materializa FAMI, snapshots e recomendações e libera o plano de ação;
6. o respondente registra as ações necessárias;
7. o administrador supervisiona o plano e encerra o ciclo quando a prontidão estiver satisfeita;
8. o FAMI permanece congelado e o diagnóstico continua acessível no histórico do respondente.

## Mapa auditado

- **43 páginas** do App Router;
- **85 rotas de API**;
- **26 páginas administrativas**;
- **14 páginas do respondente**;
- **3 páginas públicas ou de autenticação**;
- **44 APIs administrativas**;
- **9 APIs exclusivas do respondente**;
- **17 APIs compartilhadas ou neutras**;
- **0 destino literal de página/API inexistente**;
- **0 conflito entre namespace da API e papel autorizado**.

## Correções de coesão revalidadas em 16/07/2026

- indicadores do resumo executivo passaram a usar **Resultado FAMI** e **Ações registradas**, compatíveis com os valores exibidos;
- a conclusão do PDF deixou de tratar ausência de evidências como pendência automática e deixou de recomendar validação após o diagnóstico concluído;
- a metodologia FAMI passou a separar explicitamente resposta “Não” de resposta “Sim” com evidência exigida ausente, pendente ou não aprovada;
- o termo visível **Plano de ação** foi padronizado em menus, cabeçalhos, breadcrumbs, mensagens, relatórios e documentação;
- foram adicionados testes de contrato para proteger a ordem do relatório, os textos de conclusão, a metodologia e o vocabulário oficial.

## Correções realizadas nesta auditoria

### 1. Propriedade das transições do diagnóstico

A rota administrativa genérica ainda permitia alcançar transições que pertencem ao respondente. Isso criava um caminho alternativo capaz de avançar o diagnóstico sem passar pela conferência de respostas e evidências obrigatórias.

Correções:

- envio inicial e reenvio após ajuste foram classificados como transições exclusivas do respondente;
- a API administrativa retorna conflito ao receber essas arestas;
- transições originadas em `in_validation` para ajuste ou consolidação ficaram exclusivas da fila de validação;
- os botões administrativos deixaram de oferecer ações incompatíveis com a responsabilidade do perfil;
- os testes de workflow, serviço, rota e componente passaram a cobrir essa separação.

### 2. Prontidão real do envio pelo respondente

O resumo de “Meus diagnósticos” não utilizava integralmente a mesma regra aplicada no envio real. A interface podia sugerir prontidão com base em contagens insuficientes.

Correções:

- criada uma avaliação única de progresso de envio no domínio;
- respostas obrigatórias, aplicabilidade e evidências exigidas passaram a compor a mesma decisão;
- o dashboard recebe `submissionReady` e a quantidade real de bloqueios;
- CTA, badge e mensagem de pendência foram alinhados ao backend;
- o caso sem critérios aplicáveis recebeu tratamento explícito.

### 3. Preservação do histórico de atribuição

Era possível remover de um formulário uma organização que já possuía diagnóstico. Isso podia fazer o contexto desaparecer de algumas telas, embora evidências, recomendações e relatórios continuassem existentes.

Correções:

- a interface bloqueia a desmarcação de organizações com diagnóstico;
- a API devolve quais vínculos estão bloqueados por histórico;
- o serviço rejeita remoções diretas ou concorrentes;
- a migration canônica passou a impedir a exclusão no banco;
- a RPC de criação do ciclo bloqueia a atribuição durante a transação com `FOR KEY SHARE`, eliminando a corrida entre criação do diagnóstico e remoção do vínculo;
- foi criado o verificador SQL `form_assignment_cycle_history.sql`.

Como o schema ainda não foi aplicado, a regra foi incorporada às migrations canônicas responsáveis, sem criar migration corretiva ou remendo posterior.

### 4. Supervisão do plano de ação no estado correto

A interface administrativa associava a supervisão das ações ao estado `in_validation`, mas recomendações e plano só existem após a consolidação em `validated`.

Correções:

- a nomenclatura `canValidate` foi restringida para `canValidateEvidence`;
- validação de evidências e supervisão de ações deixaram de compartilhar o mesmo significado;
- textos administrativos passaram a distinguir pareceres/aprovações do plano da validação de evidências;
- links de validação de evidência aparecem apenas no estado em que essa operação é válida.

### 5. Coerência dos namespaces e papéis das APIs

Algumas operações compartilhadas estavam publicadas em namespaces de um perfil específico, enquanto aceitavam outro papel.

Correções:

- snapshot FAMI saiu de `/api/admin/fami/snapshot` para `/api/fami/snapshot`;
- edição do próprio perfil saiu de `/api/respondent/profile` para `/api/profile`;
- solicitação de exceção institucional foi movida para `/api/respondent/library/exceptions`;
- rotas de evidências sob `/api/respondent` passaram a aceitar somente respondente;
- a rota administrativa de exceções passou a aceitar somente administrador;
- clientes e componentes foram atualizados para os caminhos canônicos;
- a varredura final não encontrou namespace administrativo aceitando respondente nem namespace do respondente aceitando administrador.

### 6. Integridade das exceções institucionais

A solicitação de exceção aceitava identificadores que poderiam pertencer a contextos diferentes. Além disso, uma decisão já concluída podia ser sobrescrita por nova aprovação ou rejeição.

Correções:

- o serviço confirma que recomendação e organização pertencem ao mesmo diagnóstico;
- quando informado, o critério deve corresponder ao critério da recomendação;
- campos de decisão não persistidos deixaram de ser silenciosamente descartados;
- a decisão atualiza somente registros ainda em `requested`;
- uma segunda decisão gera conflito e preserva responsável e data originais;
- triggers canônicos reforçam escopo e terminalidade no PostgreSQL;
- foi criado o verificador SQL `recommendation_exception_scope.sql`;
- sete testes de serviço cobrem escopo válido, cruzamento de organização, critério incorreto, inexistência, decisão válida, repetição e contrato estrito.

### 7. Histórico concluído e orientação textual

Depois da inclusão de diagnósticos `completed` em “Meus diagnósticos”, ainda existiam textos dizendo que o histórico ficava apenas em “Relatórios e Histórico”.

Correções:

- dashboard, hero de formulários, cabeçalhos e dicas passaram a informar que diagnósticos concluídos permanecem em “Meus diagnósticos”;
- relatórios ficaram descritos como local dos PDFs oficiais, não como único local do histórico;
- o CTA do diagnóstico concluído mantém acesso direto ao Resultado FAMI;
- capitalização e nomenclatura do menu foram padronizadas.

### 8. Navegação entre recomendações e plano de ação

Foi verificado se abrir uma recomendação a partir do portfólio deveria manter o item no módulo “Recomendações” ou avançar para “Plano de ação”.

A transição atual foi mantida porque é coerente com a ação executada:

- “Cadastrar ações” e “Continuar” abrem o workspace operacional do plano;
- o menu e o breadcrumb passam a indicar “Plano de ação”;
- `returnTo` preserva diagnóstico, eixo, status, busca e paginação da origem;
- o cabeçalho oferece retorno explícito a “Recomendações” ou “Plano de ação” conforme a lista de origem;
- caminhos externos ou detalhes arbitrários são rejeitados pelo sanitizador.

Criar uma segunda rota de detalhe somente para manter o menu anterior duplicaria a superfície sem acrescentar regra de negócio.

## Correções da auditoria anterior revalidadas

Também foram rechecadas e permaneceram corretas:

- consulta exata do detalhe por `recommendationId`, sem `items[0]`;
- isolamento da recomendação pela organização do respondente;
- exportação de evidências preservando `cycleId` e `questionId`;
- contrato único de filtros para lista, indicadores e exportação;
- diagnóstico concluído visível no histórico do respondente;
- encerramento do ciclo bloqueado enquanto houver recomendação não dispensada sem ação válida;
- FAMI oficial disponível a partir de `validated`, sem depender do plano de ação;
- plano de ação editável após o encerramento;
- guardas de layout para `/admin` e `/respondente`;
- sanitização dos caminhos de retorno.

## Validação executada

| Verificação | Resultado |
|---|---:|
| TypeScript (`tsc --noEmit`) | aprovado |
| ESLint | aprovado, zero avisos |
| Vitest | **151 arquivos** / **672 testes aprovados** |
| Cobertura de statements | não reexecutada nesta correção |
| Cobertura de branches | não reexecutada nesta correção |
| Cobertura de funções | não reexecutada nesta correção |
| Cobertura de linhas | não reexecutada nesta correção |
| Build limpo de produção | aprovado |
| Páginas processadas na geração estática do build | 42 |
| Código morto (`knip`) | nenhuma ocorrência |
| Limites de complexidade | aprovados |
| Arquivos analisados pela complexidade | 830 |
| Linhas de código analisadas | 88.664 |
| Descoberta da suíte Playwright | 6 cenários reconhecidos |
| Rotas literais inexistentes | 0 no inventário estático revalidado |
| Conflitos papel/namespace de API | 0 no inventário estático revalidado |

## Limitações objetivas da validação local

As verificações dependentes de PostgreSQL/Supabase real não puderam ser executadas neste ambiente porque não havia:

- `DATABASE_URL`, `SUPABASE_DB_URL` ou `POSTGRES_URL`;
- Docker;
- cliente `psql`;
- stack Supabase local preparada com usuários e Storage E2E.

Por esse motivo:

- `check:generated-types` foi iniciado e interrompeu corretamente informando ausência da URL do PostgreSQL;
- os verificadores SQL novos foram revisados, mas não executados contra banco real;
- o Playwright reconheceu os seis cenários, mas a jornada E2E real não foi executada.

A execução completa em infraestrutura deve seguir o README: reset local do Supabase, geração/conferência de tipos, `db:verify`, preparação E2E e `test:e2e`.

## Estado final

No escopo executado nesta auditoria, não foi encontrada incoerência remanescente conhecida entre navegação, responsabilidades dos perfis, estados do diagnóstico, contratos de API, preservação de contexto e linguagem oficial da interface e do relatório.

Permanece pendente a validação operacional com Supabase local ou de homologação, para provar as garantias SQL e a jornada completa com autenticação, RLS e Storage reais.


## Inventário automatizado da versão corrigida

| Verificação | Resultado versionado |
|---|---:|
| App Router | **43 páginas** |
| APIs | **85 rotas de API** |
| Vitest | **151 arquivos** / **672 testes aprovados** |

A contagem acima é protegida por teste de contrato e deve ser atualizada junto com qualquer criação ou remoção de página, rota ou arquivo de teste. O total de testes executados pode crescer dentro dos mesmos arquivos; o contrato automatizado protege a quantidade de arquivos, enquanto o total de casos deve refletir a última execução integral registrada.
