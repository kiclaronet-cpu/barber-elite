# Barber Elite ✂️

Aplicativo PWA premium de agendamento para barbearia de alto padrão.

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **PWA:** Service Worker, Manifest, Offline support
- **Deploy:** Vercel

## Estrutura

```
src/
├── app/               # Next.js App Router
│   ├── (public)/      # Home, landing
│   ├── (auth)/        # Login, cadastro
│   └── (dashboard)/   # Cliente, Admin
├── components/
│   ├── ui/            # Design system
│   ├── layout/        # Header, Footer
│   ├── home/          # Home sections
│   ├── auth/          # Login/register forms
│   ├── agendamento/   # Booking flow
│   └── admin/         # Admin components
├── lib/               # Types, utils, Supabase
├── hooks/             # Custom hooks
└── providers/         # Auth context
```

## Instalação

```bash
npm install
cp .env.example .env.local
# Preencha .env.local com credenciais Supabase
npm run dev
```

Veja `INSTRUCOES-INSTALACAO.md` para guia completo.
