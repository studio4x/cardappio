# CODEX_CARDAPPIO_EXECUTION_PLAN.md

## 1. Objetivo deste documento

Este documento define **como o Codex deve executar a construção do Cardappio** dentro do VS Code.

Enquanto o arquivo `CODEX_CARDAPPIO_APP_SPEC.md` define **o que o produto precisa ter**, este documento define:

- ordem de implementação
- entregáveis por fase
- critérios de pronto
- dependências entre módulos
- checkpoints de validação
- escopo mínimo por etapa

A meta é impedir implementação desorganizada, retrabalho e decisões prematuras.

---

## 2. Regra principal de execução

O Codex **não deve tentar construir tudo ao mesmo tempo**.

A implementação deve seguir esta ordem:

1. fundação do projeto
2. autenticação e shell base
3. fluxo principal do usuário
4. retenção e recorrência
5. monetização
6. admin
7. automações, notificações e refinamentos PWA

---

## 3. Definição de pronto global

Cada fase só pode ser considerada concluída quando entregar:

- interface funcional
- fluxo coerente
- validações mínimas
- estados de loading, erro, vazio e sucesso
- integração real com dados ou contrato claramente preparado
- estrutura limpa e reutilizável

---

## 4. Fase 1 — Fundação do projeto

## Objetivo

Criar a base técnica e estrutural do app antes de entrar nos módulos de negócio.

## Entregáveis obrigatórios

### 4.1 Setup do projeto

- React + TypeScript + Vite
- Tailwind configurado
- shadcn/ui configurado
- React Router configurado
- React Query configurado
- integração Supabase inicial
- aliases de importação
- organização de pastas por domínio

### 4.2 Base visual

- tokens de cor
- tipografia
- radius
- shadows
- container padrão
- tema claro principal
- componentes base reutilizáveis

### 4.3 Providers e infraestrutura de app

- provider de autenticação
- provider de query client
- toasts
- layout root
- guardas de rota
- tratamento global de erro

### 4.4 Shells principais

- PublicLayout
- AuthLayout
- UserLayout
- AdminLayout

## Critérios de pronto da fase 1

- projeto sobe localmente sem quebra
- rotas base existem
- layouts separados existem
- design system mínimo está aplicado
- Supabase client está centralizado
- estrutura de diretórios está coerente com o spec

## Não entra nesta fase

- lógica completa de negócio
- admin funcional
- assinatura completa
- notificações completas

---

## 5. Fase 2 — Autenticação e conta

## Objetivo

Permitir acesso seguro ao app e persistência da conta do usuário.

## Entregáveis obrigatórios

### 5.1 Fluxos de auth

- login
- cadastro
- logout
- callback de autenticação
- recuperação de acesso
- refresh de sessão

### 5.2 Estrutura de conta

- perfil básico
- role do usuário
- status da conta
- tela de perfil inicial simples

### 5.3 Guardas de rota

- rotas públicas abertas
- rotas do app protegidas
- rotas admin protegidas por role

## Critérios de pronto da fase 2

- usuário consegue entrar e sair
- usuário autenticado acessa `/app`
- não autenticado é redirecionado
- admin não é acessível por usuário comum
- sessão persiste corretamente

## Dependências

- fase 1 concluída

---

## 6. Fase 3 — Onboarding e preferências

## Objetivo

Capturar os dados mínimos para personalizar a experiência.

## Entregáveis obrigatórios

- fluxo curto de onboarding
- household size
- almoço, jantar ou ambos
- número de dias padrão
- preferências e restrições alimentares
- objetivo principal de uso
- edição posterior dessas preferências

## Critérios de pronto da fase 3

- usuário recém-criado consegue concluir onboarding
- preferências ficam persistidas
- dashboard e planner já conseguem consumir essas preferências

## Dependências

- fase 2 concluída

---

## 7. Fase 4 — Núcleo do produto: receitas + planejamento + cardápio + compras

Esta é a fase mais importante do projeto.

---

## 7.1 Subfase A — Biblioteca de receitas

### Entregáveis

- listagem de receitas
- busca por receita
- filtro por categoria
- filtro por contexto de uso
- tela de detalhe da receita
- favoritos básicos

### Critérios de pronto

- receitas listam corretamente
- detalhe de receita está funcional
- estrutura de receita é legível e útil
- UX funciona bem em mobile

---

## 7.2 Subfase B — Planejamento semanal

### Entregáveis

- criar semana
- selecionar dias
- configurar almoço/jantar
- adicionar receita por slot
- trocar receita
- remover receita
- salvar semana

### Critérios de pronto

- usuário consegue montar uma semana real
- slots vazios e preenchidos estão claros
- semana pode ser editada depois

---

## 7.3 Subfase C — Cardápio semanal visual

### Entregáveis

- tela de resumo da semana
- visualização por dia
- almoço/jantar por dia
- acesso rápido à receita
- edição da semana

### Critérios de pronto

- usuário entende a semana em poucos segundos
- acesso ao conteúdo do dia é rápido

---

## 7.4 Subfase D — Lista de compras

### Entregáveis

- geração automática a partir da semana
- checklist de itens
- consolidação mínima de itens repetidos
- remover item manualmente
- atualização quando semana mudar

### Critérios de pronto

- a lista representa a semana salva
- o usuário consegue usar a lista no dia a dia
- a UX é simples e operacional

## Dependências da fase 4

- fase 3 concluída

## Observação

Sem esta fase bem resolvida, o app não está validado.

---

## 8. Fase 5 — Retenção e recorrência

## Objetivo

Reduzir esforço semanal e aumentar retorno do usuário.

## Entregáveis obrigatórios

### 8.1 Favoritos

- salvar receita
- remover favorita
- listar favoritas
- usar favorita no planner

### 8.2 Histórico

- listar semanas anteriores
- abrir semana passada
- duplicar semana
- reutilizar como base

### 8.3 Coleções

- listar coleções
- abrir coleção
- navegar receitas da coleção

### 8.4 Conteúdo editorial leve

- dicas
- alertas
- destaques da semana

## Critérios de pronto da fase 5

- o app reduz esforço da próxima semana
- o usuário pode repetir comportamentos anteriores
- existe sensação de continuidade de uso

---

## 9. Fase 6 — Monetização

## Objetivo

Ativar o modelo free/premium de forma organizada.

## Entregáveis obrigatórios

### 9.1 Planos e restrições

- plano atual visível
- diferenciação entre free e premium
- controle de acesso por feature

### 9.2 Fluxo de upgrade

- tela de assinatura
- CTA de upgrade
- comparação de planos
- estado premium ativo

### 9.3 Backend de assinatura

- checkout session
- webhook
- sincronização de status
- eventos de assinatura

## Critérios de pronto da fase 6

- usuário free vê limites com clareza
- usuário premium tem acesso liberado corretamente
- eventos principais de assinatura ficam registrados

## Dependências

- fluxo principal já funcionando

---

## 10. Fase 7 — Admin

## Objetivo

Permitir operação real do conteúdo e do produto.

## Entregáveis obrigatórios

### 10.1 Receitas

- listar
- buscar
- criar
- editar
- arquivar

### 10.2 Categorias e tags

- CRUD de categorias
- CRUD de tags
- ordenação básica

### 10.3 Coleções

- criar coleção
- editar coleção
- vincular receitas

### 10.4 Conteúdo editorial

- CRUD de dicas e alertas

### 10.5 Operação de negócio

- visão de usuários
- visão de assinaturas
- visão de relatórios básicos

## Critérios de pronto da fase 7

- equipe consegue operar o conteúdo sem editar banco manualmente
- admin é separado do dashboard do usuário
- filtros, tabelas e ações rápidas estão claros

---

## 11. Fase 8 — Notificações, automações e PWA completo

## Objetivo

Adicionar maturidade operacional e experiência nativa.

## Entregáveis obrigatórios

### 11.1 Notificações

- in-app
- push web
- preferências do usuário
- fila/log de envio

### 11.2 Automações

- lembretes de retorno semanal
- comunicação de coleções/dicas
- alertas de assinatura
- cron jobs com logs

### 11.3 PWA

- manifest
- service worker
- offline fallback
- installable app
- ícones corretos

## Critérios de pronto da fase 8

- app instalável
- push funcional
- automações com rastreabilidade
- logs mínimos presentes

---

## 12. Banco de dados — ordem de criação

O Codex deve implementar o banco em blocos de migrations.

## Lote 1 — fundação

- profiles
- user_preferences
- app_settings
- audit_logs base

## Lote 2 — receitas

- recipe_categories
- recipe_tags
- recipes
- recipe_ingredients
- recipe_steps
- recipe_tag_links
- recipe_variations

## Lote 3 — planejamento

- meal_plan_weeks
- meal_plan_days
- meal_plan_slots
- shopping_lists
- shopping_list_items
- favorite_recipes

## Lote 4 — conteúdo editorial

- recipe_collections
- recipe_collection_items
- editorial_notices

## Lote 5 — assinatura

- plans
- plan_prices
- user_subscriptions
- subscription_events

## Lote 6 — notificações

- notifications
- notification_queue
- notification_delivery_logs
- notification_preferences

Cada lote deve nascer já com:

- índices
- constraints
- timestamps
- status quando aplicável
- RLS quando aplicável

---

## 13. Ordem de criação do frontend

## Bloco 1

- layouts
- navegação
- shells
- estados globais

## Bloco 2

- auth pages
- onboarding pages
- dashboard base

## Bloco 3

- recipes list
- recipe detail
- recipe cards
- filters

## Bloco 4

- weekly planner
- meal slots
- weekly summary
- shopping list

## Bloco 5

- favorites
- history
- collections

## Bloco 6

- subscription pages
- premium states

## Bloco 7

- admin pages
- admin forms
- admin tables

## Bloco 8

- notifications center
- PWA polish
- offline states

---

## 14. Estados obrigatórios em toda tela

Toda tela deve prever:

- loading
- empty
- error
- success
- blocked/permission state quando fizer sentido

Isso deve ser implementado desde o início, e não só no refinamento.

---

## 15. Critérios de qualidade por camada

## 15.1 Frontend

- componentes reutilizáveis
- sem duplicação excessiva
- mobile-first real
- formulários com validação
- navegação clara

## 15.2 Backend

- funções pequenas por responsabilidade
- validação explícita
- checagem de auth e permissão
- logs úteis

## 15.3 Banco

- migrations versionadas
- constraints coerentes
- índices necessários
- RLS nas tabelas privadas

## 15.4 Produto

- o fluxo principal pode ser executado do início ao fim
- o produto parece um planner semanal, não só um catálogo

---

## 16. Checklist de conclusão do MVP

O MVP só deve ser considerado pronto quando existir:

- login/cadastro
- onboarding funcional
- biblioteca básica de receitas
- planner semanal funcional
- cardápio semanal funcional
- lista de compras gerada automaticamente
- favoritos
- perfil/preferências básicas
- área pública básica
- admin mínimo de receitas e categorias
- PWA básico instalável

---

## 17. Checklist de conclusão da V1

A V1 só deve ser considerada pronta quando existir também:

- histórico
- coleções
- monetização funcionando
- tela de assinatura
- notificações básicas
- gestão admin ampliada

---

## 18. Instruções finais para o Codex

O Codex deve seguir estas regras:

1. não começar por telas soltas sem fundação
2. não implementar admin antes do fluxo principal do usuário
3. não tratar receita como centro absoluto do produto; o centro é a semana
4. não deixar assinatura, notificação ou automação sem trilha de auditoria
5. não colocar integrações sensíveis no frontend
6. não pular migrations e RLS
7. não misturar dashboard do usuário com admin
8. não expandir para features secundárias antes de estabilizar planner + compras

---

## 19. Resultado esperado

Ao final da execução guiada por este documento, o Cardappio deve nascer como:

- um PWA real
- um produto escalável
- um app orientado à rotina semanal
- com fluxo principal sólido
- com base segura de dados
- com admin operacional
- com suporte a monetização e crescimento futuro

