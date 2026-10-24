# AprovaQim

Content approval for a marketing agency and its clients. The agency uploads posts, art and videos for each client; the client logs in, previews them and approves or requests changes.

## Stack

- Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4
- Supabase: Auth, Postgres with Row Level Security, Storage, Realtime
- Vercel for hosting

## Roles

| Role | Access |
|---|---|
| `agency` | All clients and posts. Creates clients, client logins and content. |
| `client` | Only their own company's posts, never drafts. Approves, requests changes, comments. |

Roles live in `auth.users.app_metadata.role` (set server-side only) and in `public.profiles`.

## Getting started

```bash
cp .env.example .env.local   # fill in the Supabase URL and keys
npm install
npm run dev
```

## Database

Migrations are in `supabase/migrations/`. Main tables: `clients`, `profiles`, `posts`, `post_media`, `comments`, `notifications`.

- Images go to the private `post-media` bucket (`{client_id}/{post_id}/{file}`); videos are Google Drive links.
- Clients approve or request changes through the `decide_post` RPC.
- Notifications are created by database triggers.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
