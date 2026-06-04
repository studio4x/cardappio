# Redefinição de senha via e-mail — Zap Sucatas

Este documento descreve, com base no código e na configuração existentes neste repositório, como o fluxo de redefinição de senha por e-mail está montado na plataforma Zap Sucatas.

O objetivo é servir como referência para replicar o mesmo comportamento em outra plataforma com problema.

---

## 1) Visão geral do fluxo

O fluxo atual é dividido em duas etapas:

1. **Solicitação de recuperação**
   - o usuário informa o e-mail na tela pública `/recuperar-senha`;
   - o frontend chama o Supabase Auth com `resetPasswordForEmail`;
   - o Supabase envia um e-mail com link de recuperação;
   - o link retorna o usuário para a mesma rota `/recuperar-senha`.

2. **Definição da nova senha**
   - quando o usuário volta pelo link e a sessão de recuperação é reconhecida, a página troca do formulário de solicitação para o formulário de nova senha;
   - o frontend chama `updateUser({ password })` no Supabase Auth;
   - após a troca, a sessão atual é lida novamente e o usuário é redirecionado para o painel adequado ao seu papel.

Ponto importante: **não existe Edge Function customizada para reset de senha** neste projeto. O fluxo é feito diretamente pelo **Supabase Auth no cliente**.

---

## 2) Implementação no frontend

### 2.1 Rota pública usada no fluxo

O reset de senha fica exposto na rota:

- `/recuperar-senha`

Essa rota está registrada em `src/app/routes.tsx` e é acessível no layout público.

### 2.2 A rota é liberada mesmo em manutenção

O layout público permite acesso à recuperação de senha mesmo quando o site entra em modo de manutenção.

Arquivo:

- `src/app/layouts/public-layout.tsx`

Comportamento:

- a tela de manutenção bloqueia quase tudo;
- exceções explícitas:
  - `/login`
  - `/recuperar-senha`

Isso é relevante porque evita travar o fluxo de recuperação em uma janela de manutenção operacional.

### 2.3 Tela de recuperação

Arquivo:

- `src/pages/auth/forgot-password-page.tsx`

Esse componente faz duas coisas, dependendo do estado da sessão:

#### a) Estado sem sessão de recuperação

Mostra um formulário simples com:

- campo `E-mail`;
- botão `Enviar link`;
- link de retorno para `/login`.

Ao enviar:

- chama `requestPasswordReset(email)`;
- mostra a mensagem:
  - `E-mail de recuperação enviado. Verifique sua caixa de entrada.`

#### b) Estado com sessão de recuperação ativa

Quando o Supabase reconhece a sessão que veio do link do e-mail, a tela muda para:

- `Definir nova senha`

O formulário passa a exigir:

- `Nova senha`
- `Confirmar nova senha`

Ao enviar:

- chama `updatePassword(password)`;
- recarrega os dados da sessão atual com `loadCurrentSessionUser()`;
- calcula o destino padrão com base no papel do usuário;
- abre um diálogo de sucesso;
- redireciona automaticamente após alguns segundos.

### 2.4 Validações de formulário

Arquivo:

- `src/domains/auth/schemas.ts`

Regras aplicadas:

- e-mail válido para solicitação de recuperação;
- senha com mínimo de 6 caracteres;
- confirmação de senha obrigatória;
- as duas senhas precisam coincidir.

### 2.5 Client do Supabase no navegador

Arquivo:

- `src/integrations/supabase/client.ts`

O client é criado com:

- `detectSessionInUrl: true`
- `persistSession: true`
- `autoRefreshToken: true`

Essas três opções são importantes para o reset de senha:

- `detectSessionInUrl: true`
  - permite que o Supabase processe o retorno do link de recuperação;
  - a sessão ou o código vindo na URL é reconhecido automaticamente.
- `persistSession: true`
  - mantém a sessão no browser.
- `autoRefreshToken: true`
  - renova tokens de sessão quando necessário.

### 2.6 Funções de auth envolvidas

Arquivo:

- `src/domains/auth/api.ts`

Funções relevantes:

#### `requestPasswordReset(email)`

- usa `client.auth.resetPasswordForEmail(email, { redirectTo })`;
- o `redirectTo` é montado assim:
  - `baseUrl + '/recuperar-senha'`

Ou seja, o usuário volta para a mesma rota de recuperação depois de clicar no e-mail.

#### `updatePassword(password)`

- usa `client.auth.updateUser({ password })`;
- não faz chamada para backend customizado;
- depende de a sessão de recuperação já estar ativa no browser.

#### `loadCurrentSessionUser()`

- usa `client.auth.getSession()`;
- serve para descobrir quem é o usuário após a troca de senha;
- o redirecionamento final depende dessa leitura.

### 2.7 Fonte da URL base usada no link

Ainda em `src/domains/auth/api.ts`, a base do link vem de:

1. `VITE_APP_URL`, se definido;
2. `window.location.origin`, se estiver no browser;
3. fallback `http://localhost:5173`.

Isso significa que o link do e-mail de recuperação depende diretamente da variável pública `VITE_APP_URL`.

### 2.8 Redirecionamento após a troca de senha

Depois que a senha é atualizada:

- o sistema lê o perfil atual;
- usa `getDefaultPathByRole(role)`;
- redireciona:
  - admin → `/admin`
  - usuário comum → `/app`

Arquivo:

- `src/app/paths.ts`

### 2.9 Estados de UI e feedback

A tela de recuperação mostra:

- estado de carregamento;
- estado sem sessão de recuperação;
- estado com sessão de recuperação;
- mensagens de sucesso/erro;
- botão desabilitado quando o Supabase não está configurado;
- diálogo de sucesso após troca da senha.

Componentes usados:

- `PublicAuthShell`
- `SuccessNoticeDialog`
- `Button`
- `Input`

---

## 3) Configuração do Supabase Auth

Arquivo:

- `supabase/config.toml`

Essa é a configuração operacional usada no projeto.

### 3.1 Projeto

- `project_id = "zap-sucatas"`

### 3.2 Auth habilitado

- `[auth] enabled = true`

### 3.3 URL principal do site

- `site_url = "https://zap-sucatas.vercel.app"`

Esse é o destino base definido atualmente no projeto.

### 3.4 Redirect URLs adicionais

As URLs adicionais permitidas incluem:

- `http://localhost:5173`
- `http://localhost:5173/login`
- `http://localhost:5173/cadastro`
- `http://localhost:5173/recuperar-senha`
- `https://zap-sucatas.vercel.app`
- `https://zap-sucatas.vercel.app/login`
- `https://zap-sucatas.vercel.app/cadastro`
- `https://zap-sucatas.vercel.app/recuperar-senha`
- `https://zapsucatas.com.br`
- `https://zapsucatas.com.br/login`
- `https://zapsucatas.com.br/cadastro`
- `https://zapsucatas.com.br/recuperar-senha`

Observação importante:

- o fluxo de recuperação depende de o `redirectTo` do frontend estar em uma URL permitida aqui;
- se a URL não estiver na allowlist do Supabase, o link pode falhar ou ser rejeitado.

### 3.5 Expiração do JWT

- `jwt_expiry = 3600`

O token de sessão tem vida útil de 1 hora.

### 3.6 Cadastro habilitado

- `enable_signup = true`

Não é uma configuração de reset em si, mas afeta o ecossistema de autenticação da plataforma.

### 3.7 Configurações de e-mail do Supabase Auth

#### E-mail habilitado

- `[auth.email]`
- `enable_confirmations = true`

#### Limite entre envios

- `max_frequency = "1m0s"`

Esse parâmetro limita a frequência de envio de e-mails de autenticação.

#### Tamanho do OTP

- `otp_length = 8`

Isso vale para os fluxos de autenticação por código que o Supabase gerar.

### 3.8 SMTP do Supabase Auth

Bloco:

- `[auth.email.smtp]`

Configuração atual:

- `enabled = true`
- `host = "smtp.hostinger.com"`
- `port = 465`
- `user = "info@zapsucatas.com.br"`
- `pass = "env(SMTP_PASSWORD)"`
- `admin_email = "info@zapsucatas.com.br"`
- `sender_name = "Zap Sucatas"`

Leitura prática:

- o Supabase Auth envia os e-mails de recuperação via SMTP próprio;
- a senha SMTP não está hardcoded no arquivo;
- ela vem do segredo de ambiente `SMTP_PASSWORD`.

### 3.9 Templates de e-mail do Auth

O projeto usa templates locais versionados no repositório.

Para recuperação de senha, o importante é:

- `[auth.email.template.recovery]`
  - `subject = "Redefina sua senha no Zap Sucatas"`
  - `content_path = "./supabase/templates/recovery.html"`

Esse template é o corpo do e-mail enviado pelo Supabase Auth para reset de senha.

#### Outros templates correlatos

Mesmo não sendo o reset em si, o projeto também tem:

- confirmação de cadastro;
- magic link;
- troca de e-mail;
- reautenticação;
- notificações de mudança de senha.

Isso indica que o sistema de auth foi configurado de forma completa, não só para reset.

### 3.10 Notificação de troca de senha

Bloco existente:

- `[auth.email.notification.password_changed]`
  - `subject = "Sua senha foi alterada"`
  - `content_path = "./supabase/templates/notification_password_changed.txt"`

Isso é relevante porque, após o `updateUser({ password })`, o Supabase pode disparar a comunicação de mudança de senha usando esse template.

### 3.11 MFA

Bloco:

- `[auth.mfa.totp]`
  - `enroll_enabled = true`
  - `verify_enabled = true`

Não faz parte do reset de senha, mas convive na mesma configuração de auth.

---

## 4) Template de e-mail de recuperação

Arquivo:

- `supabase/templates/recovery.html`

Características do template:

- HTML simples e compatível com clientes de e-mail;
- idioma do documento:
  - `lang="pt-BR"`
- usa layout em tabela;
- fundo cinza claro;
- bloco central branco com borda;
- botão principal verde;
- inclui logo da Zap Sucatas no cabeçalho.

### 4.1 Texto do e-mail

O conteúdo atual comunica:

- solicitação de redefinição de senha recebida;
- link principal para redefinir a senha;
- OTP exibido no corpo se solicitado;
- URL completa impressa no e-mail;
- aviso para ignorar se não foi o usuário quem solicitou.

### 4.2 Variáveis do template

O template usa placeholders do Supabase:

- `{{ .ConfirmationURL }}`
- `{{ .Token }}`

### 4.3 Imagem e branding

O logo é carregado de:

- `https://jrxccuxqucwrlccfhdrg.supabase.co/storage/v1/object/public/site-assets/site/branding/email/logo-light-current`

Isso significa que o e-mail de recuperação depende também de um asset público no Storage do Supabase.

### 4.4 Observação operacional

Se o asset do logo falhar:

- o e-mail ainda pode funcionar;
- mas a marca visual fica comprometida.

---

## 5) Variáveis de ambiente relacionadas

### 5.1 Frontend público

Arquivo:

- `.env.example`

Variáveis relevantes para esse fluxo:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

Essas três são as que o frontend precisa para construir o link e falar com o Supabase.

### 5.2 Valores esperados no deploy

Documentação de deploy:

- `docs/deployment/vercel.md`

Recomendações atuais:

- produção inicial:
  - `VITE_APP_URL=https://zap-sucatas.vercel.app`
- quando o domínio final estiver ativo:
  - atualizar para `https://zapsucatas.com.br`

Isso precisa estar alinhado com os redirects do Supabase.

### 5.3 Variáveis que não entram no frontend

As variáveis abaixo existem no projeto, mas não são usadas diretamente pelo reset de senha do Supabase Auth:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_SECURE`

Essas são usadas por Edge Functions que enviam e-mails operacionais do produto, não pelo fluxo de recovery do Auth.

---

## 6) Comportamento esperado em runtime

### 6.1 Solicitação de recuperação

Quando o usuário envia o e-mail:

1. o frontend valida o e-mail;
2. o Supabase recebe o pedido via `resetPasswordForEmail`;
3. o Supabase envia o e-mail usando o SMTP configurado;
4. o link do e-mail aponta para a rota configurada no `redirectTo`;
5. o usuário volta para `/recuperar-senha`.

### 6.2 Retorno pelo link

Ao voltar pelo link:

1. `detectSessionInUrl` permite que o client reconheça o retorno;
2. `AuthProvider` observa a sessão via `onAuthStateChange`;
3. `ForgotPasswordPage` vê `isAuthenticated === true`;
4. o formulário muda para a definição de nova senha.

### 6.3 Atualização da senha

Ao confirmar a nova senha:

1. o frontend chama `updateUser({ password })`;
2. o Supabase atualiza a credencial da conta;
3. a sessão atual é lida novamente;
4. o sistema redireciona para `/app` ou `/admin`.

---

## 7) Pontos de atenção para replicar em outra plataforma

Se você quiser copiar esse fluxo para outra aplicação, os pontos mínimos são:

### No frontend

- criar uma rota pública de recuperação de senha;
- usar `resetPasswordForEmail(email, { redirectTo })`;
- fazer o `redirectTo` apontar para a rota que recebe o retorno;
- habilitar `detectSessionInUrl: true`;
- tratar o estado de sessão para alternar entre:
  - solicitar e-mail;
  - definir nova senha;
- usar `updateUser({ password })` depois que a sessão de recuperação estiver ativa.

### No Supabase

- habilitar Auth;
- definir `site_url`;
- liberar as URLs de redirecionamento necessárias;
- configurar SMTP;
- criar template de recovery;
- garantir que o e-mail remetente exista e seja aceito pelo provedor SMTP;
- manter o segredo SMTP apenas no ambiente do Supabase.

### Nos redirects

- a URL usada no `redirectTo` precisa estar na allowlist do projeto;
- a URL base pública da aplicação precisa ser consistente com o ambiente publicado;
- se houver domínio canônico novo, atualizar tanto o frontend quanto o Supabase.

---

## 8) Resumo curto de configuração atual

### Plataforma

- rota de recuperação: `/recuperar-senha`
- link para a recuperação aparece no login
- página troca automaticamente para “nova senha” quando a sessão de recuperação existe
- atualização de senha acontece no frontend com `updateUser({ password })`

### Supabase

- Auth habilitado
- `site_url = https://zap-sucatas.vercel.app`
- redirects liberados para localhost, Vercel e domínio final
- SMTP habilitado via Hostinger
- template de recovery em `supabase/templates/recovery.html`
- assunto do recovery: `Redefina sua senha no Zap Sucatas`

---

## 9) Arquivos principais para consultar

- `src/pages/auth/forgot-password-page.tsx`
- `src/domains/auth/api.ts`
- `src/integrations/supabase/client.ts`
- `src/app/routes.tsx`
- `src/app/layouts/public-layout.tsx`
- `src/domains/auth/schemas.ts`
- `src/app/paths.ts`
- `supabase/config.toml`
- `supabase/templates/recovery.html`
- `docs/deployment/vercel.md`
