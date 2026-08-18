# Auditoria das migrations — estado canônico atualizado em 02/08/2026

## Resultado

A baseline greenfield está organizada em **30 migrations contínuas**, de `0001`
a `0030`. O antigo arquivo administrativo de 10.506 linhas foi dividido por
responsabilidade sem alterar a ordem dos comandos SQL.

A divisão foi possível porque a baseline ainda não foi publicada em ambiente
compartilhado. Depois da primeira aplicação compartilhada, os arquivos tornam-se
imutáveis e qualquer mudança deve começar em `0031`.

## Correções estruturais

- removidos overlays corretivos e redefinições sucessivas de RPCs;
- incorporado `allows_not_applicable` ao schema e ao bootstrap;
- incorporados prazo original, pausa da coleta e histórico ao domínio de ciclos;
- corrigidos blocos `DO` inválidos no bootstrap;
- preservadas as regras finais de FAMI, fila, formulário completo e reabertura;
- dividido o bloco administrativo em migrations coesas de leitura, relatórios,
  importação, cronogramas, segurança, FAMI e validação;
- mantidas as verificações estruturais ao final da baseline.

## Regras FAMI preservadas

- critério sem exigência de evidência e resposta `Sim`: **1,0**;
- evidência aprovada: **1,5**;
- `validated_without_proof`: **1,0**;
- `considered_insufficient`: **0**;
- evidência definitivamente invalidada: **0**;
- `Não se aplica` aprovado: fora do denominador.

## Auditoria automática

O comando `npm run db:audit:migrations` exige:

- sequência contínua de `0001` a `0030`;
- no máximo 2.500 linhas por migration;
- ausência de nomes corretivos;
- delimitadores SQL balanceados;
- ausência de `DO` aninhado em função;
- função pública definida uma única vez;
- grants, revokes e comentários sem duplicidade;
- tabelas e funções criadas antes de suas dependências;
- presença dos contratos finais de prazo, reabertura, validação e FAMI.

## Validações estáticas aprovadas

- 30 migrations canônicas;
- 169 funções públicas sem redefinição;
- nenhuma migration acima de 2.500 linhas;
- verificações de segurança e sincronização aprovadas;
- contratos finais de FAMI, concorrência, prazos e validação presentes.

## Homologação executável obrigatória

A aprovação definitiva ainda exige ambiente com PostgreSQL/Supabase:

```bash
npm ci
npm run db:audit:migrations
npm run db:greenfield
supabase start
supabase db reset --local
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run check:generated-types
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres DB_VERIFY_ONLY=1 npm run db:verify
npm test
npm run test:e2e
```
