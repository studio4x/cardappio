# CODEX_FIRST_MESSAGE.md

Use a mensagem abaixo como primeiro envio ao Codex.

---

Você vai implementar o app **Cardappio** no VS Code.

Antes de escrever qualquer código, leia toda a documentação do projeto e trate esses arquivos como **fonte principal de verdade**.

## Ordem obrigatória de leitura

1. `IMPLEMENTATION_HANDOFF.md`
2. `CODEX_CARDAPPIO_APP_SPEC.md`
3. `CODEX_CARDAPPIO_EXECUTION_PLAN.md`
4. `DATABASE.md`
5. `API_FUNCTIONS.md`
6. `ROUTES_AND_PAGES.md`
7. `COMPONENTS_MAP.md`
8. `DESIGN.md`
9. `SCREENS.md`
10. `PROMPTS.md`
11. `ListadeArquivosHTML.md`

## Regras obrigatórias

- não comece a codar antes de ler tudo
- trate os HTMLs do Stitch apenas como **referência visual**, nunca como estrutura final
- não copie HTML tela por tela para dentro do projeto
- separe rigorosamente **área pública**, **área autenticada do usuário** e **admin**
- siga a stack definida na documentação
- implemente primeiro a fundação do projeto
- depois auth/onboarding
- depois o fluxo principal do produto: **receitas, planner semanal, cardápio e lista de compras**
- só depois avance para favoritos, histórico, monetização, admin e automações
- não concentre regras críticas no frontend
- não pule migrations
- não deixe dados privados sem RLS
- não trate o produto como catálogo de receitas; o centro é o **planejamento semanal**

## Stack obrigatória

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
- Vercel

## O que eu quero que você me devolva primeiro

Antes de implementar, me devolva estes 7 itens:

1. **Resumo do seu entendimento do produto**
2. **Plano resumido de implementação em fases**
3. **Estrutura inicial de pastas do projeto**
4. **Lista dos primeiros arquivos que serão criados**
5. **Estratégia para converter os HTMLs do Stitch em componentes React reutilizáveis**
6. **Ordem de criação do banco e das migrations**
7. **Ordem de implementação das rotas e páginas principais**

## Restrições de execução

- não implemente admin completo antes do fluxo principal do usuário
- não implemente automações avançadas antes do fluxo principal funcionar
- não implemente monetização completa antes de planner + compras estarem sólidos
- não entregue apenas páginas estáticas sem integração pensada
- não crie componentes gigantes acoplados a páginas inteiras

## Objetivo do MVP

O MVP só está validado quando o usuário consegue:

- criar conta / entrar
- concluir onboarding
- acessar o dashboard
- criar uma semana
- adicionar receitas por dia e refeição
- salvar a semana
- visualizar o cardápio semanal
- gerar automaticamente a lista de compras
- usar a lista de compras no dia a dia

## Instrução final

Comece apenas pela leitura e análise.

**Não implemente nada ainda.**

Primeiro me devolva os 7 itens acima com base na documentação.

---

## Versão curta alternativa

Se quiser enviar uma versão mais curta, use esta:

---

Leia toda a documentação do Cardappio antes de implementar qualquer código. A ordem obrigatória é: `IMPLEMENTATION_HANDOFF.md`, `CODEX_CARDAPPIO_APP_SPEC.md`, `CODEX_CARDAPPIO_EXECUTION_PLAN.md`, `DATABASE.md`, `API_FUNCTIONS.md`, `ROUTES_AND_PAGES.md`, `COMPONENTS_MAP.md`, `DESIGN.md`, `SCREENS.md`, `PROMPTS.md` e `ListadeArquivosHTML.md`.

Regras: não copie os HTMLs do Stitch como estrutura final; use-os só como referência visual. Separe área pública, área autenticada e admin. Implemente primeiro fundação, depois auth/onboarding, depois o fluxo principal do produto: receitas, planner semanal, cardápio e lista de compras. Não pule migrations, RLS, Edge Functions ou regras de segurança. O centro do produto é planejamento semanal + lista de compras, não só catálogo de receitas.

Antes de codar, me devolva:
1. resumo do entendimento do produto
2. plano de implementação em fases
3. estrutura inicial de pastas
4. primeiros arquivos a criar
5. estratégia para transformar os HTMLs do Stitch em componentes React
6. ordem de criação do banco/migrations
7. ordem de implementação das rotas principais
