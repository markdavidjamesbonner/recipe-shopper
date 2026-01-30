# recipe-shopper

A small Vue 3 app for keeping track of recipes. You can add, edit, and delete recipes; data is stored in [Supabase](https://supabase.com/) and loaded on the recipes page.

## What’s in this build

- **Vue 3** + **Vite** – frontend and dev server
- **Vue Router** – routes for Home, About, and **Recipes** (`/recipes`)
- **Supabase** – backend: one `recipes` table for name, ingredients, instructions, prep time, servings, notes
- **Recipes view** – list of recipe cards; add new recipes with a form; edit or delete from each card

## Project setup

### 1. Install dependencies

```sh
npm install
```

### 2. Configure Supabase

The app talks to Supabase from `src/supabase.js`. You need your own project:

1. Create a project at [supabase.com](https://supabase.com).
2. In the dashboard: **Project Settings → API**.
3. Copy the **Project URL** and the **anon public** key.
4. In this repo, open `src/supabase.js` and set:
   - `supabaseUrl` – your Project URL (e.g. `https://xxxxx.supabase.co`)
   - `supabaseKey` – your anon public key

Create a `recipes` table with columns that match the app (or use the SQL below).

**Example table (Supabase SQL Editor):**

```sql
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  ingredients text not null,
  instructions text,
  prep_time int,
  servings int,
  notes text,
  locked boolean default false
);

-- Optional: allow anonymous read/write for development
alter table public.recipes enable row level security;
create policy "Allow all for recipes" on public.recipes for all using (true) with check (true);
```

If the table already exists, add the lock column:

```sql
alter table public.recipes add column if not exists locked boolean default false;
```

Adjust RLS policies for production as needed.

### 3. Unlock password (optional)

Recipe cards can be **locked** so edit/delete are hidden. Unlocking requires a password. Set it in a `.env` file (create from `.env.example` so it isn’t committed):

```sh
cp .env.example .env
# Edit .env and set:
# VITE_UNLOCK_PASSWORD=your-secret-password
```

Only you (who know the password) can unlock cards. If `VITE_UNLOCK_PASSWORD` is not set, the app will show a message when someone tries to unlock.

### 4. Run the app

```sh
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`). Use the link to **Recipes** to view, add, edit, and delete recipes.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint (and fix where possible) |
| `npm run format` | Format `src/` with Prettier |

## Tech stack

- [Vue 3](https://vuejs.org/)
- [Vite](https://vite.dev/)
- [Vue Router](https://router.vuejs.org/)
- [Supabase JS client](https://supabase.com/docs/reference/javascript/introduction)

## Optional: IDE and browser

- **VS Code**: install the [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension (and disable Vetur if you use it).
- **Browser**: [Vue Devtools](https://devtools.vuejs.org/) (e.g. [Chrome](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)) for debugging.
