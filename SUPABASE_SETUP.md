# Configuration Supabase

## 1. Créer un projet

Va sur https://supabase.com → New Project → choisis un nom et un mot de passe.

## 2. Créer les tables

Dans **SQL Editor**, exécute ce script :

```sql
-- Table presets
create table public.presets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  card_data jsonb not null default '{}',
  settings_data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Table historique
create table public.history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id text not null,
  card_data jsonb not null default '{}',
  viewed_at timestamptz default now(),
  unique(user_id, card_id)
);

-- Table favoris
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id text not null,
  card_data jsonb not null default '{}',
  created_at timestamptz default now(),
  unique(user_id, card_id)
);

-- Row Level Security (chaque user ne voit que ses données)
alter table public.presets  enable row level security;
alter table public.history  enable row level security;
alter table public.favorites enable row level security;

create policy "Users can manage their own presets"
  on public.presets for all using (auth.uid() = user_id);

create policy "Users can manage their own history"
  on public.history for all using (auth.uid() = user_id);

create policy "Users can manage their own favorites"
  on public.favorites for all using (auth.uid() = user_id);
```

## 3. Activer Google OAuth

Dans **Authentication > Providers > Google** :
- Active Google
- Ajoute ton Client ID et Client Secret Google OAuth
  (créer sur https://console.cloud.google.com)
- Ajoute l'URL de callback Supabase dans Google Cloud

## 4. Configurer les variables d'environnement

### En local
Crée un fichier `.env` à la racine :
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Sur Vercel
Settings → Environment Variables :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 5. Configurer les URLs de redirection OAuth

Dans Supabase → Authentication → URL Configuration :
- Site URL : `https://ton-site.vercel.app`
- Redirect URLs : `https://ton-site.vercel.app`
