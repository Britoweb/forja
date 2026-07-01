-- =========================================================
-- FORJA — Schema completo (PostgreSQL / Supabase)
-- =========================================================
-- Rodar em ordem. Requer extensão pgcrypto para gen_random_uuid().
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- 1. PATTERNS (padrões — tabela, não enum, para permitir expansão)
-- =========================================================

create table patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,                    -- 'A', 'B', 'C', ...
  name text not null,
  description text,
  target_behavior text,
  status text not null default 'active', -- active | consolidated | archived
  created_at timestamptz not null default now(),
  consolidated_at timestamptz
);

create index idx_patterns_user on patterns(user_id);

-- =========================================================
-- 2. QUESTS + VERSIONAMENTO
-- =========================================================

create table quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_id uuid references patterns(id) on delete set null,
  title text not null,
  category text not null,        -- physical | relational | intellectual | pattern_specific
  quest_type text not null,      -- daily | weekly | monthly
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_quests_user on quests(user_id);

-- Cada evolução de uma quest cria uma NOVA linha aqui.
-- ended_at = null significa "versão atual".
create table quest_versions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  tier int not null default 1,           -- 1: formação, 2: consolidação, 3: maestria
  definition jsonb not null,             -- { "target": "3x/semana", "validation": "..." }
  streak_required_to_evolve int,         -- dias consistentes para subir de tier
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index idx_quest_versions_quest on quest_versions(quest_id);
create index idx_quest_versions_active on quest_versions(quest_id) where ended_at is null;

create table quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_version_id uuid not null references quest_versions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  opened_at timestamptz,                 -- quando o usuário abriu a tela da quest
  completed_at timestamptz not null default now(),
  evidence jsonb,                        -- texto/estrutura descrevendo o que foi feito
  xp_awarded int not null default 0,
  flagged boolean not null default false
);

create index idx_completions_user_date on quest_completions(user_id, completed_at);
create index idx_completions_version on quest_completions(quest_version_id);

-- =========================================================
-- 3. XP LEDGER (append-only — nunca sobrescrever)
-- =========================================================

create table xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,   -- quest | reflection | book | flashcard | bonus
  source_id uuid,
  amount int not null,
  created_at timestamptz not null default now()
);

create index idx_xp_ledger_user on xp_ledger(user_id, created_at);

-- View de conveniência: XP total e level calculado
create view user_xp_summary as
select
  user_id,
  sum(amount) as total_xp
from xp_ledger
group by user_id;

-- =========================================================
-- 4. FLASHCARDS (algoritmo SM-2)
-- =========================================================

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_id uuid references patterns(id) on delete set null,
  front text not null,
  back text not null,
  source text not null default 'manual', -- manual | quest_generated | reflection_generated | book_generated | library
  deck text not null default 'study',
  quest_id uuid references quests(id) on delete set null,
  preset_id text,
  ease_factor numeric not null default 2.5,
  interval_days int not null default 0,
  repetitions int not null default 0,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_flashcards_review on flashcards(user_id, next_review_at);
create index idx_flashcards_deck on flashcards(user_id, deck);
create index idx_flashcards_quest on flashcards(quest_id) where quest_id is not null;
create unique index idx_flashcards_unique_quest on flashcards(user_id, quest_id) where quest_id is not null;

create table flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  flashcard_id uuid not null references flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quality int not null check (quality between 0 and 5), -- resposta SM-2
  reviewed_at timestamptz not null default now()
);

create index idx_flashcard_reviews_card on flashcard_reviews(flashcard_id);

-- =========================================================
-- 5. REFLECTIONS (diário — pode referenciar múltiplos padrões)
-- =========================================================

create table reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,          -- morning | evening
  content jsonb not null,      -- estrutura das perguntas/respostas
  created_at timestamptz not null default now()
);

create index idx_reflections_user_date on reflections(user_id, created_at);

-- Junção N:N — uma reflexão pode acionar vários padrões
create table reflection_patterns (
  reflection_id uuid not null references reflections(id) on delete cascade,
  pattern_id uuid not null references patterns(id) on delete cascade,
  primary key (reflection_id, pattern_id)
);

-- =========================================================
-- 6. INCONSISTENCY FLAGS
-- =========================================================

create table inconsistency_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_triggered text not null,   -- ver docs/DETECTION_RULES.md
  severity text not null,         -- low | medium | high
  related_data jsonb,
  resolved boolean not null default false,
  user_explanation text,
  created_at timestamptz not null default now()
);

create index idx_flags_user on inconsistency_flags(user_id, created_at);
create index idx_flags_unresolved on inconsistency_flags(user_id) where resolved = false;

-- =========================================================
-- 7. BOOKS / LEARNING PATHS
-- =========================================================

create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  pattern_id uuid references patterns(id) on delete set null,
  level_min int not null default 1,
  level_max int not null default 100,
  format text,                  -- physical | ebook | audiobook
  tags jsonb,
  created_at timestamptz not null default now()
);

create table user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  status text not null default 'suggested', -- suggested | reading | completed | declined
  rating int,
  decline_reason text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_user_books_user on user_books(user_id);

-- =========================================================
-- 8. STREAKS (freeze legítimo, não trapaça)
-- =========================================================

create table streak_freezes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid references quests(id) on delete cascade,
  reason text,                  -- doença, viagem, etc.
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY — obrigatório em toda tabela com user_id
-- =========================================================

alter table patterns enable row level security;
alter table quests enable row level security;
alter table quest_versions enable row level security;
alter table quest_completions enable row level security;
alter table xp_ledger enable row level security;
alter table flashcards enable row level security;
alter table flashcard_reviews enable row level security;
alter table reflections enable row level security;
alter table reflection_patterns enable row level security;
alter table inconsistency_flags enable row level security;
alter table user_books enable row level security;
alter table streak_freezes enable row level security;

-- books é catálogo global (não tem user_id) — leitura pública, escrita restrita
alter table books enable row level security;

-- Política padrão: usuário só vê/edita seus próprios dados
create policy "own_patterns" on patterns for all using (auth.uid() = user_id);
create policy "own_quests" on quests for all using (auth.uid() = user_id);
create policy "own_completions" on quest_completions for all using (auth.uid() = user_id);
create policy "own_xp" on xp_ledger for all using (auth.uid() = user_id);
create policy "own_flashcards" on flashcards for all using (auth.uid() = user_id);
create policy "own_flashcard_reviews" on flashcard_reviews for all using (auth.uid() = user_id);
create policy "own_reflections" on reflections for all using (auth.uid() = user_id);
create policy "own_flags" on inconsistency_flags for all using (auth.uid() = user_id);
create policy "own_user_books" on user_books for all using (auth.uid() = user_id);
create policy "own_streak_freezes" on streak_freezes for all using (auth.uid() = user_id);

-- quest_versions herda proteção via join com quests (não tem user_id direto)
create policy "own_quest_versions" on quest_versions for all
  using (exists (select 1 from quests q where q.id = quest_versions.quest_id and q.user_id = auth.uid()));

-- reflection_patterns herda proteção via join com reflections
create policy "own_reflection_patterns" on reflection_patterns for all
  using (exists (select 1 from reflections r where r.id = reflection_patterns.reflection_id and r.user_id = auth.uid()));

-- books: leitura liberada a qualquer usuário autenticado, escrita bloqueada no client
create policy "read_books" on books for select using (auth.role() = 'authenticated');

-- =========================================================
-- FIM DO SCHEMA
-- =========================================================
