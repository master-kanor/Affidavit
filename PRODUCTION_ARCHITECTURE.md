# Affidavit Production Architecture (`masterkanorcase.online`)

## Core System Principles

1. **Hosting**: Cloudflare Pages serving static artifacts from GitHub repository `master-kanor/Affidavit`.
2. **Custom Domain**: `masterkanorcase.online` (SSL mode: `Full (Strict)`).
3. **Database & Backend**: Supabase PostgreSQL with Row Level Security (RLS) enabled on all tables.
4. **Authentication**: Supabase Auth exclusively (Email/Password, Google OAuth, GitHub OAuth). No public sign-up for administrators (`tanauancharles1@gmail.com`).
5. **Zero Manus Authentication/Hosting**: All Manus AI runtime authentication dependencies have been removed from production paths. Manus is used solely as a development and generation environment.

---

## Service Integrations

| Layer | Technology | Configuration Target |
|---|---|---|
| **Domain & DNS** | Cloudflare DNS | `masterkanorcase.online` |
| **Edge Hosting** | Cloudflare Pages | Project `affidavit` (Directory: `dist`) |
| **Source Control** | GitHub | Repository `master-kanor/Affidavit` (`main` branch) |
| **Database & Auth** | Supabase | PostgreSQL + GoTrue Auth |
| **CI/CD** | GitHub Actions | Workflow `.github/workflows/deploy.yml` |

---

## Authentication & Authorization Model

- **Admin Account**: `tanauancharles1@gmail.com` provisioned directly in Supabase.
- **Providers**: Email, Google, GitHub.
- **Route Protection**: Client-side router guards and Supabase session validation (`useAdminCheck` / `useAuth`).
