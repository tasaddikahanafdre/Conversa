-- ============================================================================
-- CONVERSA STEP 3: FACEBOOK CHANNELS & OAUTH SESSIONS MIGRATION
-- ============================================================================

-- 1. OAuth Sessions table for state verification, CSRF defense, and candidate pages
create table if not exists public.meta_oauth_sessions (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_pages jsonb default '[]'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_meta_oauth_sessions_state on public.meta_oauth_sessions(state);
create index if not exists idx_meta_oauth_sessions_ws on public.meta_oauth_sessions(workspace_id);

alter table public.meta_oauth_sessions enable row level security;

drop policy if exists "Users can view their own oauth sessions" on public.meta_oauth_sessions;
create policy "Users can view their own oauth sessions"
  on public.meta_oauth_sessions for select
  using (auth.uid() = user_id);

-- 2. Enhanced attributes on connected_channels table
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'connected_channels' and column_name = 'page_picture_url'
  ) then
    alter table public.connected_channels add column page_picture_url text;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'connected_channels' and column_name = 'status'
  ) then
    alter table public.connected_channels add column status text default 'active';
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'connected_channels' and column_name = 'last_verified_at'
  ) then
    alter table public.connected_channels add column last_verified_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'connected_channels' and column_name = 'disconnected_at'
  ) then
    alter table public.connected_channels add column disconnected_at timestamptz;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'connected_channels' and column_name = 'permissions'
  ) then
    alter table public.connected_channels add column permissions jsonb default '[]'::jsonb;
  end if;

  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'connected_channels' and column_name = 'metadata'
  ) then
    alter table public.connected_channels add column metadata jsonb default '{}'::jsonb;
  end if;
end $$;
