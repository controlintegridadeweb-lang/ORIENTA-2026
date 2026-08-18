> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Correções de navegabilidade e coerência dos fluxos — 2026-07-11

## Objetivo

Eliminar perdas de contexto entre telas, tornar filtros e recortes compartilháveis pela URL, corrigir a hierarquia semântica de títulos e impedir que o assistente de publicação seja avançado por manipulação direta da query string.

## Correções aplicadas

### Preenchimento do diagnóstico

- A identificação da rota de preenchimento passou a reconhecer `/respondente/ciclos/[cycleId]`.
- O canvas e os comportamentos específicos do formulário agora são aplicados na rota real.
- O retorno do workspace passou a aceitar, de forma sanitizada, tanto “Meus diagnósticos” quanto “Evidências”.
- O envio e o reenvio preservam a tela de origem e o ano selecionado.

### Evidências do respondente

- Busca, status, período, pendências, ciclo, formulário e paginação são persistidos na URL.
- Os CTAs de correção enviam um `returnTo` seguro com o contexto atual.
- Ao concluir ou sair da correção, o usuário retorna à mesma lista, com os mesmos filtros e página.

### Evidências administrativas

- A lista administrativa também persiste filtros e paginação na URL.
- O drawer adiciona a origem aos links de diagnóstico e validação.
- A fila de validação retorna diretamente à lista de evidências quando essa foi a origem.
- O contexto é sanitizado antes de ser reutilizado, evitando redirecionamentos externos ou rotas não autorizadas.

### FAMI

- Organização, diagnóstico, ano do processamento e aba ativa possuem URL canônica.
- Alterações explícitas de escopo atualizam a URL.
- Recarregar, compartilhar ou usar voltar/avançar do navegador mantém o mesmo recorte analítico.
- A sincronização funciona nas áreas administrativa e respondente.

### Hierarquia de títulos

- As áreas autenticadas mantêm um único `<h1>` no cabeçalho global da página.
- Títulos internos de detalhes, preenchimento, validação e recomendações foram ajustados para níveis secundários.

### Assistente de publicação

- O progresso máximo é persistido por formulário na sessão.
- Alterar manualmente `?etapa=` não libera uma etapa ainda não alcançada.
- URLs acima do progresso válido são normalizadas para a última etapa permitida.
- A progressão regular continua linear e sem bloquear retornos às etapas já visitadas.

### Plano de ação

- Deep links do módulo usam “Plano de ação” como retorno padrão.
- O fluxo normal continua preservando a origem por `returnTo`.

## Testes adicionados ou ampliados

- construção e sanitização de URLs de evidências;
- contexto de retorno administrativo e do respondente;
- preservação do ano após envio;
- URLs canônicas do FAMI;
- identificação da rota de preenchimento;
- bloqueio de avanço indevido no wizard;
- rótulos de retorno coerentes com a origem.

## Validação

- ESLint: aprovado sem warnings;
- TypeScript: aprovado;
- código morto: aprovado;
- complexidade: aprovada;
- testes: 108 arquivos e 470 testes aprovados;
- cobertura: 77,51% de linhas, 60,06% de branches e 80,39% de funções;
- build de produção: aprovado;
- geração estática: 35 de 35 páginas concluídas.

## Limites da validação

Não foram executados testes E2E com navegador e Supabase real nesta etapa. A validação realizada cobre contratos, helpers de navegação, componentes e build, mas a homologação final deve confirmar histórico do navegador, foco, rolagem e restauração visual dos filtros em um ambiente integrado.
