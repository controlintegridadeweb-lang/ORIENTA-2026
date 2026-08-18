# Correção da baseline para a primeira implantação

**Data:** 2 de agosto de 2026  
**Escopo:** migrations, validações greenfield, documentação e artefatos gerados.

## Decisão aplicada

Foi confirmado que nenhuma migration da Plataforma ORIENTA foi aplicada em
ambiente compartilhado ou de produção. A sequência canônica `0001`–`0030`
substitui integralmente qualquer versão anterior antes da primeira implantação.

## Alterações realizadas

- mantidas somente as 30 migrations SQL canônicas em `supabase/migrations/`;
- removidos relatórios antigos que registravam aplicação de 18 e 23 migrations;
- corrigido o teste de integração de gestão de formulário para exigir
  `appliedCount = 30`;
- atualizadas referências a nomes antigos de migrations;
- corrigido o mapa de responsabilidades da baseline;
- atualizado o status de homologação para registrar que nenhuma migration foi
  aplicada;
- adicionada falha imediata aos executores PGlite quando a baseline não tiver
  exatamente 30 arquivos;
- ampliada a auditoria para rejeitar relatórios de execução com contagem diferente
  de 30 ou com falhas;
- adicionados os relatórios locais do banco ao `.gitignore`.

## Validações estáticas aprovadas

- 30 migrations contínuas, de `0001` a `0030`;
- 169 funções públicas sem redefinição;
- nenhuma migration corretiva avulsa;
- dependências, grants, comentários e delimitadores SQL auditados;
- arquitetura sem ciclos proibidos;
- segurança e sincronização aprovadas;
- arquivos, funções e hooks dentro dos limites de complexidade.

## Validação executável pendente

Antes da primeira implantação, executar em banco vazio:

```bash
npm run db:audit:migrations
npm run db:greenfield
npm run test:form-mgmt-rpc
supabase db reset --local
npm run db:verify
npm run check:generated-types
```

Os relatórios novos devem conter:

```text
appliedCount = 30
failures = []
```

Depois da primeira aplicação em ambiente compartilhado, `0001`–`0030` ficam
imutáveis e toda evolução deve começar em `0031`.
