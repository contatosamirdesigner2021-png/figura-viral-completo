-- ================================================
-- FIGURA VIRAL - Schema do Banco de Dados Supabase
-- Cole este SQL no Supabase > SQL Editor > Run
-- ================================================

-- Tabela de perfis de usuário
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nome text,
  plano text default 'free' check (plano in ('free','pro','agencia')),
  plano_ativo boolean default false,
  kiwify_subscriber_id text,
  assinatura_inicio timestamptz,
  assinatura_fim timestamptz,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Tabela de uso diário (controle de limite free)
create table if not exists public.uso_diario (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  data date default current_date,
  quantidade integer default 0,
  unique(user_id, data)
);

-- Tabela de figurinhas geradas (histórico)
create table if not exists public.figurinhas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  frase text not null,
  resultado jsonb,
  criado_em timestamptz default now()
);

-- Tabela de webhooks Kiwify (log de pagamentos)
create table if not exists public.webhooks_kiwify (
  id uuid default gen_random_uuid() primary key,
  evento text,
  payload jsonb,
  processado boolean default false,
  criado_em timestamptz default now()
);

-- Trigger: cria perfil automaticamente quando usuário se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS (Row Level Security) - segurança por usuário
alter table public.profiles enable row level security;
alter table public.uso_diario enable row level security;
alter table public.figurinhas enable row level security;

-- Políticas de acesso
create policy "Usuário vê só seu perfil"
  on public.profiles for select using (auth.uid() = id);

create policy "Usuário edita só seu perfil"
  on public.profiles for update using (auth.uid() = id);

create policy "Usuário vê só seu uso"
  on public.uso_diario for all using (auth.uid() = user_id);

create policy "Usuário vê só suas figurinhas"
  on public.figurinhas for all using (auth.uid() = user_id);
