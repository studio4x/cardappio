# PRE_DEPLOY_DEVELOPMENT_INSTRUCTIONS.md — Cardappio

## 1. Objetivo deste documento

Este documento orienta a IA responsável pelo Cardappio sobre a **próxima etapa correta do projeto no estado atual**.

Ponto crítico de contexto:

- o **Supabase ainda não foi vinculado ao app**
- a **Vercel ainda não foi vinculada ao app**
- portanto, o projeto ainda está em **fase de desenvolvimento local/estrutural**
- neste momento, **não existem testes reais de produção, deploy real, nem validação ponta a ponta em ambiente final**

Por isso, a IA **não deve afirmar que o projeto está pronto para produção**, nem tratar integrações como plenamente validadas enquanto não houver vínculo real com infraestrutura externa.

---

## 2. Regra principal desta etapa

A próxima etapa do Cardappio deve ser tratada como:

> **fechamento estrutural de desenvolvimento + validação técnica local/documental + preparação para integração real futura**

E não como:

- produção concluída
- deploy validado
- operação real em ambiente final
- fluxo real de pagamento ou autenticação externa totalmente testado

---

## 3. O que a IA deve considerar como verdade obrigatória

Neste momento:

### 3.1 Ainda não está validado em ambiente real

Não considerar como “validado de verdade” sem integração real:

- login completo em ambiente Supabase real
- callback real de autenticação
- políticas RLS testadas contra banco real vinculado
- Edge Functions executadas em projeto Supabase real
- checkout de assinatura em provider real
- webhook processado em ambiente real
- notificações push reais
- storage real
- deploy real na Vercel
- PWA testado em ambiente publicado

### 3.2 O que existe por enquanto

O que pode existir e deve ser tratado como avanço legítimo:

- estrutura do frontend
- páginas implementadas
- componentes implementados
- rotas estruturadas
- migrations escritas
- Edge Functions criadas em código
- guards e proteções de frontend
- modelagem do banco
- configuração PWA em código
- integrações preparadas em nível de código

Ou seja: **existência em código não equivale a validação real em produção**.

---

## 4. O que a IA deve fazer agora

A IA deve entrar em uma etapa de **auditoria técnica de desenvolvimento** e **preparação para integração real futura**.

Essa etapa deve ter 4 objetivos obrigatórios:

### Objetivo 1 — mapear o que já foi implementado em código
A IA deve listar com precisão tudo o que já existe no repositório.

### Objetivo 2 — separar o que está apenas implementado localmente do que já foi realmente validado
Como ainda não há Supabase nem Vercel vinculados, a maior parte deve ser classificada como:

- implementado em código
- não validado em ambiente real

### Objetivo 3 — identificar as lacunas restantes em relação à documentação-base
A IA deve comparar o projeto com:

- `CODEX_CARDAPPIO_APP_SPEC.md`
- `CODEX_CARDAPPIO_EXECUTION_PLAN.md`
- `DATABASE.md`
- `API_FUNCTIONS.md`
- `ROUTES_AND_PAGES.md`
- `COMPONENTS_MAP.md`
- `IMPLEMENTATION_HANDOFF.md`

### Objetivo 4 — preparar um plano de pré-integração
A IA deve deixar o projeto pronto para a futura conexão com:

- Supabase real
- Vercel real
- ambiente de deploy
- testes ponta a ponta

---

## 5. O que a IA deve entregar agora

A próxima resposta da IA deve vir em formato técnico e objetivo.

Ela deve entregar os blocos abaixo.

---

## BLOCO A — inventário real do repositório

Listar objetivamente o que já existe no código hoje.

### A IA deve listar:

#### A.1 Frontend
- páginas implementadas
- layouts implementados
- componentes globais implementados
- componentes de domínio implementados
- componentes admin implementados
- hooks implementados
- providers implementados
- guards implementados

#### A.2 Banco
- migrations existentes
- tabelas previstas em cada migration
- seeds existentes
- policies existentes em código SQL
- funções SQL/RPC já escritas

#### A.3 Backend serverless
- Edge Functions implementadas
- helpers compartilhados implementados
- webhooks implementados
- cron jobs implementados

#### A.4 Infraestrutura preparada em código
- integração Supabase local/configurada
- manifest PWA
- service worker
- configuração de build
- configuração para deploy

---

## BLOCO B — classificação correta do estado atual

Para cada item importante, a IA deve classificar como:

- **implementado em código**
- **parcialmente implementado em código**
- **não implementado**
- **não validado em ambiente real**

### A IA deve aplicar essa classificação para:

1. autenticação
2. onboarding
3. dashboard
4. planner semanal
5. receitas
6. lista de compras
7. favoritos
8. histórico
9. coleções
10. assinatura
11. notificações
12. admin
13. PWA
14. migrations
15. RLS
16. Edge Functions
17. webhook
18. cron jobs
19. deploy
20. testes ponta a ponta

---

## BLOCO C — lacunas em relação ao plano base

A IA deve comparar o estado atual do código com os documentos-base e responder objetivamente o que ainda falta em cada um:

### Comparar contra:
- `CODEX_CARDAPPIO_APP_SPEC.md`
- `CODEX_CARDAPPIO_EXECUTION_PLAN.md`
- `DATABASE.md`
- `API_FUNCTIONS.md`
- `ROUTES_AND_PAGES.md`
- `COMPONENTS_MAP.md`

### Para cada documento, responder:
- o que já foi implementado
- o que foi parcialmente implementado
- o que ainda falta
- o que foi desviado do plano original

---

## BLOCO D — plano da próxima etapa de desenvolvimento

A IA deve propor a próxima etapa correta do projeto, considerando que ainda não existe Supabase e Vercel vinculados.

Essa próxima etapa deve priorizar:

### D.1 Fechamento estrutural do código
- completar páginas faltantes
- completar componentes faltantes
- completar rotas faltantes
- completar módulos admin faltantes
- completar Edge Functions faltantes em código
- completar migrations/policies faltantes

### D.2 Preparação para integração futura
- centralizar variáveis de ambiente
- revisar adapters do Supabase
- revisar clients e providers
- revisar separação frontend/backend
- revisar contratos de função
- revisar tratamento de erros

### D.3 Preparação para validação futura
- checklist de conexão com Supabase
- checklist de conexão com Vercel
- checklist de testes pós-vinculação
- checklist de validação do PWA publicado

---

## 6. O que a IA não deve fazer agora

A IA não deve:

- afirmar que o app está pronto para produção
- afirmar que autenticação está validada em ambiente real
- afirmar que webhook está funcionando de verdade sem provider real
- afirmar que RLS foi validada de verdade sem projeto Supabase conectado
- afirmar que PWA está validado em produção sem deploy real
- afirmar que Vercel está pronta sem vínculo real
- responder genericamente sem inventário de código
- inventar testes que não foram executados

---

## 7. Como a IA deve descrever o estado atual

A linguagem correta deve ser algo como:

- “implementado em código, ainda não validado em ambiente real”
- “estrutura preparada para integração com Supabase”
- “Edge Function implementada, mas não executada em projeto remoto real”
- “fluxo modelado e parcialmente integrado, pendente de validação com infraestrutura vinculada”

A IA não deve usar linguagem como:

- “pronto para produção”
- “100% funcional”
- “deploy-ready validado”
- “operação real concluída”

sem provas concretas em ambiente vinculado.

---

## 8. Próxima resposta obrigatória da IA

A próxima resposta da IA deve vir em 3 partes obrigatórias:

### Parte 1 — Inventário técnico real do código
Com lista objetiva do que existe hoje no repositório.

### Parte 2 — Matriz de status
Com classificação por item:
- implementado em código
- parcialmente implementado
- não implementado
- não validado em ambiente real

### Parte 3 — Plano da próxima etapa
Com foco em:
- fechar o desenvolvimento estrutural
- preparar integração com Supabase e Vercel
- definir checklist de validação futura

---

## 9. Mensagem pronta para enviar à IA agora

Use a mensagem abaixo:

---

Quero que você entre agora na fase correta do Cardappio considerando o contexto real do projeto.

Contexto obrigatório:
- o Supabase ainda não foi vinculado ao app
- a Vercel ainda não foi vinculada ao app
- portanto, o projeto ainda está em fase de desenvolvimento
- não existem testes reais de produção, deploy real nem validação ponta a ponta em ambiente final

Por isso, a partir de agora você não deve tratar o app como pronto para produção.

Quero que você me devolva uma análise técnica em 3 partes:

## Parte 1 — Inventário real do código
Liste objetivamente tudo o que já existe hoje no repositório:
- páginas
- layouts
- componentes globais
- componentes por domínio
- componentes admin
- hooks
- guards
- migrations
- tabelas
- policies
- Edge Functions
- helpers compartilhados
- webhooks
- cron jobs
- manifest/service worker/configuração PWA

## Parte 2 — Matriz de status real
Classifique cada item abaixo como:
- implementado em código
- parcialmente implementado
- não implementado
- não validado em ambiente real

Itens:
1. autenticação
2. onboarding
3. dashboard
4. planner semanal
5. receitas
6. lista de compras
7. favoritos
8. histórico
9. coleções
10. assinatura
11. notificações
12. admin
13. PWA
14. migrations
15. RLS
16. Edge Functions
17. webhook
18. cron jobs
19. deploy
20. testes ponta a ponta

## Parte 3 — Lacunas e próxima etapa
Compare o estado atual com estes arquivos-base:
- CODEX_CARDAPPIO_APP_SPEC.md
- CODEX_CARDAPPIO_EXECUTION_PLAN.md
- DATABASE.md
- API_FUNCTIONS.md
- ROUTES_AND_PAGES.md
- COMPONENTS_MAP.md

Para cada arquivo, diga:
- o que já foi implementado
- o que foi parcialmente implementado
- o que ainda falta
- o que desviou do plano inicial

Depois me entregue um plano da próxima etapa focado em:
- fechar lacunas estruturais do código
- preparar o projeto para futura integração com Supabase
- preparar o projeto para futura integração com Vercel
- definir checklist de validação futura após vinculação da infraestrutura

Não quero resposta genérica.
Não quero conclusão de “pronto para produção”.
Quero diagnóstico real de desenvolvimento.

---

## 10. Critério de sucesso desta etapa

Esta etapa só estará correta quando a IA:

- separar claramente “implementado em código” de “validado em ambiente real”
- parar de tratar o projeto como pronto para produção
- provar o estado real do repositório
- identificar lacunas remanescentes
- preparar o projeto para a futura etapa de integração e testes reais

---

## 11. Conclusão

A próxima fase do Cardappio é uma fase de **fechamento técnico de desenvolvimento**.

Ainda não é fase de produção.
Ainda não é fase de deploy validado.
Ainda não é fase de operação real.

O foco agora deve ser:

- consolidar o código
- medir aderência ao plano-base
- fechar o que falta estruturalmente
- preparar o terreno para a futura vinculação com Supabase e Vercel

