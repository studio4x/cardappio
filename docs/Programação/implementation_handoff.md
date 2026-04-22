# IMPLEMENTATION_HANDOFF.md — Cardappio

## 1. Objetivo deste documento

Este documento é o **handoff final de implementação** do Cardappio para uso com Codex no VS Code.

Ele existe para evitar três problemas comuns:

1. começar a codar sem ler a base completa
2. implementar fora da ordem correta
3. transformar os HTMLs do Stitch em páginas estáticas sem arquitetura real

Este arquivo define:

- quais documentos devem ser lidos primeiro
- o papel de cada arquivo do pacote
- a ordem correta de implementação
- como tratar os HTMLs exportados do Stitch
- o que deve ser considerado fonte principal
- o que não fazer
- um prompt final para colar no Codex

---

## 2. Contexto resumido do produto

O **Cardappio** é um **PWA de planejamento semanal de refeições**.

O núcleo do produto é:

- montar almoço e jantar da semana
- selecionar receitas por dia
- gerar lista de compras automaticamente
- consultar receitas no momento do preparo
- repetir ou ajustar semanas futuras

O produto **não deve ser tratado como um simples catálogo de receitas**.

A prioridade funcional é:

1. planejamento semanal
2. cardápio visual
3. lista de compras
4. recorrência de uso
5. monetização e operação admin

---

## 3. Pacote de documentos disponíveis

O pacote atual do projeto é composto por:

1. `CODEX_CARDAPPIO_APP_SPEC.md`
2. `CODEX_CARDAPPIO_EXECUTION_PLAN.md`
3. `DATABASE.md`
4. `API_FUNCTIONS.md`
5. `ROUTES_AND_PAGES.md`
6. `COMPONENTS_MAP.md`
7. `DESIGN.md`
8. `SCREENS.md`
9. `PROMPTS.md`
10. `ListadeArquivosHTML.md`

---

## 4. Ordem obrigatória de leitura

O Codex deve ler os arquivos nesta ordem:

## Etapa 1 — visão estrutural obrigatória

1. `CODEX_CARDAPPIO_APP_SPEC.md`
2. `CODEX_CARDAPPIO_EXECUTION_PLAN.md`

### Motivo
Esses dois arquivos definem:

- o que o app é
- como ele deve ser estruturado
- quais áreas existem
- qual a ordem correta de implementação
- o que entra no MVP e nas fases seguintes

Sem eles, o restante perde coerência.

---

## Etapa 2 — base de dados e backend

3. `DATABASE.md`
4. `API_FUNCTIONS.md`

### Motivo
Esses arquivos definem:

- tabelas
- relacionamentos
- RLS
- migrations
- Edge Functions
- cron jobs
- webhooks
- backend sensível

Eles devem ser lidos antes de implementar fluxos reais.

---

## Etapa 3 — frontend estrutural

5. `ROUTES_AND_PAGES.md`
6. `COMPONENTS_MAP.md`

### Motivo
Esses arquivos definem:

- roteamento real do app
- layouts
- guards
- estrutura de páginas
- componentização correta
- reaproveitamento dos HTMLs do Stitch

---

## Etapa 4 — camada visual e origem das telas

7. `DESIGN.md`
8. `SCREENS.md`
9. `PROMPTS.md`
10. `ListadeArquivosHTML.md`

### Motivo
Esses arquivos definem:

- direção visual
- identidade do produto
- mapa de telas
- prompts usados no Stitch
- nomes dos arquivos HTML exportados

Eles são importantes, mas **não devem comandar a arquitetura**. Eles devem orientar a interface.

---

## 5. Fonte principal vs fonte complementar

## 5.1 Fonte principal de implementação

Estes são os arquivos principais:

- `CODEX_CARDAPPIO_APP_SPEC.md`
- `CODEX_CARDAPPIO_EXECUTION_PLAN.md`
- `DATABASE.md`
- `API_FUNCTIONS.md`
- `ROUTES_AND_PAGES.md`
- `COMPONENTS_MAP.md`

Se houver dúvida entre uma decisão visual e uma decisão estrutural, prevalece a estrutural.

---

## 5.2 Fonte complementar

Estes arquivos refinam a interface, mas não devem ditar a arquitetura técnica:

- `DESIGN.md`
- `SCREENS.md`
- `PROMPTS.md`
- `ListadeArquivosHTML.md`

---

## 6. Como tratar os HTMLs exportados do Stitch

A lista de arquivos HTML exportados do Stitch já existe e foi mapeada no projeto. Ela inclui as telas principais do produto e telas admin iniciais. fileciteturn3file0

### Regra obrigatória

Os HTMLs do Stitch devem ser tratados como:

- referência visual
- referência de composição de layout
- referência de blocos visuais

Eles **não devem** ser usados como estrutura final copiada diretamente para o app.

### O processo correto é:

1. identificar a tela HTML correspondente
2. entender quais blocos ela contém
3. extrair componentes reutilizáveis
4. recriar a página em React + TypeScript
5. conectar a página ao layout correto
6. conectar os dados reais via Supabase / React Query
7. aplicar estados, guards e permissões

### Não fazer

- copiar HTML bruto tela por tela
- manter páginas isoladas sem componentização
- usar os nomes dos HTMLs como arquitetura final de código sem adaptação
- misturar visual exportado com lógica diretamente no mesmo arquivo de forma desorganizada

---

## 7. Stack obrigatória

O projeto deve ser implementado com:

- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- React Router
- TanStack React Query
- Supabase
- PostgreSQL com migrations SQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions
- PWA com manifest e service worker
- deploy em Vercel

---

## 8. Ordem correta de implementação

O Codex **não deve** tentar construir tudo ao mesmo tempo.

A ordem correta é:

## Fase 1 — Fundação

- setup do projeto
- estrutura de pastas
- providers
- layouts
- design tokens
- integração Supabase
- roteamento base
- guardas de rota

## Fase 2 — Auth e onboarding

- login/cadastro
- callback
- perfil base
- onboarding
- preferences

## Fase 3 — Núcleo do produto

- receitas
- planner semanal
- cardápio semanal
- lista de compras

## Fase 4 — Retenção

- favoritos
- histórico
- coleções
- notificações leves

## Fase 5 — Monetização

- planos
- assinatura
- checkout
- webhook
- restrições premium

## Fase 6 — Admin

- dashboard admin
- CRUD de receitas
- categorias
- tags
- coleções
- avisos editoriais
- usuários e assinaturas

## Fase 7 — PWA e automações

- manifest
- service worker
- push
- cron jobs
- rotinas operacionais

---

## 9. Ordem correta de implementação do frontend

## Primeiro construir

- `PublicLayout`
- `AuthLayout`
- `UserLayout`
- `AdminLayout`
- estados globais
- componentes base de UI

## Depois construir

- `RecipeCard`
- `MealSlotCard`
- `DayPlannerCard`
- `ShoppingChecklistItem`
- `WeekSummaryCard`
- `PageHeader`

## Depois montar páginas P1

- LandingPage
- LoginPage
- SignupPage
- OnboardingPage
- AppHomePage
- WeeklyPlannerPage
- RecipePickerPage
- RecipeDetailPage
- WeekDetailPage
- ShoppingListPage

## Só depois páginas P2/P3

- Favorites
- History
- Subscription
- Collections
- Notifications
- Admin pages

---

## 10. Ordem correta de implementação do banco

Seguir a ordem definida em `DATABASE.md`.

Resumo da sequência:

1. perfis e preferências
2. receitas e taxonomias
3. planejamento semanal
4. lista de compras e favoritos
5. coleções e notices
6. assinaturas
7. notificações
8. RPCs e refinamentos

Cada lote já deve nascer com:

- índices
- constraints
- timestamps
- RLS quando aplicável

---

## 11. Ordem correta de implementação das Edge Functions

Seguir a ordem definida em `API_FUNCTIONS.md`.

Resumo da sequência:

1. helpers compartilhados
2. auth functions
3. rebuild da lista de compras
4. assinatura e webhooks
5. notificações
6. funções admin
7. cron jobs

---

## 12. Definição de pronto para o fluxo principal

O fluxo principal do Cardappio só deve ser considerado pronto quando:

- usuário consegue criar conta/entrar
- usuário conclui onboarding
- usuário acessa o dashboard
- usuário cria uma semana
- usuário adiciona receitas por dia e refeição
- usuário salva a semana
- o cardápio semanal é exibido corretamente
- a lista de compras é gerada automaticamente
- a lista pode ser consultada e marcada

Sem isso, o produto ainda não está validado.

---

## 13. Regras críticas de arquitetura

## 13.1 Separação obrigatória de áreas

O app deve ter separação rígida entre:

- público
- app autenticado
- admin

## 13.2 Regras críticas não ficam no frontend

- assinatura
- permissões
- notificações
- geração sensível de links
- integrações externas
- webhooks

Tudo isso deve ficar em Edge Functions/backend.

## 13.3 Tabelas privadas exigem RLS

Sem exceções em dados do usuário.

## 13.4 Admin não é extensão do dashboard do usuário

Admin deve ter layout, navegação e componentes próprios.

## 13.5 O centro do produto é a semana, não a receita isolada

A receita é importante, mas o app gira em torno de:

- planejar
- organizar
- comprar
- repetir

---

## 14. Anti-padrões proibidos

O Codex não deve:

- começar pela cópia dos HTMLs como páginas finais
- criar páginas gigantes sem componentização
- pular a ordem estrutural definida
- implementar admin antes do fluxo principal
- deixar assinatura ou notificações sem trilha de eventos/logs
- implementar regras críticas só no frontend
- criar banco sem migrations versionadas
- deixar dados privados sem RLS
- misturar área pública, app e admin no mesmo shell
- tratar o produto como “site de receitas” em vez de planner semanal

---

## 15. Critério de priorização ao tomar decisões

Se houver dúvida sobre prioridade, usar esta ordem:

1. isso melhora o planejamento semanal?
2. isso melhora a lista de compras?
3. isso melhora a execução do dia a dia?
4. isso reduz esforço recorrente?
5. isso fortalece monetização sem quebrar a experiência?
6. isso melhora operação/admin?

Se não ajudar nesses pontos, perde prioridade.

---

## 16. Estratégia prática para usar os HTMLs do Stitch

## Passo 1

Ler `ListadeArquivosHTML.md` e identificar a tela base correspondente.

## Passo 2

Mapear a tela no `ROUTES_AND_PAGES.md`.

## Passo 3

Ver no `COMPONENTS_MAP.md` quais blocos devem ser extraídos.

## Passo 4

Usar `DESIGN.md` e `SCREENS.md` para alinhar visual e comportamento.

## Passo 5

Implementar a página real em React usando o layout correto.

---

## 17. Resultado esperado por camada

## Frontend

- rotas coerentes
- páginas componentizadas
- layouts corretos
- estados consistentes
- ótima experiência mobile-first

## Banco

- migrations claras
- relacionamentos bem definidos
- RLS aplicada
- suporte a assinatura e notificações

## Backend

- funções pequenas por responsabilidade
- segurança real
- logs úteis
- idempotência em webhook/cron

## Produto

- fluxo principal funcional
- planner semanal validado
- lista de compras útil
- base pronta para evolução

---

## 18. Prompt final para colar no Codex

Usar o prompt abaixo como instrução inicial de implementação:

> Você vai implementar o app Cardappio no VS Code seguindo rigorosamente a documentação do projeto. Antes de criar qualquer código, leia nesta ordem: `CODEX_CARDAPPIO_APP_SPEC.md`, `CODEX_CARDAPPIO_EXECUTION_PLAN.md`, `DATABASE.md`, `API_FUNCTIONS.md`, `ROUTES_AND_PAGES.md`, `COMPONENTS_MAP.md`, `DESIGN.md`, `SCREENS.md`, `PROMPTS.md` e `ListadeArquivosHTML.md`. Trate os HTMLs exportados do Stitch apenas como referência visual, nunca como estrutura final. A implementação deve seguir a stack React + TypeScript + Vite + Tailwind + shadcn/ui + React Router + React Query + Supabase + PostgreSQL + Edge Functions + PWA. Separe rigorosamente área pública, área autenticada e admin. Comece pela fundação do projeto, depois auth/onboarding, depois o fluxo principal do usuário: receitas, planner semanal, cardápio e lista de compras. Só depois avance para favoritos, histórico, monetização, admin e automações. Não concentre regras críticas no frontend, não pule migrations, não deixe dados privados sem RLS, não copie HTML tela por tela sem componentização. O centro do produto é o planejamento semanal e a lista de compras, não apenas o catálogo de receitas.

---

## 19. Conclusão

Este documento é o ponto final de alinhamento antes da implementação.

Se o Codex seguir este handoff corretamente, ele deve conseguir construir o Cardappio com:

- estrutura real de produto
- arquitetura coerente
- frontend componentizado
- backend seguro
- banco escalável
- aproveitamento correto das telas do Stitch
- foco no fluxo principal do negócio

