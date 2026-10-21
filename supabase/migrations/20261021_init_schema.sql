-- ==============================================================================
-- CONVERSA DATABASE ARCHITECTURE & RLS SCHEMA
-- Tenant-Isolated Multitenant Schema for Conversa AI Messaging Automation SaaS
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. WORKSPACES (Tenants)
-- ------------------------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  currency text default 'BDT',
  balance_bdt numeric(12, 2) default 0.00 check (balance_bdt >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 2. WORKSPACE MEMBERS (RBAC & Tenant Isolation)
-- ------------------------------------------------------------------------------
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'agent')) default 'owner',
  created_at timestamptz default now(),
  unique (workspace_id, user_id)
);

-- Index for fast tenant membership lookups
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_workspace_members_ws on public.workspace_members(workspace_id);

-- ------------------------------------------------------------------------------
-- 3. AI AGENTS
-- ------------------------------------------------------------------------------
create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null default 'Conversa Assistant',
  persona_prompt text default 'You are a polite, helpful customer service agent representing this business in Bangladesh. Respond clearly in natural, respectful Banglish, Bangla, or English according to the customer preference.',
  business_type text check (business_type in ('ecommerce', 'service', 'booking', 'other')) default 'ecommerce',
  business_overview text default '',
  language_style text check (language_style in ('banglish', 'bangla', 'english', 'auto')) default 'banglish',
  primary_model text default 'gemini-1.5-flash',
  is_active boolean default true,
  reply_delay_seconds int default 2,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ai_agents_workspace on public.ai_agents(workspace_id);

-- ------------------------------------------------------------------------------
-- 4. AGENT KNOWLEDGE BASE & SOP RULES
-- ------------------------------------------------------------------------------
create table if not exists public.agent_knowledge (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.ai_agents(id) on delete cascade,
  category text not null check (category in ('delivery', 'return_policy', 'payment', 'business_hours', 'general_faq', 'custom')),
  title text not null,
  content text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agent_knowledge_agent on public.agent_knowledge(agent_id);

-- ------------------------------------------------------------------------------
-- 5. PRODUCT CATALOG
-- ------------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  sku text,
  price numeric(10, 2) not null,
  stock_quantity int default 10,
  description text,
  image_urls text[] default array[]::text[],
  is_available boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_workspace on public.products(workspace_id);

-- ------------------------------------------------------------------------------
-- 6. CONNECTED CHANNELS (Meta Facebook / Instagram)
-- ------------------------------------------------------------------------------
create table if not exists public.connected_channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid references public.ai_agents(id) on delete set null,
  platform text not null check (platform in ('facebook', 'instagram', 'whatsapp')),
  platform_id text not null, -- Facebook Page ID
  account_name text not null,
  page_access_token_encrypted text not null,
  webhook_secret text,
  is_active boolean default true,
  automation_enabled boolean default false,
  comment_reply_enabled boolean default false,
  connected_at timestamptz default now(),
  unique (platform, platform_id)
);

create index if not exists idx_connected_channels_ws on public.connected_channels(workspace_id);
create index if not exists idx_connected_channels_plat on public.connected_channels(platform, platform_id);

-- ------------------------------------------------------------------------------
-- 7. CONVERSATIONS (Threads)
-- ------------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid references public.connected_channels(id) on delete set null,
  external_contact_id text not null, -- Meta PSID
  contact_name text default 'Customer',
  ai_status text check (ai_status in ('active', 'paused', 'disabled')) default 'active',
  unread_count int default 0,
  last_message_preview text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_conversations_ws on public.conversations(workspace_id);
create index if not exists idx_conversations_ext on public.conversations(channel_id, external_contact_id);

-- ------------------------------------------------------------------------------
-- 8. MESSAGES
-- ------------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'ai', 'human_agent')),
  content text not null,
  media_url text,
  external_msg_id text,
  tokens_used int default 0,
  cost_bdt numeric(8, 4) default 0.0000,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at desc);

-- ------------------------------------------------------------------------------
-- 9. CAPTURED ORDERS (Bangladeshi E-commerce Lead Pipeline)
-- ------------------------------------------------------------------------------
create table if not exists public.captured_orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(10, 2) default 0.00,
  status text check (status in ('pending', 'confirmed', 'dispatched_courier', 'cancelled')) default 'pending',
  courier_tracking_code text,
  courier_provider text check (courier_provider in ('steadfast', 'pathao', 'other')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_captured_orders_ws on public.captured_orders(workspace_id);

-- ------------------------------------------------------------------------------
-- 10. BILLING TRANSACTIONS (BDT Recharges & Usage)
-- ------------------------------------------------------------------------------
create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('recharge', 'usage_deduction', 'refund')),
  amount_bdt numeric(10, 2) not null,
  balance_after numeric(12, 2) not null,
  payment_method text, -- 'bKash', 'Nagad', 'Card'
  trx_id text,
  reference_details jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_billing_transactions_ws on public.billing_transactions(workspace_id, created_at desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Multitenant Isolation: Users can ONLY access data in workspaces they belong to.
-- ==============================================================================

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.ai_agents enable row level security;
alter table public.agent_knowledge enable row level security;
alter table public.products enable row level security;
alter table public.connected_channels enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.captured_orders enable row level security;
alter table public.billing_transactions enable row level security;

-- Helper function to check if current auth user is a member of workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

-- Helper function to get workspaces accessible by current user
create or replace function public.user_workspace_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select workspace_id from public.workspace_members
  where user_id = auth.uid();
$$;

-- 1. Workspaces Policy
create policy "Users can view workspaces they belong to"
  on public.workspaces for select
  using (id in (select public.user_workspace_ids()));

create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  to authenticated
  with check (true);

create policy "Users can update workspaces they own or admin"
  on public.workspaces for update
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = workspaces.id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- 2. Workspace Members Policy
create policy "Users can view members in their workspaces"
  on public.workspace_members for select
  using (workspace_id in (select public.user_workspace_ids()));

create policy "Users can insert themselves into workspace"
  on public.workspace_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- 3. AI Agents Policy
create policy "Workspace members can view AI agents"
  on public.ai_agents for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace admins can manage AI agents"
  on public.ai_agents for all
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = ai_agents.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- 4. Agent Knowledge Base Policy
create policy "Workspace members can access agent knowledge"
  on public.agent_knowledge for select
  using (
    exists (
      select 1 from public.ai_agents
      where id = agent_knowledge.agent_id
        and public.is_workspace_member(workspace_id)
    )
  );

create policy "Workspace admins can edit agent knowledge"
  on public.agent_knowledge for all
  using (
    exists (
      select 1 from public.ai_agents
      where id = agent_knowledge.agent_id
        and public.is_workspace_member(workspace_id)
    )
  );

-- 5. Products Policy
create policy "Workspace members can view products"
  on public.products for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace admins can manage products"
  on public.products for all
  using (public.is_workspace_member(workspace_id));

-- 6. Connected Channels Policy
create policy "Workspace members can view connected channels"
  on public.connected_channels for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace admins can manage channels"
  on public.connected_channels for all
  using (public.is_workspace_member(workspace_id));

-- 7. Conversations Policy
create policy "Workspace members can view conversations"
  on public.conversations for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can update conversations"
  on public.conversations for update
  using (public.is_workspace_member(workspace_id));

-- 8. Messages Policy
create policy "Workspace members can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where id = messages.conversation_id
        and public.is_workspace_member(workspace_id)
    )
  );

create policy "Workspace members can send messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where id = messages.conversation_id
        and public.is_workspace_member(workspace_id)
    )
  );

-- 9. Captured Orders Policy
create policy "Workspace members can view and update orders"
  on public.captured_orders for all
  using (public.is_workspace_member(workspace_id));

-- 10. Billing Policy
create policy "Workspace owners can view billing transactions"
  on public.billing_transactions for select
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = billing_transactions.workspace_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );
