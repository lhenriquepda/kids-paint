-- ==========================================================================
-- Schema para o app Kids Paint (Supabase)
-- Sem Auth: acesso via chave anon, com políticas RLS permissivas.
-- ==========================================================================

-- ---------- Tabela principal ------------------------------------------------
create table if not exists public.projetos (
  id              text primary key,                   -- proj_{sessaoId}_{templateId}
  sessao_id       text not null,
  template_id     text not null,
  template_url    text,
  contorno_dataurl text,
  criado_em       timestamptz not null default now(),
  versoes         jsonb not null default '[]'::jsonb, -- array de URLs no Storage
  preview_idx     int  not null default 0
);

create index if not exists projetos_sessao_idx   on public.projetos (sessao_id);
create index if not exists projetos_template_idx on public.projetos (template_id);
create index if not exists projetos_criado_idx   on public.projetos (criado_em desc);

-- ---------- Catálogo de templates ------------------------------------------
create table if not exists public.templates (
  id         text primary key,
  nome       text not null,
  url        text not null,
  visivel    boolean not null default true,
  criado_em  timestamptz not null default now()
);

-- ---------- RLS -------------------------------------------------------------
alter table public.projetos  enable row level security;
alter table public.templates enable row level security;

drop policy if exists "projetos_all" on public.projetos;
create policy "projetos_all" on public.projetos
  for all using (true) with check (true);

drop policy if exists "templates_all" on public.templates;
create policy "templates_all" on public.templates
  for all using (true) with check (true);

-- ---------- Buckets de Storage ---------------------------------------------
insert into storage.buckets (id, name, public)
values ('obras', 'obras', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('templates', 'templates', true)
on conflict (id) do nothing;

-- Políticas de Storage (acesso público de leitura/escrita via anon)
drop policy if exists "obras_read"   on storage.objects;
drop policy if exists "obras_write"  on storage.objects;
drop policy if exists "obras_delete" on storage.objects;

create policy "obras_read" on storage.objects
  for select using (bucket_id in ('obras','templates'));

create policy "obras_write" on storage.objects
  for insert with check (bucket_id in ('obras','templates'));

create policy "obras_update" on storage.objects
  for update using (bucket_id in ('obras','templates'));

create policy "obras_delete" on storage.objects
  for delete using (bucket_id in ('obras','templates'));
