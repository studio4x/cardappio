# SPEC_AUTH_LOGIN

## 1. Objetivo

Este documento descreve como funcionam hoje o login, a autenticacao, a resolucao de perfil e a autorizacao de usuarios na plataforma Zap Sucatas.

O foco desta spec e registrar:

- fluxo de entrada do usuario;
- relacionamento entre `auth.users` e `public.profiles`;
- regras de sessao no frontend;
- guards de rota;
- separacao entre usuario comum e admin;
- operacoes administrativas sobre contas;
- regras de seguranca e lacunas atuais.

Esta spec reflete a implementacao atual do repositorio e deve ser lida em conjunto com:

- `docs/architecture/zapsucatas_blueprint_execucao_mvp.md`
- `docs/architecture/ADMIN_SPEC.md`
- `docs/architecture/SPEC_PASSWORD_RESET.md`

---

## 2. Escopo

Esta spec cobre:

- login por e-mail e senha;
- login por magic link;
- cadastro por e-mail e senha;
- recuperacao e atualizacao de senha;
- bootstrap automatico de perfil;
- leitura de sessao no frontend;
- protecao de rotas privadas;
- autorizacao por `role` e `status`;
- gestao administrativa de usuarios.

Esta spec nao cobre em profundidade:

- RLS de todos os modulos do sistema;
- notificacoes por e-mail;
- configuracao SMTP do Supabase;
- SEO e UX detalhado das telas de autenticacao.

---

## 3. Stack e componentes envolvidos

### Frontend

- React
- React Router
- React Hook Form
- Zod
- Supabase JS Client

### Backend/Auth

- Supabase Auth
- tabela `public.profiles`
- triggers SQL em `auth.users`
- Edge Function `manage-user-account`

### Arquivos principais

- `src/app/providers/auth-provider.tsx`
- `src/app/guards/auth-guard.tsx`
- `src/app/guards/guest-guard.tsx`
- `src/app/guards/role-guard.tsx`
- `src/domains/auth/api.ts`
- `src/domains/auth/schemas.ts`
- `src/app/routes.tsx`
- `src/app/paths.ts`
- `supabase/migrations/0002_profiles.sql`
- `supabase/migrations/0011_security_hardening.sql`
- `supabase/migrations/0013_profile_email_and_user_management.sql`
- `supabase/functions/manage-user-account/index.ts`

---

## 4. Modelo de identidade

## 4.1 Fonte primaria de autenticacao

A autenticacao primaria fica em `auth.users` do Supabase Auth.

O frontend nunca trata `profiles` como sistema de login. `profiles` funciona como camada operacional complementar para:

- nome do usuario;
- telefone;
- `role`;
- `is_admin`;
- `status`;
- id interno de perfil usado pelos dominios do produto.

## 4.2 Tabela `profiles`

A tabela `public.profiles` e a identidade operacional da aplicacao.

Campos centrais:

- `id`
- `auth_user_id`
- `email`
- `full_name`
- `phone`
- `role`
- `is_admin`
- `status`

Regras estruturais:

- `auth_user_id` e unico e referencia `auth.users(id)`;
- `role` aceita `user` ou `admin`;
- `status` aceita `active`, `suspended` ou `under_review`;
- `is_admin` e sincronizado automaticamente a partir de `role`.

## 4.3 Bootstrap automatico do perfil

Quando um usuario e criado no Supabase Auth, a trigger `handle_new_user()` cria ou atualiza o registro correspondente em `public.profiles`.

Origem:

- migration `0002_profiles.sql`
- refinamento em `0013_profile_email_and_user_management.sql`

Comportamento:

1. novo usuario entra em `auth.users`;
2. trigger `on_auth_user_created` executa `handle_new_user()`;
3. sistema cria `profiles.auth_user_id = auth.users.id`;
4. nome e derivado de `raw_user_meta_data.full_name` ou do prefixo do e-mail;
5. e-mail tambem e sincronizado para `profiles.email`.

---

## 5. Tipos de usuario e status

## 5.1 Roles

O sistema reconhece dois papeis:

- `user`
- `admin`

Regra atual:

- acesso ao dashboard requer usuario autenticado e perfil permitido;
- acesso ao admin requer `role = 'admin'`.

## 5.2 Status operacionais do perfil

O sistema reconhece tres estados:

- `active`
- `suspended`
- `under_review`

Efeito pratico:

- `active`: pode usar areas privadas normalmente;
- `under_review`: autenticado, mas bloqueado operacionalmente pelo `AuthGuard`;
- `suspended`: autenticado, mas bloqueado operacionalmente pelo `AuthGuard`.

---

## 6. Sessao no frontend

## 6.1 Provider central

O frontend usa `AuthProvider` como fonte unica de estado de autenticacao.

Responsabilidades:

- carregar a sessao inicial com `supabase.auth.getSession()`;
- resolver o usuario de sessao para `SessionUser`;
- ouvir `onAuthStateChange`;
- expor `status`, `user`, `isAuthenticated`, `refreshUser` e `signOut`.

Estados suportados:

- `loading`
- `authenticated`
- `unauthenticated`

## 6.2 Resolucao do usuario de sessao

O frontend nao usa apenas o payload bruto do Supabase Auth.

Ele executa:

1. leitura da sessao;
2. busca em `public.profiles` por `auth_user_id`;
3. composicao do objeto `SessionUser`.

Estrutura resolvida:

- `id`: id do usuario no Auth;
- `profileId`: id do perfil interno;
- `email`;
- `fullName`;
- `role`;
- `status`.

Fallbacks atuais:

- se nao encontrar `profiles`, o usuario ainda pode ser resolvido com:
  - `role = 'user'`
  - `status = 'under_review'`
- isso evita promover acesso privado sem perfil operacional valido.

---

## 7. Fluxos de autenticacao

## 7.1 Login com e-mail e senha

Tela:

- `/login`

Implementacao:

- `src/pages/auth/login-page.tsx`
- `signInWithPassword()` em `src/domains/auth/api.ts`

Fluxo:

1. usuario informa e-mail e senha;
2. frontend valida com Zod;
3. chama `supabase.auth.signInWithPassword()`;
4. sessao retornada e resolvida para `SessionUser`;
5. usuario e redirecionado para:
   - rota originalmente tentada, se existir `location.state.from`;
   - `/admin`, se `role = 'admin'`;
   - `/app`, se `role = 'user'`.

## 7.2 Login com magic link

Tela:

- `/login`

Implementacao:

- `sendMagicLink()` em `src/domains/auth/api.ts`

Fluxo:

1. usuario informa o e-mail;
2. frontend chama `supabase.auth.signInWithOtp()`;
3. `emailRedirectTo` aponta para `${baseUrl}/app`;
4. ao concluir autenticacao, o `AuthProvider` atualiza a sessao;
5. o usuario passa pelos mesmos guards e regras de status.

Observacao:

- o magic link existe como alternativa de login;
- o fluxo principal comercial continua sendo login por senha.

## 7.3 Cadastro

Tela:

- `/cadastro`

Implementacao:

- `src/pages/auth/register-page.tsx`
- `signUp()` em `src/domains/auth/api.ts`

Fluxo:

1. usuario informa nome, e-mail, senha e confirmacao;
2. frontend valida com Zod;
3. chama `supabase.auth.signUp()`;
4. `full_name` vai em `user_metadata`;
5. `emailRedirectTo` aponta para `${baseUrl}/app`;
6. a trigger de banco cria ou atualiza `public.profiles`;
7. se Supabase devolver sessao imediata, o frontend navega para `/app`;
8. se nao houver sessao imediata, a tela exibe mensagem para confirmar o e-mail.

Premissa atual:

- o cadastro aberto cria contas com `role = 'user'`;
- o cadastro administrativo nao e publico.

## 7.4 Recuperacao de senha

Tela:

- `/recuperar-senha`

Implementacao atual:

- `requestPasswordReset()`
- `updatePassword()`
- `src/pages/auth/forgot-password-page.tsx`

Fluxo atual:

1. usuario sem sessao informa o e-mail;
2. frontend chama `supabase.auth.resetPasswordForEmail()`;
3. `redirectTo` aponta para `${baseUrl}/recuperar-senha`;
4. quando a sessao de recovery estiver autenticada, a mesma pagina exibe o formulario de nova senha;
5. frontend chama `supabase.auth.updateUser({ password })`.

Observacao importante:

- existe uma spec separada em `SPEC_PASSWORD_RESET.md` com fluxo mais detalhado;
- a implementacao atual usa a mesma rota `/recuperar-senha` para solicitar e concluir a redefinicao;
- nao existe hoje uma rota separada `/redefinir-senha`.

## 7.5 Logout

Origem:

- `signOutFromSupabase()`
- `AuthProvider.signOut()`

Fluxo:

1. frontend chama `supabase.auth.signOut()`;
2. estado local e zerado;
3. usuario volta a ser tratado como `unauthenticated`.

---

## 8. Guards de rota

## 8.1 GuestGuard

Usado em:

- `/login`
- `/cadastro`

Comportamento:

- se `status = loading`, exibe fallback;
- se usuario ja autenticado existe, redireciona para:
  - `/admin` quando `role = 'admin'`;
  - `/app` quando `role = 'user'`;
- se nao houver usuario, libera a rota publica.

## 8.2 AuthGuard

Usado em:

- todas as rotas `/app/*`
- todas as rotas `/admin/*`

Comportamento:

- se `status = loading`, exibe fallback;
- se nao autenticado, redireciona para `/login`;
- se `user.status = 'under_review'`, bloqueia acesso com tela de perfil em analise;
- se `user.status = 'suspended'`, bloqueia acesso com tela de acesso suspenso;
- se `user.status = 'active'`, libera a navegacao.

## 8.3 RoleGuard

Usado em:

- todas as rotas `/admin/*`

Comportamento:

- se `status = loading`, exibe fallback;
- se usuario nao existir, redireciona para `/login`;
- se `role` nao estiver na lista permitida, redireciona para a rota padrao do papel real do usuario.

No estado atual:

- admin e protegido por `allowedRoles={['admin']}`.

---

## 9. Mapa de rotas de autenticacao

Rotas publicas de auth:

- `/login`
- `/cadastro`
- `/recuperar-senha`

Rotas privadas:

- `/app/*`
- `/admin/*`

Destino padrao por role:

- `user` -> `/app`
- `admin` -> `/admin`

---

## 10. Regras de autorizacao

## 10.1 Autorizacao no frontend

O frontend aplica:

- verificacao de sessao;
- verificacao de `role`;
- verificacao de `status`.

Isso controla experiencia e navegacao, mas nao e tratado como camada unica de seguranca.

## 10.2 Autorizacao no banco

O banco aplica seguranca complementar por:

- RLS;
- helper `public.is_admin()`;
- helper `public.current_profile_id()`;
- trigger `protect_profile_mutations()`.

Regra relevante em `profiles`:

- usuario comum nao pode promover o proprio `role`;
- usuario comum nao pode alterar `is_admin`;
- usuario comum nao pode alterar o proprio `status`;
- admin ativo pode operar com privilegio maior.

## 10.3 Autorizacao em Edge Functions

Funcoes sensiveis usam validacao manual do token com service role no backend.

Padrao atual:

1. ler bearer token do header ou `access_token` do body;
2. validar sessao com `admin.auth.getUser(token)`;
3. buscar perfil em `public.profiles`;
4. exigir perfil `active`;
5. exigir `role = 'admin'` quando necessario.

Esse padrao aparece em:

- `supabase/functions/_shared/auth.ts`
- `supabase/functions/manage-user-account/index.ts`

---

## 11. Gestao administrativa de usuarios

## 11.1 Canal administrativo

A gestao administrativa de contas nao e feita diretamente pelo cliente no Auth.

O admin usa a Edge Function:

- `manage-user-account`

Modos suportados:

- `create`
- `update`
- `delete`
- `reset_password`

## 11.2 Criacao administrativa

Fluxo:

1. admin autenticado envia requisicao para a Edge Function;
2. funcao valida o token e o perfil admin ativo;
3. cria usuario em `auth.users` com `auth.admin.createUser`;
4. persiste ou atualiza `profiles` com `email`, `full_name`, `phone`, `role` e `status`;
5. registra auditoria em `admin_audit_logs`.

## 11.3 Atualizacao administrativa

Permite alterar:

- e-mail;
- nome;
- telefone;
- `role`;
- `status`.

Protecao especial:

- admin nao pode remover o proprio acesso admin;
- admin nao pode suspender o proprio perfil.

## 11.4 Reset administrativo de senha

Fluxo:

1. admin seleciona usuario;
2. envia nova senha para a Edge Function;
3. backend chama `auth.admin.updateUserById`;
4. acao gera log administrativo.

Regra atual:

- senha minima exigida na Edge Function: 8 caracteres.

## 11.5 Exclusao administrativa

Fluxo:

1. backend localiza o perfil;
2. verifica dependencias vinculadas:
   - anuncios;
   - perguntas;
   - respostas;
   - posts de blog;
   - logs administrativos;
3. se houver dependencia, a exclusao e negada;
4. se nao houver dependencia, remove o usuario do Auth;
5. registra auditoria.

Restricao importante:

- admin nao pode excluir a propria conta administrativa.

---

## 12. Configuracao do Supabase Auth

Origem:

- `supabase/config.toml`

Parametros observados:

- `site_url = "https://zap-sucatas.vercel.app"`
- redirects adicionais para:
  - localhost
  - Vercel
  - dominio `zapsucatas.com.br`
- `jwt_expiry = 3600`
- `enable_signup = true`

Impacto pratico:

- cadastro publico esta habilitado;
- links de login e recuperacao dependem desses redirects;
- tokens possuem expiracao configurada em 1 hora.

---

## 13. Validacoes de formulario

Origem:

- `src/domains/auth/schemas.ts`

Regras atuais:

- e-mail valido obrigatorio;
- senha minima de 6 caracteres no frontend;
- confirmacao de senha obrigatoria e igual a senha;
- nome completo minimo de 3 caracteres no cadastro.

Observacao:

- existe assimetria entre frontend e Edge Function administrativa:
  - frontend publico aceita senha com minimo de 6;
  - reset/criacao administrativa exige minimo de 8.

Essa diferenca nao quebra o fluxo publico atual, mas deve ser padronizada.

---

## 14. Fluxo resumido de decisao de acesso

```txt
Usuario acessa a aplicacao
-> AuthProvider carrega sessao atual
-> resolveSessionUser(session)
-> busca perfil em public.profiles
-> monta SessionUser { role, status, profileId }
-> Router aplica guards

Se rota publica de auth:
  -> GuestGuard bloqueia usuario ja autenticado

Se rota privada /app:
  -> AuthGuard exige sessao
  -> AuthGuard exige status active

Se rota privada /admin:
  -> AuthGuard exige sessao e status active
  -> RoleGuard exige role admin
```

---

## 15. Regras de seguranca relevantes

1. Regra critica nao fica apenas no frontend.
2. `profiles` e derivado de `auth.users`, nao substitui o Auth.
3. `role` e `is_admin` nao devem ser alteraveis por usuario comum.
4. `status` controla acesso operacional.
5. Acoes administrativas de usuario passam por Edge Function com validacao manual de token.
6. Service role nunca e exposto no cliente.
7. Exclusao de usuario respeita verificacao de dependencias.
8. Auditoria administrativa e registrada em operacoes criticas de conta.

---

## 16. Lacunas e pontos de atencao

## 16.1 Recuperacao de senha

O fluxo atual funciona, mas esta mais simples do que a spec dedicada de password reset.

Pontos de atencao:

- a mesma rota `/recuperar-senha` faz solicitacao e redefinicao;
- nao ha uma validacao explicita de hash `type=recovery` na pagina;
- a UX depende do estado autenticado fornecido pelo Supabase apos retorno do link.

## 16.2 Padronizacao de politica de senha

Hoje existem dois minimos:

- 6 caracteres no frontend publico;
- 8 caracteres na Edge Function administrativa.

Recomendacao:

- padronizar para um unico baseline de seguranca.

## 16.3 Confirmacao de e-mail

O cadastro ja contempla o caso de nao haver sessao imediata e exibe mensagem de confirmacao.

Mesmo assim, e importante manter claro operacionalmente:

- se a confirmacao de e-mail estiver ativa no projeto Supabase, a UX final depende do template e redirect corretos.

## 16.4 Dependencia forte de `profiles`

Se houver falha no bootstrap de `profiles`, o usuario autenticado tende a cair em fallback `under_review`.

Isso e uma escolha segura, mas exige monitoramento para:

- trigger de criacao de perfil;
- consistencia entre `auth.users` e `profiles`.

---

## 17. Definition of Done para auth operacional

Considera-se o auth operacionalmente consistente quando:

1. usuario consegue criar conta com e-mail e senha;
2. trigger cria o perfil correspondente;
3. login com senha funciona;
4. login por magic link funciona;
5. recuperacao de senha funciona;
6. `/app` exige autenticacao e perfil ativo;
7. `/admin` exige autenticacao, perfil ativo e role admin;
8. alteracoes criticas de conta via admin passam por Edge Function;
9. `profiles` e `auth.users` permanecem coerentes;
10. redirects do Supabase estao corretos nos ambientes ativos.

---

## 18. Referencias tecnicas

- `src/app/providers/auth-provider.tsx`
- `src/app/guards/auth-guard.tsx`
- `src/app/guards/guest-guard.tsx`
- `src/app/guards/role-guard.tsx`
- `src/domains/auth/api.ts`
- `src/domains/auth/schemas.ts`
- `src/domains/auth/types.ts`
- `src/pages/auth/login-page.tsx`
- `src/pages/auth/register-page.tsx`
- `src/pages/auth/forgot-password-page.tsx`
- `src/domains/profiles/api.ts`
- `supabase/migrations/0002_profiles.sql`
- `supabase/migrations/0011_security_hardening.sql`
- `supabase/migrations/0013_profile_email_and_user_management.sql`
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/manage-user-account/index.ts`
- `supabase/config.toml`
