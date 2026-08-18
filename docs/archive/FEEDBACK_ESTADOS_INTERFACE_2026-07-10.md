> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Feedback de estados da interface — 2026-07-10

## Objetivo

Padronizar o retorno visual das operações assíncronas da plataforma, distinguindo de forma explícita os estados de carregamento, falha, ausência legítima de dados, conteúdo carregado e confirmação de sucesso.

## Correções aplicadas

### Estado reutilizável de erro

Foi criado `src/components/ui/async-error-state.tsx`, com:

- mensagem contextual;
- ação local de nova tentativa;
- estado pendente durante o retry;
- `role="alert"` e `aria-live="assertive"`;
- integração com o componente canônico `LoadingButton`.

### Evidências do respondente

- Erros da listagem deixaram de ser descartados.
- Indicadores não usam mais zero como fallback para falha de rede.
- O selo de normalidade não é exibido quando os indicadores não foram confirmados.
- Estados `loading`, `error`, `empty` e `content` são tratados separadamente.
- Atualizações que falham preservam dados anteriores com aviso de possível desatualização.
- A recuperação mantém os filtros atuais.

### Evidências administrativas

- A listagem passou a expor erro e ação de retry.
- Filtros, KPIs e listagem possuem estados independentes.
- Falha de atualização não apaga dados já carregados.
- Empty state só é apresentado após leitura válida sem resultados.

### Supervisão do plano de ação

- Auditoria, linha do tempo e evidências possuem estados independentes de loading e erro.
- Falha de API não é mais apresentada como ausência de registros.
- Cada painel oferece nova tentativa local.
- Métricas não confirmadas usam estado indisponível, em vez de valores falsos.

### Confirmação das mutações

Foram padronizados loading, bloqueio contra clique duplicado e confirmação de sucesso em:

- criação e transição de diagnósticos;
- atualização do cronograma;
- atribuição de organizações;
- validação de evidências;
- consolidação do diagnóstico;
- operações da biblioteca;
- edição de perfil;
- dispensa por organização;
- feed institucional do plano de ação.

Os fluxos usam toast para confirmação global ou mensagem inline contextual, evitando duplicar a mesma informação nos dois canais.

### Acessibilidade

- Botões assíncronos usam `aria-busy` por meio de `LoadingButton`.
- Erros dinâmicos relevantes usam `role="alert"` e `aria-live="assertive"`.
- Loaders preservam anúncio de status.
- Ações de retry possuem texto explícito.

## Testes adicionados

Foram incluídos testes de regressão para:

- estado visual de erro reutilizável;
- falha e recuperação dos indicadores do respondente;
- falha e recuperação da lista administrativa de evidências;
- ausência de KPIs falsos durante erro;
- loading e confirmação dos vereditos de evidência;
- loading e confirmação da consolidação do diagnóstico.

## Validação final

| Gate | Resultado |
|---|---:|
| TypeScript | Aprovado |
| ESLint | Aprovado, sem warnings |
| Código morto | Aprovado |
| Complexidade | Aprovada |
| Arquivos de teste | 97/97 aprovados |
| Testes | 445/445 aprovados |
| Cobertura de linhas | 77,51% |
| Cobertura de branches | 60,06% |
| Build de produção | Aprovado |
| Páginas estáticas | 35/35 geradas |

## Limites desta etapa

A validação cobre código, componentes, testes unitários e build. A confirmação visual completa em navegador, incluindo foco, contraste e comportamento com leitores de tela reais, deve permanecer no roteiro de homologação E2E/acessibilidade.
