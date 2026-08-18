> **Documento histórico.** Este arquivo registra uma auditoria ou correção anterior e não representa necessariamente o estado atual. Consulte `docs/current/` para decisões vigentes.

# Correções de bugs — 10/07/2026

## Escopo

Correção dos bugs confirmados nos fluxos de resposta, evidência, configuração de perguntas e aplicabilidade por organização, sem alteração das regras de negócio do ciclo, do FAMI ou das recomendações.

## Correções aplicadas

1. **Persistência parcial no envio final**
   - O workbench recarrega os dados após salvar respostas válidas antes de informar itens pendentes.
   - Se a atualização falhar, o usuário recebe orientação explícita e o fluxo não continua sobre estado desatualizado.

2. **Configuração padrão após falha de leitura**
   - Erros de rede não criam mais uma configuração padrão editável.
   - A edição permanece bloqueada e existe uma ação explícita de nova tentativa.

3. **Loading infinito no workbench**
   - A leitura agora possui `try/catch/finally`.
   - Falhas de rede e respostas inválidas encerram o loading e exibem mensagem útil.

4. **Erros não tratados em evidências**
   - Upload, descarte de upload temporário e remoção de evidência tratam falhas de rede e respostas inválidas.
   - Estados de envio/salvamento são sempre encerrados.

5. **Atualização parcial de dispensas**
   - A substituição de dispensas passou a usar uma única RPC transacional.
   - `delete` e `insert` pertencem à mesma transação: ou toda a substituição é concluída, ou nada é alterado.

6. **Perda de justificativas diferentes**
   - Justificativas existentes por organização são preservadas enquanto o administrador não editar explicitamente o campo comum.
   - Ao editar o campo, a nova justificativa é aplicada conscientemente ao conjunto selecionado.

7. **Condição de corrida nas leituras**
   - Requisições anteriores são canceladas com `AbortController`.
   - Respostas fora de ordem são descartadas por um identificador sequencial.

## Testes de regressão adicionados

- falha de rede e encerramento do loading;
- descarte de resposta antiga em concorrência;
- recarga após persistência parcial;
- falha de upload de evidência;
- falha ao descartar upload temporário;
- bloqueio de configuração após erro de leitura;
- recuperação após nova tentativa bem-sucedida;
- preservação e edição explícita de justificativas diferentes;
- verificação SQL da atomicidade e do isolamento por escopo.

## Validação realizada

- `npm run typecheck`: aprovado;
- `npm run lint`: aprovado, sem warnings;
- `npm run check:dead-code`: aprovado;
- `npm run check:complexity`: aprovado;
- `npm test`: 91 arquivos e 434 testes aprovados;
- `npm run test:coverage`: aprovado, 77,51% de linhas e 60,06% de branches;
- `npm run build`: aprovado, incluindo 35 páginas estáticas.

## Validação dependente de infraestrutura

O arquivo `supabase/verify/waiver_replacement_atomic.sql` foi incluído no runner oficial de verificações. Sua execução requer PostgreSQL/Supabase real e o binário `psql`, indisponíveis no ambiente desta correção.
