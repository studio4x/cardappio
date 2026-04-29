# AGENTS.md — Cardappio

## Função deste arquivo

Este arquivo orienta o Codex dentro do repositório.

A fonte de verdade do projeto está na pasta `/docs`.

O Codex deve tratar o Cardappio como produto real em produção, não como protótipo.

---

## Projeto

Cardappio é uma plataforma PWA mobile-first para gerenciamento de receitas, cardápios, listas de compras, favoritos, coleções, histórico e planejamento semanal.

Stack principal:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React
- Supabase Auth
- PostgreSQL/Supabase
- Supabase Storage
- Vercel
- PWA

---

## Fontes de verdade

Consultar os documentos conforme a tarefa:

- `docs/Programação/` — arquitetura, plano de execução, banco, rotas e lógica do sistema;
- `docs/specs/` — especificações funcionais detalhadas de módulos (podem vir de outras plataformas);
- `docs/Visual/` — design, identidade visual e comportamento de UI;
- `docs/Visual/Telas/` — HTMLs de referência das telas;
- `docs/Reports/` — auditorias e validações do projeto;

Prioridade em caso de conflito:

1. documentação de programação/arquitetura;
2. banco e rotas;
3. documentos visuais;
4. telas HTML de referência;
5. pedido direto do usuário.

Não carregar todos os docs sem necessidade. Consultar apenas os arquivos relevantes para a tarefa.

---

## Uso de specs externas

Quando uma spec vier de outro sistema:

- tratar como referência funcional;
- não replicar arquitetura automaticamente;
- mapear para o modelo atual do projeto;
- manter consistência com Supabase, rotas e estrutura existentes.

---

## Regra principal de execução

Antes de implementar tarefa relevante:

1. identificar quais docs governam a tarefa;
2. ler apenas os docs necessários;
3. entender escopo, arquivos afetados e riscos;
4. implementar em etapas pequenas;
5. não expandir escopo silenciosamente.

Não inventar arquitetura, rotas, tabelas, permissões ou fluxos fora da documentação.

---

## Modo econômico para Codex

Evitar tarefas grandes demais.

Preferir:

- uma tela por vez;
- um ajuste visual por vez;
- uma migration por vez;
- um fluxo por vez;
- um bug por vez.

Quando a tarefa for visual, informe a tela exata e o arquivo de referência em `docs/Visual/Telas/`.

---

## UI/UX

O projeto é mobile-first.

Sempre priorizar:

- usabilidade em celular;
- elementos táteis;
- leitura fácil;
- espaçamento confortável;
- visual premium;
- consistência com o design system;
- responsividade real;
- estados de loading, erro, vazio e sucesso.

Seguir os padrões de:

- `src/components/ui`;
- `docs/Visual/design.md`;
- HTMLs em `docs/Visual/Telas/`.

---

## Frontend

Preservar a separação entre:

- landing;
- autenticação;
- dashboard;
- receitas;
- coleções;
- favoritos;
- histórico;
- planejamento semanal;
- lista de compras;
- admin.

Não quebrar rotas existentes sem validar nos docs.

---

## Banco de dados

Antes de alterar dados ou estrutura, consultar:

- `docs/Programação/database.md`;
- `supabase/`;
- migrations existentes.

Toda alteração estrutural deve ser feita por migration versionada.

Sempre avaliar:

- foreign keys;
- índices;
- constraints;
- triggers;
- RLS;
- policies;
- performance das queries.

Não depender de configuração manual no Supabase como fonte oficial.

---

## Segurança

Sempre considerar:

- autenticação nas áreas privadas;
- RLS em tabelas sensíveis;
- permissões por usuário;
- Supabase Auth;
- storage seguro;
- validação no backend quando houver ação crítica;
- segredos nunca no frontend.

Nunca expor `service_role` no cliente.

---

## PWA

O Cardappio deve manter experiência PWA.

Não quebrar:

- manifest;
- service worker;
- offline básico;
- instalação no mobile;
- ícones;
- performance inicial.

---

## Deploy

Deploy deve ser considerado quando a mudança precisar refletir em ambiente remoto.

Ao publicar:

1. revisar `git status`;
2. fazer commit claro;
3. fazer push;
4. aplicar Supabase quando houver migrations, policies ou storage;
5. aplicar Vercel quando houver frontend.

Não salvar tokens, senhas ou credenciais no repositório.

### Deploy Vercel via CLI

O auto-deploy via webhook GitHub→Vercel pode não estar ativo.
Nesse caso, o deploy deve ser feito manualmente via CLI:

```bash
npx vercel deploy --prod --token $VERCEL_TOKEN --scope $VERCEL_TEAM_ID --yes
```

As credenciais estão em `.env.local` (não versionado):
- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ID`

### Validação de deploy obrigatória

Após deploy, confirmar via API:

1. O `readyState` do deploy de produção é `READY`;
2. O SHA do deploy corresponde ao `HEAD` local;
3. O domínio canônico (`cardappio-mauve.vercel.app`) responde corretamente.

Se houver divergência entre o deploy publicado e o HEAD, tratar como falha e corrigir antes de encerrar.

### Dependências (.npmrc)

O arquivo `.npmrc` com `legacy-peer-deps=true` DEVE estar versionado.
Sem ele, o `npm install` na Vercel falha com ERESOLVE (conflito de peer deps entre `vite@8` e `vite-plugin-pwa`).

---

## Validação

Quando aplicável, executar:

```bash
npm run build
```