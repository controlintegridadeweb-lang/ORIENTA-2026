> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Correções finais dos fluxos entre perfis — 13/07/2026

## Escopo

Correção das incoerências residuais identificadas entre os fluxos do administrador e do respondente, sem criar caminhos paralelos ou regras inferidas pela interface.

## Alterações estruturais

1. **Veredito individual da evidência**
   - `evidence_validation_status` possui estados explícitos: `pending`, `approved`, `invalidated` e `adjustment_requested`.
   - “Não aprovar” não é mais deduzido pelo estado global do ciclo.
   - “Solicitar ajuste” permanece associado somente à evidência que efetivamente recebeu essa decisão.

2. **Acesso autenticado aos arquivos de evidência**
   - Nova rota `/api/evidences/[evidenceId]/file`.
   - Validação de UUID, autenticação, organização e atribuição do formulário antes da geração da URL assinada.
   - URLs assinadas de curta duração para visualização ou download.

3. **Histórico imutável de relatórios**
   - Nova rota `/respondente/relatorios/[reportId]`.
   - Cada entrada do histórico abre o PDF persistido da emissão exata.
   - Nenhum dado histórico é reconstruído a partir do processamento operacional atual.

4. **Deep links do respondente**
   - IDs recebidos por URL são validados como UUID.
   - URLs inválidas são normalizadas para a listagem canônica.
   - Segmentos dinâmicos são codificados antes de compor a rota.

5. **Preservação do contexto da evidência**
   - A navegação da consulta transversal para a fila envia `evidenceId`.
   - A fila abre e focaliza diretamente a evidência selecionada.

## Validações executadas

- TypeScript: aprovado.
- ESLint: aprovado sem avisos.
- Vitest: 551 testes aprovados em 126 arquivos.
- Complexidade: aprovada.
- Código morto (Knip): aprovado.
- Build Next.js de produção: aprovado.

## Limitação do ambiente

A conferência dos tipos diretamente contra PostgreSQL/Supabase não foi executada porque o ambiente não possui URL de banco configurada. As tipagens TypeScript, migrações e build foram verificados estaticamente; a aplicação das migrações deve ser confirmada no ambiente Supabase antes da publicação.
