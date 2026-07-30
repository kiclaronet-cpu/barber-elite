# Manual de Instalação - Barber Elite

## 1. Requisitos

- Node.js 18+
- NPM ou Yarn
- Conta no Supabase (gratuita)
- Conta no GitHub (opcional)
- Conta na Vercel (opcional)

## 2. Configurar Banco de Dados (Supabase)

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor** > **New Query**
4. Copie o conteúdo de `supabase/schema.sql` e execute
5. Vá em **Authentication** > **Providers** e ative Email/Password
6. Vá em **Authentication** > **URL Configuration** e adicione:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

## 3. Configurar Variáveis de Ambiente

1. Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

2. Preencha as credenciais do Supabase:
   - Vá em **Settings** > **API** no dashboard do Supabase
   - Copie **Project URL** e **anon public** key
   - Cole no `.env.local`

## 4. Instalar Dependências

```bash
npm install
```

## 5. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 6. Criar Admin

Para criar um administrador:
1. Cadastre-se pelo app
2. No SQL Editor do Supabase, execute:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

## 7. Build para Produção

```bash
npm run build
npm start
```

## 8. Deploy na Vercel

1. Conecte seu repositório GitHub na [Vercel](https://vercel.com)
2. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático na branch main
