> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Auditoria de limpeza profunda — ORIENTA

**Data da auditoria:** 4 de julho de 2026  
**Escopo:** `src/`, `scripts/`, `e2e/`, migrations e scripts de qualidade do repositório.

## Resultado executivo

Foram removidos os achados confirmados de código morto, compatibilidade legada sem suporte no schema canônico, duplicação de responsabilidade e inconsistências de formatação. Depois das correções, não há arquivos ou exports sem consumidor detectados, nem importações locais sem resolução.

A limpeza não fundiu telas, rotas ou serviços que apenas se parecem visualmente, mas representam domínios, permissões, payloads e decisões de negócio diferentes. Essa separação é intencional; transformá-las em um componente ou serviço genérico aumentaria o acoplamento e criaria uma abstração artificial.

## Correções aplicadas

### Código morto e superfície pública indevida

- Removidos validadores de runtime sem consumidores; `validation/runtime.ts` conserva apenas a leitura segura que é realmente utilizada.
- Removidos leitores FAMI agregados sem qualquer chamada no projeto.
- Removidas consultas antigas de dashboard por organização sem consumidor.
- Removidos helpers não utilizados de FAMI e relatórios.
- Funções e classes internas que não são API pública deixaram de ser exportadas, reduzindo a superfície de acoplamento entre módulos.

### Compatibilidade legada

- Removidos aliases de tipos de recomendação que não existem no enum canônico do banco: `not_implemented`, `insufficient_evidence` e o alias `nao`.
- Atualizado o teste de rótulos para validar somente os valores persistíveis no schema atual.

### Duplicações de responsabilidade

- Criado um único factory para o cliente Supabase administrativo dos scripts de operação. Os scripts de bootstrap, importação e preparação E2E passaram a reutilizá-lo.
- Centralizada a validação de identificador de item da Biblioteca nas três rotas administrativas que possuem o mesmo contrato.
- Centralizado o parsing dos filtros, cursor e limite da área **Formulários > Respostas**, usado tanto na listagem quanto na exportação.
- Centralizada a tradução de erros de domínio para mensagens de ações administrativas.
- Eliminada a concorrência entre a tela de respostas e o hook de respondentes: a leitura da lista possui um único responsável e só é iniciada quando a aba está ativa.
- Corrigida a navegação para a próxima página de respondentes para usar a página retornada pela requisição, em vez de depender de estado React ainda não atualizado.

### Integridade de código-fonte

- Corrigidos imports concatenados e um marcador BOM em arquivos TypeScript/TSX.
- Confirmado que toda supressão de lint restante possui justificativa explícita junto ao ponto em que é necessária.

## Resultados das verificações

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado, sem avisos (`--max-warnings=0`) |
| `npm test` | aprovado: **83 arquivos, 402 testes** |
| `npm run check:complexity` | aprovado: 673 arquivos de código e 67.689 linhas dentro dos limites configurados |
| `npm run build` | aprovado: build Next.js 16.2.7 concluído, 33 páginas estáticas geradas |
| Knip (`exports` e `files`) | nenhum export ou arquivo não utilizado detectado |
| Grafo de imports locais | nenhuma referência local quebrada |
| Hash de arquivos-fonte | nenhum arquivo-fonte exatamente duplicado |
| Busca de aliases legados em produção | nenhuma ocorrência encontrada |

## Sobre repetições textuais detectadas

O detector de cópia por tokens ainda identifica blocos parecidos no repositório. Ele compara texto, não responsabilidade. Os resultados remanescentes estão em quatro grupos que não devem ser fundidos:

1. **Cenários de teste E2E e fixtures:** chamadas semelhantes com precondições e efeitos esperados diferentes.
2. **Rotas HTTP:** todas já usam `withRoute` para autenticação, tratamento de erro e resolução de parâmetros; as partes semelhantes são o protocolo HTTP, enquanto os serviços e contratos retornados são específicos.
3. **Interfaces de administrador e respondente:** visualmente próximas, porém com permissões, ações disponíveis e dados exibidos diferentes.
4. **Seções de PDF e cards de domínio:** compartilham tipografia e estrutura de renderização, mas consomem agregados distintos e representam informações diferentes.

Não há duplicação de regra de negócio entre esses pontos. Generalizá-los em um componente “universal” ou serviço “genérico” reduziria legibilidade, esconderia regras de autorização e introduziria acoplamento indevido.

## Homologação ainda dependente de ambiente real

A descoberta do Playwright confirmou **6 cenários E2E** cadastrados. A execução efetiva, assim como `db:verify` e a validação de Storage/URL assinada, requerem banco Supabase, Storage e credenciais do ambiente de homologação. Esses checks não foram declarados como aprovados neste pacote, pois não havia um ambiente remoto configurado para executá-los de forma confiável.
