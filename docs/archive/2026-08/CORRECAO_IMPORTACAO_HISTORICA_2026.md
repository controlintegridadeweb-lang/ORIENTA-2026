# Correção da importação histórica de 2026

## Resultado

A importação histórica foi integrada ao domínio normal da plataforma. Respostas,
evidências, textos auxiliares e dados funcionais são importados diretamente da
planilha, sem tabela, rota, bloqueio ou fila paralela de saneamento.

## Fonte conferida

A aba `Página1` da planilha recebida contém:

- 22 organizações respondentes;
- 126 perguntas por organização;
- 2.772 respostas normalizadas;
- 1.127 respostas `Sim`;
- 1.645 respostas `Não`;
- 288 respostas vazias registradas como `Não` inferido, com nota auditável;
- 453 links vinculados a respostas `Sim`, importados como evidências históricas;
- 110 links vinculados a respostas `Não`, preservados nas notas;
- 207 campos auxiliares com texto;
- dados funcionais completos dos 22 respondentes.

A fonte não possui uma linha da SETUR. Nenhuma resposta foi inventada para essa
organização.

## Correções estruturais

1. O leitor XLSX passou a tratar corretamente células autoencerradas e células
   vazias, sem deslocar valores entre colunas.
2. O gerador usa o contrato versionado `schema_version: 2` e valida os 126 itens.
3. Matrícula, lotação, cargo/função e declaração usam os mesmos nomes de campo
   consumidos pelo importador.
4. Links associados a respostas `Não` permanecem nas notas históricas, em vez de
   desaparecerem.
5. Links associados a respostas `Sim` são importados como evidências aprovadas,
   inclusive quando a pergunta não exige comprovação.
6. Respostas `Sim` sem URL permanecem válidas e seguem o cálculo FAMI normal.
7. O módulo paralelo de revisão histórica foi removido das telas, contratos,
   serviços, testes, migrations e verificadores.
8. A sequência canônica foi consolidada em 30 migrations contínuas, de `0001` a
   `0030`, adequada à primeira instalação ainda não compartilhada.

## Regra FAMI preservada

- toda resposta elegível `Sim` vale 1,0 ponto;
- quando a pergunta exige evidência e existe comprovação aprovada, vale 1,5 ponto;
- resposta `Não` vale zero;
- ausência de comprovação, quando validada administrativamente, mantém 1,0 ponto
  da resposta `Sim` e pode gerar recomendação documental;
- comprovação considerada insuficiente ou evidência definitivamente invalidada vale
  zero e gera recomendação;
- respostas `Não se aplica` aprovadas e perguntas dispensadas ficam fora do
  denominador.

A regra foi alinhada em TypeScript, PostgreSQL, testes, interface, metodologia,
relatórios e documentação.

## Validações executadas

- sintaxe de todos os scripts `.mjs`;
- arquitetura de camadas;
- segurança e sincronização;
- complexidade estrutural;
- sintaxe de 938 arquivos TypeScript/TSX;
- existência de imports locais e aliases `@/`;
- execução direta das regras do parser e do importador;
- execução direta do cálculo FAMI;
- contrato SQL do cálculo 1,0/1,5;
- continuidade das 30 migrations;
- geração e auditoria do manifesto real da planilha.

Resultado do manifesto:

```text
22 organizações
2.772 respostas
1.127 Sim
1.645 Não
453 links de evidência
207 textos auxiliares
0 artefatos paralelos de revisão
```

## Limites da validação local

O ambiente não possuía as dependências npm instaladas e não conseguiu obtê-las
pela rede/cache. Por isso, Vitest, ESLint, `next typegen`, o typecheck completo e
o build Next.js não foram executados. Os arquivos de teste foram mantidos e as
regras críticas foram executadas diretamente com Node e TypeScript global.

As verificações SQL foram atualizadas e o contrato foi conferido estaticamente,
mas não houve aplicação em uma instância PostgreSQL/Supabase neste ambiente.
Como a base foi tratada como ainda não compartilhada, as migrations canônicas
foram corrigidas diretamente. Depois de aplicadas em banco compartilhado, novas
mudanças deverão ser incrementais.
