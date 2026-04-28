# Project Cardappio - Agent Documentation

Este arquivo serve como guia de referência rápida para agentes de IA (como Antigravity) e desenvolvedores que colaboram no projeto **Cardappio**.

## 📋 Visão Geral do Projeto
O **Cardappio** é uma plataforma de gerenciamento de receitas e cardápios focada em uma experiência mobile-first (PWA). O objetivo é oferecer uma interface intuitiva para usuários descobrirem, gerenciarem e planejarem suas refeições.

## 🛠️ Stack Tecnológica
- **Frontend:** React + TypeScript + Vite
- **Estilização:** Tailwind CSS + Lucide React (Ícones)
- **Componentes:** Shadcn/UI
- **Backend/Database:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel
- **PWA:** Implementação customizada para experiência nativa em dispositivos móveis.

## 🤖 Orientações para Agentes de IA

### 1. Princípios de Design (Aesthetics)
- **Mobile-First:** Priorizar sempre a visualização mobile. Elementos devem ser táteis e fáceis de usar com uma mão.
- **Visual Premium:** Usar gradientes suaves, micro-animações, glassmorphism e tipografia moderna (ex: Inter, Outfit).
- **Consistência:** Seguir o sistema de design estabelecido no diretório `src/components/ui`.

### 2. Estrutura de Dados (Supabase)
- O banco de dados centraliza informações de receitas, ingredientes e passos de preparo.
- Consultar sempre o esquema atual em `supabase/` antes de sugerir mudanças estruturais.
- Utilizar scripts SQL no diretório `scripts/` ou `supabase/migrations` para alterações controladas.

### 3. Workflow de Desenvolvimento
- **Branch Principal:** `main`.
- **Commits:** Mensagens claras em português ou inglês seguindo padrões semânticos.
- **Sync:** Sempre verificar o status do repositório remoto (`https://github.com/studio4x/cardappio`) antes de modificações profundas.

### 4. Responsabilidades Específicas
- **UI/UX Agent:** Focar em refinamentos de layout, espaçamento (margins/padding) e responsividade.
- **Database Agent:** Garantir a integridade das receitas e eficiência das queries no Supabase.
- **System Agent:** Manter a configuração do PWA, SEO e performance de carregamento.

## 🚀 Comandos Úteis
- `npm run dev`: Iniciar servidor de desenvolvimento.
- `npm run build`: Gerar build de produção.
- `git status`: Verificar alterações locais pendentes.

---
*Este documento deve ser mantido atualizado por qualquer agente que realize mudanças estruturais significativas no projeto.*
